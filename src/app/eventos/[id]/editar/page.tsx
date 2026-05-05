import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EventForm from "@/components/forms/EventForm";
import PageHeader from "@/components/layout/PageHeader";
import { updateEvent } from "@/lib/actions/events";
import { getServerT } from "@/lib/i18n-server";

export default async function EditarEventoPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerT();
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();

  const update = updateEvent.bind(null, event.id);

  return (
    <div>
      <PageHeader title={t("page.eventos.edit")} subtitle={event.clientName} />
      <EventForm event={event} action={update} submitLabel={t("form.btn.save_changes")} />
    </div>
  );
}
