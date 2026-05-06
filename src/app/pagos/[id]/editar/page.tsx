import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PaymentForm from "@/components/forms/PaymentForm";
import PageHeader from "@/components/layout/PageHeader";
import { updatePayment } from "@/lib/actions/payments";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function EditarPagoPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerT();
  const [payment, events] = await Promise.all([
    prisma.payment.findUnique({ where: { id: params.id } }),
    prisma.event.findMany({
      orderBy: { date: "asc" },
      select: { id: true, clientName: true, eventType: true, date: true },
    }),
  ]);
  if (!payment) notFound();

  const update = updatePayment.bind(null, payment.id);

  return (
    <div>
      <PageHeader title={t("page.pagos.edit")} />
      <PaymentForm
        payment={payment}
        events={events}
        action={update}
        submitLabel={t("form.btn.save_changes")}
      />
    </div>
  );
}
