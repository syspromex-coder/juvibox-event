import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import DeleteButton from "@/components/ui/DeleteButton";
import FAB from "@/components/layout/FAB";
import CurrencyDisplay from "@/components/ui/CurrencyDisplay";
import CurrencyModeBadge from "@/components/ui/CurrencyModeBadge";
import { deleteQuote } from "@/lib/actions/quotes";
import {
  fmtDate,
  fmtDateShort,
  quoteTotals,
  getQuoteStatusLabels,
  QUOTE_STATUS_COLORS,
} from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage() {
  const t = await getServerT();
  const STATUS_LABELS = getQuoteStatusLabels(t);

  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <PageHeader
        title={t("page.cotizaciones.title")}
        subtitle={t("page.cotizaciones.subtitle")}
        action={{ href: "/cotizaciones/nuevo", label: t("page.cotizaciones.new") }}
        hideTitleOnMobile
        rightSlot={<CurrencyModeBadge />}
      />

      {quotes.length === 0 ? (
        <div className="card p-8 text-center sm:p-10">
          <p className="text-sm text-slate-500">{t("page.cotizaciones.empty")}</p>
          <Link href="/cotizaciones/nuevo" className="btn-primary mt-4">
            + {t("page.cotizaciones.empty.cta")}
          </Link>
        </div>
      ) : (
        <>
          {/* MÓVIL */}
          <ul className="space-y-3 lg:hidden">
            {quotes.map((q) => {
              const totals = quoteTotals(q.items);
              return (
                <li key={q.id} className="list-card">
                  <Link
                    href={`/cotizaciones/${q.id}/editar`}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-base font-semibold text-slate-900">
                          {q.clientName}
                        </span>
                        <span className={`badge ${QUOTE_STATUS_COLORS[q.status] ?? ""}`}>
                          {STATUS_LABELS[q.status] ?? q.status}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {q.eventType}
                        {q.eventDate ? ` · ${fmtDateShort(q.eventDate)}` : ""}
                        {" · "}{q.items.length} {t("quote.col.items").toLowerCase()}
                      </p>
                    </div>
                  </Link>
                  <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500">{t("quote.totals.cost")}</dt>
                      <dd className="text-sm font-semibold text-rose-700">
                        <CurrencyDisplay amountMxn={totals.totalCost} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500">{t("quote.totals.sale")}</dt>
                      <dd className="text-sm font-semibold text-slate-900">
                        <CurrencyDisplay amountMxn={totals.totalSale} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500">{t("quote.totals.profit")}</dt>
                      <dd
                        className={`text-sm font-semibold ${
                          totals.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        <CurrencyDisplay amountMxn={totals.profit} />
                      </dd>
                    </div>
                  </dl>
                  <div className="flex gap-2">
                    <Link
                      href={`/cotizaciones/${q.id}/editar`}
                      className="btn-secondary btn-sm flex-1"
                    >
                      {t("common.edit")}
                    </Link>
                    <DeleteButton
                      action={deleteQuote.bind(null, q.id)}
                      label={t("common.delete")}
                      className="btn-danger btn-sm flex-1"
                      message={t("quote.delete.confirm", { client: q.clientName })}
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
                    <th className="th">{t("quote.col.date")}</th>
                    <th className="th">{t("quote.col.client")}</th>
                    <th className="th">{t("quote.col.event_type")}</th>
                    <th className="th text-right">{t("quote.col.items")}</th>
                    <th className="th text-right">{t("quote.col.total_cost")}</th>
                    <th className="th text-right">{t("quote.col.total_sale")}</th>
                    <th className="th text-right">{t("quote.col.profit")}</th>
                    <th className="th text-right">{t("quote.col.margin")}</th>
                    <th className="th">{t("quote.col.status")}</th>
                    <th className="th text-right">{t("quote.col.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => {
                    const totals = quoteTotals(q.items);
                    return (
                      <tr key={q.id} className="row-hover">
                        <td className="td">
                          <div className="text-xs text-slate-500">{fmtDate(q.createdAt)}</div>
                          {q.eventDate && (
                            <div className="text-xs text-slate-400">
                              → {fmtDateShort(q.eventDate)}
                            </div>
                          )}
                        </td>
                        <td className="td">
                          <div className="font-medium text-slate-900">{q.clientName}</div>
                          {q.phone && <div className="text-xs text-slate-500">{q.phone}</div>}
                        </td>
                        <td className="td">{q.eventType}</td>
                        <td className="td text-right">{q.items.length}</td>
                        <td className="td text-right text-rose-700">
                          <CurrencyDisplay amountMxn={totals.totalCost} />
                        </td>
                        <td className="td text-right font-medium">
                          <CurrencyDisplay amountMxn={totals.totalSale} />
                        </td>
                        <td
                          className={`td text-right font-semibold ${
                            totals.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          <CurrencyDisplay amountMxn={totals.profit} />
                        </td>
                        <td className="td text-right text-slate-700">
                          {totals.margin.toFixed(0)}%
                        </td>
                        <td className="td">
                          <span className={`badge ${QUOTE_STATUS_COLORS[q.status] ?? ""}`}>
                            {STATUS_LABELS[q.status] ?? q.status}
                          </span>
                        </td>
                        <td className="td">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/cotizaciones/${q.id}/editar`}
                              className="btn-secondary btn-sm"
                            >
                              {t("common.edit")}
                            </Link>
                            <DeleteButton
                              action={deleteQuote.bind(null, q.id)}
                              label={t("common.delete")}
                              className="btn-danger btn-sm"
                              message={t("quote.delete.confirm", { client: q.clientName })}
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

      <FAB href="/cotizaciones/nuevo" label={t("common.add")} />
    </div>
  );
}
