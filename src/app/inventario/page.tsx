import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import DeleteButton from "@/components/ui/DeleteButton";
import FAB from "@/components/layout/FAB";
import CurrencyDisplay from "@/components/ui/CurrencyDisplay";
import CurrencyModeBadge from "@/components/ui/CurrencyModeBadge";
import { deleteInventoryItem } from "@/lib/actions/inventory";
import {
  inventoryItemValue,
  inventoryTotalValue,
  isLowStock,
  getUnitLabels,
} from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const t = await getServerT();
  const UNIT = getUnitLabels(t);

  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });

  const totalValue = inventoryTotalValue(items);
  const lowCount = items.filter(isLowStock).length;

  return (
    <div>
      <PageHeader
        title={t("page.inventario.title")}
        subtitle={t("page.inventario.subtitle")}
        action={{ href: "/inventario/nuevo", label: t("page.inventario.new") }}
        hideTitleOnMobile
        rightSlot={<CurrencyModeBadge />}
      />

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label={t("inventory.kpi.items_count")} value={String(items.length)} />
        <StatCard
          label={t("inventory.kpi.low_count")}
          value={String(lowCount)}
          tone={lowCount > 0 ? "warn" : "neutral"}
          highlight={lowCount > 0}
        />
        <StatCard
          label={t("inventory.kpi.total_value")}
          value={<CurrencyDisplay amountMxn={totalValue} />}
          tone="brand"
          highlight
        />
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center sm:p-10">
          <p className="text-sm text-slate-500">{t("page.inventario.empty")}</p>
          <Link href="/inventario/nuevo" className="btn-primary mt-4">
            + {t("page.inventario.empty.cta")}
          </Link>
        </div>
      ) : (
        <>
          {/* MÓVIL */}
          <ul className="space-y-3 lg:hidden">
            {items.map((it) => {
              const low = isLowStock(it);
              const value = inventoryItemValue(it);
              return (
                <li key={it.id} className="list-card">
                  <Link
                    href={`/inventario/${it.id}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-base font-semibold text-slate-900">
                          {it.name}
                        </span>
                        {low && (
                          <span className="badge border-rose-200 bg-rose-50 text-rose-700">
                            ⚠ {t("inventory.low_stock.badge")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {it.category} · {it.supplier ?? t("common.empty_dash")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-lg font-bold ${low ? "text-rose-700" : "text-slate-900"}`}>
                        {it.stock} {UNIT[it.unit] ?? it.unit}
                      </div>
                      <div className="text-xs text-slate-500">
                        Mín: {it.minStock}
                      </div>
                    </div>
                  </Link>
                  <dl className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500">{t("inventory.col.cost")}</dt>
                      <dd className="text-sm font-medium text-slate-900">
                        <CurrencyDisplay amountMxn={it.unitCost} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500">{t("inventory.col.value")}</dt>
                      <dd className="text-sm font-semibold text-brand-700">
                        <CurrencyDisplay amountMxn={value} />
                      </dd>
                    </div>
                  </dl>
                  <div className="flex gap-2">
                    <Link href={`/inventario/${it.id}`} className="btn-secondary btn-sm flex-1">
                      {t("common.see_more")}
                    </Link>
                    <Link
                      href={`/inventario/${it.id}/editar`}
                      className="btn-secondary btn-sm flex-1"
                    >
                      {t("common.edit")}
                    </Link>
                    <DeleteButton
                      action={deleteInventoryItem.bind(null, it.id)}
                      label={t("common.delete")}
                      className="btn-danger btn-sm flex-1"
                      message={t("inventory.delete.confirm", { name: it.name })}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* DESKTOP */}
          <div className="hidden lg:block">
            <div className="table-wrap">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="th">{t("inventory.col.name")}</th>
                    <th className="th">{t("inventory.col.category")}</th>
                    <th className="th text-right">{t("inventory.col.stock")}</th>
                    <th className="th text-right">{t("inventory.col.min")}</th>
                    <th className="th text-right">{t("inventory.col.cost")}</th>
                    <th className="th text-right">{t("inventory.col.value")}</th>
                    <th className="th text-right">{t("inventory.col.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const low = isLowStock(it);
                    const value = inventoryItemValue(it);
                    return (
                      <tr key={it.id} className="row-hover">
                        <td className="td">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/inventario/${it.id}`}
                              className="font-medium text-slate-900 hover:underline"
                            >
                              {it.name}
                            </Link>
                            {low && (
                              <span className="badge border-rose-200 bg-rose-50 text-rose-700">
                                ⚠ {t("inventory.low_stock.badge")}
                              </span>
                            )}
                          </div>
                          {it.supplier && (
                            <div className="text-xs text-slate-500">{it.supplier}</div>
                          )}
                        </td>
                        <td className="td">
                          <span className="badge border-slate-200 bg-slate-50 text-slate-700">
                            {it.category}
                          </span>
                        </td>
                        <td className={`td text-right font-medium ${low ? "text-rose-700" : ""}`}>
                          {it.stock} <span className="text-xs text-slate-500">{UNIT[it.unit] ?? it.unit}</span>
                        </td>
                        <td className="td text-right text-slate-500">{it.minStock}</td>
                        <td className="td text-right">
                          <CurrencyDisplay amountMxn={it.unitCost} />
                        </td>
                        <td className="td text-right font-semibold text-brand-700">
                          <CurrencyDisplay amountMxn={value} />
                        </td>
                        <td className="td">
                          <div className="flex justify-end gap-2">
                            <Link href={`/inventario/${it.id}`} className="btn-secondary btn-sm">
                              {t("common.see_more")}
                            </Link>
                            <Link
                              href={`/inventario/${it.id}/editar`}
                              className="btn-secondary btn-sm"
                            >
                              {t("common.edit")}
                            </Link>
                            <DeleteButton
                              action={deleteInventoryItem.bind(null, it.id)}
                              label={t("common.delete")}
                              className="btn-danger btn-sm"
                              message={t("inventory.delete.confirm", { name: it.name })}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <FAB href="/inventario/nuevo" label={t("common.add")} />
    </div>
  );
}
