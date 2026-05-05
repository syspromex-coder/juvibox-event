import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import DeleteButton from "@/components/ui/DeleteButton";
import FAB from "@/components/layout/FAB";
import CurrencyDisplay from "@/components/ui/CurrencyDisplay";
import CurrencyModeBadge from "@/components/ui/CurrencyModeBadge";
import { formatAmount, type Currency } from "@/lib/currency";
import { deletePayment } from "@/lib/actions/payments";
import { fmtDate, fmtDateShort, getMethodLabels } from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const METHOD_COLORS: Record<string, string> = {
  efectivo:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  transferencia:
    "bg-accent-50 text-accent-700 border-accent-200",
  tarjeta:
    "bg-brand-50 text-brand-700 border-brand-200",
  anticipo:
    "bg-highlight-50 text-highlight-800 border-highlight-200",
  otro: "bg-slate-100 text-slate-700 border-slate-200",
};

export default async function PagosPage() {
  const t = await getServerT();
  const METHOD_LABELS = getMethodLabels(t);

  const payments = await prisma.payment.findMany({
    orderBy: { date: "desc" },
    include: { event: true },
  });

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader
        title={t("page.pagos.title")}
        subtitle={
          <>
            {t("page.pagos.subtitle", { count: payments.length })}{" "}
            <CurrencyDisplay amountMxn={total} />
          </>
        }
        action={{ href: "/pagos/nuevo", label: t("page.pagos.new") }}
        hideTitleOnMobile
        rightSlot={<CurrencyModeBadge />}
      />

      {payments.length === 0 ? (
        <div className="card p-8 text-center sm:p-10">
          <p className="text-sm text-slate-500">
            {t("page.pagos.empty")}
          </p>
          <Link href="/pagos/nuevo" className="btn-primary mt-4">
            + {t("page.pagos.empty.cta")}
          </Link>
        </div>
      ) : (
        <>
          {/* MÓVIL */}
          <ul className="space-y-3 lg:hidden">
            {payments.map((p) => (
              <li key={p.id} className="list-card">
                <Link
                  href={`/pagos/${p.id}/editar`}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {p.event.clientName}
                      </p>
                      <span
                        className={`badge ${METHOD_COLORS[p.method] ?? METHOD_COLORS.otro}`}
                      >
                        {METHOD_LABELS[p.method] ?? p.method}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {p.event.eventType} · {fmtDateShort(p.date)}
                    </p>
                    {p.note && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                        {p.note}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-emerald-700">
                      {formatAmount(p.amount, p.event.currency as Currency)}
                    </div>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <Link
                    href={`/pagos/${p.id}/editar`}
                    className="btn-secondary btn-sm flex-1"
                  >
                    {t("common.edit")}
                  </Link>
                  <DeleteButton
                    action={deletePayment.bind(null, p.id)}
                    label={t("common.delete")}
                    className="btn-danger btn-sm flex-1"
                    message={t("payments.delete.confirm")}
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* DESKTOP */}
          <div className="hidden lg:block">
            <div className="table-wrap">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="th">{t("payments.col.date")}</th>
                    <th className="th">{t("payments.col.client_event")}</th>
                    <th className="th">{t("payments.col.method")}</th>
                    <th className="th">{t("payments.col.note")}</th>
                    <th className="th text-right">{t("payments.col.amount")}</th>
                    <th className="th text-right">{t("payments.col.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="row-hover">
                      <td className="td">{fmtDate(p.date)}</td>
                      <td className="td">
                        <div className="font-medium text-slate-900">
                          {p.event.clientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.event.eventType}
                        </div>
                      </td>
                      <td className="td capitalize">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      <td className="td text-slate-600">
                        {p.note ?? t("common.empty_dash")}
                      </td>
                      <td className="td text-right font-semibold text-emerald-700">
                        {formatAmount(p.amount, p.event.currency as Currency)}
                      </td>
                      <td className="td">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/pagos/${p.id}/editar`}
                            className="btn-secondary btn-sm"
                          >
                            {t("common.edit")}
                          </Link>
                          <DeleteButton
                            action={deletePayment.bind(null, p.id)}
                            label={t("common.delete")}
                            className="btn-danger btn-sm"
                            message={t("payments.delete.confirm")}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <FAB href="/pagos/nuevo" label={t("common.add")} />
    </div>
  );
}
