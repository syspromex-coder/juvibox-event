import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import DeleteButton from "@/components/ui/DeleteButton";
import FAB from "@/components/layout/FAB";
import CurrencyDisplay from "@/components/ui/CurrencyDisplay";
import CurrencyModeBadge from "@/components/ui/CurrencyModeBadge";
import { deleteExpense } from "@/lib/actions/expenses";
import { fmtDate, fmtDateShort, startOfMonth, endOfMonth } from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function GastosPage() {
  const t = await getServerT();

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { event: true },
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();
  const monthTotal = expenses
    .filter((e) => e.date >= monthStart && e.date <= monthEnd)
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title={t("page.gastos.title")}
        subtitle={
          <>
            <CurrencyDisplay amountMxn={monthTotal} />{" "}
            <span className="text-slate-400">·</span> {t("common.total")}:{" "}
            <CurrencyDisplay amountMxn={total} />
          </>
        }
        action={{ href: "/gastos/nuevo", label: t("page.gastos.new") }}
        hideTitleOnMobile
        rightSlot={<CurrencyModeBadge />}
      />

      {expenses.length === 0 ? (
        <div className="card p-8 text-center sm:p-10">
          <p className="text-sm text-slate-500">
            {t("page.gastos.empty")}
          </p>
          <Link href="/gastos/nuevo" className="btn-primary mt-4">
            + {t("page.gastos.empty.cta")}
          </Link>
        </div>
      ) : (
        <>
          {/* MÓVIL */}
          <ul className="space-y-3 lg:hidden">
            {expenses.map((x) => (
              <li key={x.id} className="list-card">
                <Link
                  href={`/gastos/${x.id}/editar`}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="badge border-slate-200 bg-slate-50 text-slate-700">
                        {x.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        {fmtDateShort(x.date)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">
                      {x.description}
                    </p>
                    {x.event && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {t("expenses.col.event")}: {x.event.clientName}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-rose-700">
                      <CurrencyDisplay amountMxn={x.amount} />
                    </div>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <Link
                    href={`/gastos/${x.id}/editar`}
                    className="btn-secondary btn-sm flex-1"
                  >
                    {t("common.edit")}
                  </Link>
                  <DeleteButton
                    action={deleteExpense.bind(null, x.id)}
                    label={t("common.delete")}
                    className="btn-danger btn-sm flex-1"
                    message={t("expenses.delete.confirm")}
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
                    <th className="th">{t("expenses.col.date")}</th>
                    <th className="th">{t("expenses.col.category")}</th>
                    <th className="th">{t("expenses.col.description")}</th>
                    <th className="th">{t("expenses.col.event")}</th>
                    <th className="th text-right">{t("expenses.col.amount")}</th>
                    <th className="th text-right">{t("expenses.col.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((x) => (
                    <tr key={x.id} className="row-hover">
                      <td className="td">{fmtDate(x.date)}</td>
                      <td className="td">
                        <span className="badge border-slate-200 bg-slate-50 text-slate-700">
                          {x.category}
                        </span>
                      </td>
                      <td className="td">{x.description}</td>
                      <td className="td text-slate-600">
                        {x.event ? x.event.clientName : t("common.empty_dash")}
                      </td>
                      <td className="td text-right font-semibold text-rose-700">
                        <CurrencyDisplay amountMxn={x.amount} />
                      </td>
                      <td className="td">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/gastos/${x.id}/editar`}
                            className="btn-secondary btn-sm"
                          >
                            {t("common.edit")}
                          </Link>
                          <DeleteButton
                            action={deleteExpense.bind(null, x.id)}
                            label={t("common.delete")}
                            className="btn-danger btn-sm"
                            message={t("expenses.delete.confirm")}
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

      <FAB href="/gastos/nuevo" label={t("common.add")} />
    </div>
  );
}
