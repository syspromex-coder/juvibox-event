import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import DeleteButton from "@/components/ui/DeleteButton";
import FAB from "@/components/layout/FAB";
import CurrencyDisplay from "@/components/ui/CurrencyDisplay";
import CurrencyModeBadge from "@/components/ui/CurrencyModeBadge";
import { deleteProduct } from "@/lib/actions/products";
import { recipeCost, unitCost, unitProfit, profitMargin } from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const t = await getServerT();

  const products = await prisma.product.findMany({
    include: { ingredients: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={t("page.productos.title")}
        subtitle={t("page.productos.subtitle")}
        action={{ href: "/productos/nuevo", label: t("page.productos.new") }}
        hideTitleOnMobile
        rightSlot={<CurrencyModeBadge />}
      />

      {products.length === 0 ? (
        <div className="card p-8 text-center sm:p-10">
          <p className="text-sm text-slate-500">
            {t("page.productos.empty")}
          </p>
          <Link href="/productos/nuevo" className="btn-primary mt-4">
            + {t("page.productos.empty.cta")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => {
            const rc = recipeCost(p.ingredients);
            const uc = unitCost(p.ingredients, p.yieldQty);
            const up = unitProfit(p.ingredients, p.yieldQty, p.salePrice);
            const m = profitMargin(p.ingredients, p.yieldQty, p.salePrice);
            return (
              <article key={p.id} className="card flex flex-col p-4 sm:p-5">
                <header className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-900">
                      {p.name}
                    </h3>
                    {p.notes && (
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {p.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] uppercase text-slate-500">
                      {t("products.label.sale")}
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      <CurrencyDisplay amountMxn={p.salePrice} />
                    </div>
                  </div>
                </header>

                <dl className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase text-slate-500">
                      {t("products.label.recipe_cost")}
                    </dt>
                    <dd className="font-medium text-slate-900">
                      <CurrencyDisplay amountMxn={rc} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase text-slate-500">
                      {t("products.label.yield")}
                    </dt>
                    <dd className="font-medium text-slate-900">{p.yieldQty}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase text-slate-500">
                      {t("products.label.unit_cost")}
                    </dt>
                    <dd className="font-medium text-slate-900">
                      <CurrencyDisplay amountMxn={uc} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase text-slate-500">
                      {t("products.label.profit")}
                    </dt>
                    <dd
                      className={`font-semibold ${
                        up >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      <CurrencyDisplay amountMxn={up} />{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({m.toFixed(0)}%)
                      </span>
                    </dd>
                  </div>
                </dl>

                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
                    {t("products.label.ingredients")} ({p.ingredients.length})
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                    {p.ingredients.map((i) => (
                      <li
                        key={i.id}
                        className="flex justify-between gap-2 border-b border-dashed border-slate-100 py-1 last:border-0"
                      >
                        <span className="truncate">{i.name}</span>
                        <span className="shrink-0 text-slate-500">
                          <CurrencyDisplay amountMxn={i.cost} /> × {i.qtyUsed} ={" "}
                          <strong className="text-slate-800">
                            <CurrencyDisplay amountMxn={i.cost * i.qtyUsed} />
                          </strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/productos/${p.id}/editar`}
                    className="btn-secondary btn-sm flex-1"
                  >
                    {t("common.edit")}
                  </Link>
                  <DeleteButton
                    action={deleteProduct.bind(null, p.id)}
                    label={t("common.delete")}
                    className="btn-danger btn-sm flex-1"
                    message={t("products.delete.confirm", { name: p.name })}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <FAB href="/productos/nuevo" label={t("common.add")} />
    </div>
  );
}
