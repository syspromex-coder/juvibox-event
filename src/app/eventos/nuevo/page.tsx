import EventForm from "@/components/forms/EventForm";
import PageHeader from "@/components/layout/PageHeader";
import { createEvent } from "@/lib/actions/events";
import { getServerT } from "@/lib/i18n-server";

export default async function NuevoEventoPage() {
  const t = await getServerT();
  return (
    <div>
      <PageHeader
        title={t("page.eventos.new")}
        subtitle={t("form.event.subtitle")}
      />
      <EventForm action={createEvent} submitLabel={t("form.btn.create_event")} />
    </div>
  );
}
