import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import FAB from "@/components/layout/FAB";
import EventsViewToggle from "@/components/tables/EventsViewToggle";
import EventsListView from "@/components/tables/EventsListView";
import EventsCalendarView from "@/components/tables/EventsCalendarView";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

type SearchParams = {
  view?: string;
  month?: string;
};

export default async function EventosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getServerT();
  const view = searchParams.view === "calendario" ? "calendario" : "lista";

  const events = await prisma.event.findMany({
    include: { payments: true },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={t("page.eventos.title")}
        subtitle={
          view === "calendario"
            ? t("page.eventos.subtitle.calendar")
            : t("page.eventos.subtitle.list")
        }
        action={{ href: "/eventos/nuevo", label: t("page.eventos.new") }}
        hideTitleOnMobile
      />

      <div className="mb-4 flex items-center justify-between">
        <EventsViewToggle current={view} monthParam={searchParams.month} />
      </div>

      {view === "calendario" ? (
        <EventsCalendarView events={events} monthParam={searchParams.month} />
      ) : (
        <EventsListView events={events} />
      )}

      <FAB href="/eventos/nuevo" label={t("common.add")} />
    </div>
  );
}
