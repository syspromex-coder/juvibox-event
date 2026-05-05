import { prisma } from "@/lib/prisma";
import ExpenseForm from "@/components/forms/ExpenseForm";
import PageHeader from "@/components/layout/PageHeader";
import { createExpense } from "@/lib/actions/expenses";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function NuevoGastoPage() {
  const t = await getServerT();
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    select: { id: true, clientName: true, eventType: true, date: true },
  });

  return (
    <div>
      <PageHeader
        title={t("page.gastos.new")}
        subtitle={t("form.expense.subtitle")}
      />
      <ExpenseForm
        events={events}
        action={createExpense}
        submitLabel={t("form.btn.create_expense")}
      />
    </div>
  );
}
