import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import CurrencyDisplay from "@/components/ui/CurrencyDisplay";
import DeleteButton from "@/components/ui/DeleteButton";
import {
  inventoryItemValue,
  isLowStock,
  fmtDate,
  getUnitLabels,
  getMovementLabels,
  MOVEMENT_COLORS,
} from "@/lib/utils";
import { deleteInventoryMovement } from "@/lib/actions/inventory";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function ArticuloDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerT();
  const UNIT = getUnitLabels(t);
  const MOV = getMovementLabels(t);

  const item = await prisma.inventoryItem.findUnique({
    where: { id: params.id },
    include: {
      movements: {
        orderBy: { date: "desc" },
        include: { event: { select: { id: true, clientName: true } } },
      },
    },
  });
  if (!item) notFound();

  const low = isLowStock(item);
  const value = inventoryItemValue(item);

  return (
    <div>
      <PageHeader
        title={item.name}
        subtitle={`${item.category} · ${UNIT[item.unit] ?? item.unit}${
          item.supplier ? ` · ${item.supplier}` : ""
        }`}
      />

      {/* KPIs del artículo */}
      <div className="mb-5 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("inventory.col.stock")}
          </div>
          <div
            className={`mt-1 text-2xl font-bold ${
              low ? "text-rose-700" : "text-slate-900"
            }`}
          >
            {item.stock} <span className="text-sm font-normal text-slate-500">{UNIT[item.unit] ?? item.unit}</span>
          </div>
          {low && (
            <div className="mt-1 text-xs font-medium text-rose-700">
              ⚠ {t("inventory.low_stock.badge")}
            </div>
          )}
        </div>
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("inventory.col.cost")}
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            <CurrencyDisplay amountMxn={item.unitCost} />
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("inventory.col.value")}
          </div>
          <div className="mt-1 text-xl font-semibold text-brand-700">
            <CurrencyDisplay amountMxn={value} />
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/inventario/${item.id}/editar`}
          className="btn-secondary"
        >
          {t("common.edit")}
        </Link>
        <Link
          href={`/inventario/movimientos/nuevo?itemId=${item.id}`}
          className="btn-primary"
        >
          + {t("page.inventario.movement.new")}
        </Link>
      </div>

      {/* Historial */}
      <div className="card overflow-hidden">
        <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-slate-900">
            {t("inventory.history")} ({item.movements.length})
          </h2>
        </header>
        {item.movements.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {t("inventory.history.empty")}
          </p>
        ) : (
          <>
            {/* Móvil */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {item.movements.map((m) => (
                <li key={m.id} className="flex items-start gap-3 p-4">
                  <span
                    className={`badge shrink-0 ${MOVEMENT_COLORS[m.type] ?? ""}`}
                  >
                    {MOV[m.type] ?? m.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900">
                      {m.qty} {UNIT[item.unit] ?? item.unit} · <CurrencyDisplay amountMxn={m.unitCost} />
                    </div>
                    <div className="text-xs text-slate-500">
                      {fmtDate(m.date)}
                      {m.event && ` · ${m.event.clientName}`}
                    </div>
                    {(m.reason || m.note) && (
                      <div className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                        {m.reason ?? m.note}
                      </div>
                    )}
                  </div>
                  <DeleteButton
                    action={deleteInventoryMovement.bind(null, m.id)}
                    label="✕"
                    className="btn-danger btn-sm"
                    message={t("inventory.movement.delete.confirm")}
                  />
                </li>
              ))}
            </ul>

            {/* Desktop */}
            <div className="hidden lg:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="th">{t("inventory.history.col.date")}</th>
                    <th className="th">{t("inventory.history.col.type")}</th>
                    <th className="th text-right">{t("inventory.history.col.qty")}</th>
                    <th className="th text-right">{t("inventory.history.col.cost")}</th>
                    <th className="th">{t("inventory.history.col.event")}</th>
                    <th className="th">{t("inventory.history.col.note")}</th>
                    <th className="th text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {item.movements.map((m) => (
                    <tr key={m.id} className="row-hover">
                      <td className="td">{fmtDate(m.date)}</td>
                      <td className="td">
                        <span className={`badge ${MOVEMENT_COLORS[m.type] ?? ""}`}>
                          {MOV[m.type] ?? m.type}
                        </span>
                      </td>
                      <td className="td text-right font-medium">
                        {m.qty} <span className="text-xs text-slate-500">{UNIT[item.unit] ?? item.unit}</span>
                      </td>
                      <td className="td text-right">
                        <CurrencyDisplay amountMxn={m.unitCost} />
                      </td>
                      <td className="td text-slate-600">
                        {m.event ? (
                          <Link
                            href={`/eventos/${m.event.id}`}
                            className="hover:underline"
                          >
                            {m.event.clientName}
                          </Link>
                        ) : (
                          t("common.empty_dash")
                        )}
                      </td>
                      <td className="td max-w-xs truncate text-slate-600">
                        {m.reason ?? m.note ?? t("common.empty_dash")}
                      </td>
                      <td className="td">
                        <div className="flex justify-end">
                          <DeleteButton
                            action={deleteInventoryMovement.bind(null, m.id)}
                            label={t("common.delete")}
                            className="btn-danger btn-sm"
                            message={t("inventory.movement.delete.confirm")}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
