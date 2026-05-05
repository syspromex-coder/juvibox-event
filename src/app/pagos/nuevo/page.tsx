import { prisma } from "@/lib/prisma";
import PaymentForm from "@/components/forms/PaymentForm";
import PageHeader from "@/components/layout/PageHeader";
import { createPayment } from "@/lib/actions/payments";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function NuevoPagoPage() {
  const t = await getServerT();
  const events = await prisma.event.findMany({
    where: { status: { not: "cancelado" } },
    orderBy: { date: "asc" },
    select: { id: true, clientName: true, eventType: true, date: true },
  });

  return (
    <div>
      <PageHeader
        title={t("page.pagos.new")}
        subtitle={t("form.payment.subtitle")}
      />
      <PaymentForm
        events={events}
        action={createPayment}
        submitLabel={t("form.btn.create_payment")}
      />
    </div>
  );
}
