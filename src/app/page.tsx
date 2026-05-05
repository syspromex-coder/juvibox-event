import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/layout/PageHeader";
import CurrencyDisplay from "@/components/ui/CurrencyDisplay";
import { formatAmount, type Currency } from "@/lib/currency";
import CurrencyModeBadge from "@/components/ui/CurrencyModeBadge";
import {
  fmtDate,
  pendingBalance,
  totalPaid,
  startOfMonth,
  endOfMonth,
  getStatusLabels,
  STATUS_COLORS,
  isLowStock,
  inventoryTotalValue,
  getUnitLabels,
  getMovementLabels,
  MOVEMENT_COLORS,
} from "@/lib/utils";
import { getServerT, getServerLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = await getServerT();
  const lang = getServerLang();
  const STATUS_LABELS = getStatusLabels(t);
  const UNIT = getUnitLabels(t);
  const MOV = getMovementLabels(t);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    upcoming,
    allEvents,
    monthPayments,
    monthExpenses,
    monthEvents,
    invItems,
    recentMovements,
  ] = await Promise.all([
    prisma.event.findMany({
      where: {
        date: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        status: { not: "cancelado" },
      },
      include: { payments: true },
      orderBy: { date: "asc" },
      take: 6,
    }),
    prisma.event.findMany({ include: { payments: true } }),
    prisma.payment.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.expense.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.event.findMany({
      where: { date: { gte: monthStart, lte: monthEnd }, status: { not: "cancelado" } },
      include: { payments: true },
    }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    prisma.inventoryMovement.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { item: { select: { id: true, name: true, unit: true } } },
    }),
  ]);

  // Cálculos SIEMPRE en MXN (la BD guarda en MXN)
  const incomeMonth = monthPayments.reduce((s, p) => s + p.amount, 0);
  const expensesMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const profitMonth = incomeMonth - expensesMonth;

  const pending = allEvents.filter((e) => e.status !== "cancelado");
  const pendingTotal = pending.reduce((s, e) => s + pendingBalance(e), 0);
  const pendingList = pending
    .filter((e) => pendingBalance(e) > 0)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 6);

  const eventsBookedMonth = monthEvents.length;
  const monthLabel = now.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
    month: "long",
    year: "numeric",
  });

  // Inventario
  const invLow = invItems.filter(isLowStock);
  const invValue = inventoryTotalValue(invItems);

  return (
    <div>
      <PageHeader
        title={t("page.dashboard.title")}
        subtitle={t("page.dashboard.subtitle", { month: monthLabel })}
        hideTitleOnMobile
        rightSlot={<CurrencyModeBadge />}
      />

      {/* KPIs principales — utilidad y por cobrar destacados como tarjetas grandes */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("kpi.income")}
          value={<CurrencyDisplay amountMxn={incomeMonth} />}
          tone="success"
        />
        <StatCard
          label={t("kpi.expenses")}
          value={<CurrencyDisplay amountMxn={expensesMonth} />}
          tone="danger"
        />
        <StatCard
          label={t("kpi.profit")}
          value={<CurrencyDisplay amountMxn={profitMonth} />}
          tone={profitMonth >= 0 ? "success" : "danger"}
          hint={t("kpi.profit.hint")}
          highlight
        />
        <StatCard
          label={t("kpi.pending")}
          value={<CurrencyDisplay amountMxn={pendingTotal} />}
          tone={pendingTotal > 0 ? "warn" : "neutral"}
          hint={t("kpi.pending.hint")}
          highlight
        />
      </div>

      {/* KPIs secundarios */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-4 lg:grid-cols-4 lg:gap-4">
        <StatCard label={t("kpi.events_month")} value={String(eventsBookedMonth)} />
        <StatCard label={t("kpi.upcoming")} value={String(upcoming.length)} />
        <StatCard
          label={t("kpi.confirmed")}
          value={String(allEvents.filter((e) => e.status === "confirmado").length)}
        />
        <StatCard
          label={t("kpi.paid")}
          value={String(allEvents.filter((e) => e.status === "pagado").length)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Próximos eventos */}
        <section className="card lg:col-span-2">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-slate-900">
              {t("dashboard.upcoming.title")}
            </h2>
            <Link
              href="/eventos"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {t("common.see_all")} →
            </Link>
          </header>
          {upcoming.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              {t("dashboard.upcoming.empty")}{" "}
              <Link
                href="/eventos/nuevo"
                className="text-brand-700 hover:underline"
              >
                {t("dashboard.upcoming.create")}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((ev) => {
                const balance = pendingBalance(ev);
                return (
                  <li key={ev.id}>
                    <Link
                      href={`/eventos/${ev.id}/editar`}
                      className="flex items-center gap-3 px-4 py-4 active:bg-slate-50 sm:gap-4 sm:px-5"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <div className="text-center leading-tight">
                          <div className="text-[10px] font-medium uppercase">
                            {new Date(ev.date).toLocaleDateString(
                              lang === "es" ? "es-MX" : "en-US",
                              { month: "short" }
                            )}
                          </div>
                          <div className="text-base font-bold">
                            {new Date(ev.date).getDate()}
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate font-medium text-slate-900">
                            {ev.clientName}
                          </span>
                          <span className={`badge ${STATUS_COLORS[ev.status] ?? ""}`}>
                            {STATUS_LABELS[ev.status] ?? ev.status}
                          </span>
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {ev.eventType} · {ev.startTime}–{ev.endTime}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-slate-900">
                          {formatAmount(ev.total, ev.currency as Currency)}
                        </div>
                        {balance > 0 ? (
                          <div className="text-xs text-accent-700">
                            {t("dashboard.pending.short")}:{" "}
                            <span className="font-medium">
                              {formatAmount(balance, ev.currency as Currency)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-700">
                            {t("status.liquidated")}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Pagos pendientes */}
        <section className="card">
          <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-slate-900">
              {t("dashboard.pending.title")}
            </h2>
          </header>
          {pendingList.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              {t("dashboard.pending.empty")}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingList.map((ev) => (
                <li key={ev.id}>
                  <Link
                    href={`/eventos/${ev.id}/editar`}
                    className="flex items-center justify-between gap-3 px-4 py-3 active:bg-slate-50 sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {ev.clientName}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {fmtDate(ev.date)} · {t("dashboard.paid_label")}{" "}
                        {formatAmount(totalPaid(ev), ev.currency as Currency)}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-accent-700">
                      {formatAmount(pendingBalance(ev), ev.currency as Currency)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ===== Inventario ===== */}
      {(invItems.length > 0 || recentMovements.length > 0) && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("inventory.dashboard.title")}
            </h2>
            <Link
              href="/inventario"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {t("common.see_all")} →
            </Link>
          </div>

          {/* KPIs de inventario */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            <StatCard label={t("inventory.kpi.items_count")} value={String(invItems.length)} />
            <StatCard
              label={t("inventory.kpi.low_count")}
              value={String(invLow.length)}
              tone={invLow.length > 0 ? "warn" : "neutral"}
              highlight={invLow.length > 0}
            />
            <StatCard
              label={t("inventory.kpi.total_value")}
              value={<CurrencyDisplay amountMxn={invValue} />}
              tone="brand"
              highlight
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Stock bajo */}
            <div className="card overflow-hidden">
              <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t("inventory.dashboard.low_items")} ({invLow.length})
                </h3>
              </header>
              {invLow.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  ✓ {t("dashboard.pending.empty")}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {invLow.slice(0, 5).map((it) => (
                    <li key={it.id}>
                      <Link
                        href={`/inventario/${it.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 active:bg-slate-50 sm:px-5"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {it.name}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {it.category} · Mín {it.minStock} {UNIT[it.unit] ?? it.unit}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                          {it.stock} {UNIT[it.unit] ?? it.unit}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Movimientos recientes */}
            <div className="card overflow-hidden">
              <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t("inventory.dashboard.recent_movements")}
                </h3>
              </header>
              {recentMovements.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  {t("inventory.history.empty")}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentMovements.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <span className={`badge shrink-0 ${MOVEMENT_COLORS[m.type] ?? ""}`}>
                        {MOV[m.type] ?? m.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {m.item?.name ?? "—"}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {fmtDate(m.date)} · {m.qty} {UNIT[m.item?.unit ?? "piezas"] ?? m.item?.unit}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
