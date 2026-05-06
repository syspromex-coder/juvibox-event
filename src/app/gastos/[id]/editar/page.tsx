import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpenseForm from "@/components/forms/ExpenseForm";
import PageHeader from "@/components/layout/PageHeader";
import { updateExpense } from "@/lib/actions/expenses";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function EditarGastoPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerT();
  const [expense, events] = await Promise.all([
    prisma.expense.findUnique({ where: { id: params.id } }),
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: { id: true, clientName: true, eventType: true, date: true },
    }),
  ]);
  if (!expense) notFound();

  const update = updateExpense.bind(null, expense.id);

  return (
    <div>
      <PageHeader title={t("page.gastos.edit")} />
      <ExpenseForm
        expense={expense}
        events={events}
        action={update}
        submitLabel={t("form.btn.save_changes")}
      />
    </div>
  );
}
