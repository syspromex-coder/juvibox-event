import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { fmtDate, getStatusLabels, STATUS_COLORS } from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function MiAgendaPage() {
  const t = await getServerT();
  const session = await getServerSession(authOptions);
  const STATUS_LABELS = getStatusLabels(t);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = await prisma.event.findMany({
    where: {
      date: { gte: today },
      status: { not: "cancelado" },
    },
    orderBy: { date: "asc" },
    take: 30,
  });

  const userName = session?.user?.name ?? "";

  return (
    <div>
      <PageHeader
        title={t("page.mi-agenda.title")}
        subtitle={t("page.mi-agenda.welcome", { name: userName })}
        hideTitleOnMobile
      />

      <div className="mb-4 flex items-center gap-2">
        <span className="badge border-accent-200 bg-accent-50 text-accent-800">
          {t("role.empleado")}
        </span>
        <span className="text-xs text-slate-500">
          {t("page.mi-agenda.read_only")}
        </span>
      </div>

      {upcoming.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-slate-500">{t("page.mi-agenda.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((ev) => (
            <li key={ev.id} className="card p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <div className="text-center leading-tight">
                    <div className="text-[10px] font-medium uppercase">
                      {new Date(ev.date).toLocaleDateString("es-MX", { month: "short" })}
                    </div>
                    <div className="text-lg font-bold">{new Date(ev.date).getDate()}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-base font-semibold text-slate-900">
                      {ev.clientName}
                    </span>
                    <span className={`badge ${STATUS_COLORS[ev.status] ?? ""}`}>
                      {STATUS_LABELS[ev.status] ?? ev.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-600">{ev.eventType}</div>
                  <div className="mt-1.5 grid grid-cols-1 gap-1 text-xs text-slate-500 sm:grid-cols-2">
                    <div>
                      📅 {fmtDate(ev.date)} · {ev.startTime}–{ev.endTime}
                    </div>
                    {ev.address && <div className="truncate">📍 {ev.address}</div>}
                  </div>
                  {ev.services && (
                    <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      <span className="font-medium text-slate-600">
                        {t("page.mi-agenda.services")}:
                      </span>{" "}
                      {ev.services}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
