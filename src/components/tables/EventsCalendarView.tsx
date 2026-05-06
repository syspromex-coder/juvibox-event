import Link from "next/link";
import clsx from "clsx";
import {
  getCalendarGrid,
  formatMonthName,
  formatMonthParam,
  parseMonthParam,
  addMonths,
  isToday,
  getWeekDaysShort,
  STATUS_CALENDAR_COLORS,
  STATUS_DOT_COLORS,
  getStatusLabels,
} from "@/lib/utils";
import { getServerT, getServerLang } from "@/lib/i18n-server";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type EventInCalendar = {
  id: string;
  clientName: string;
  date: Date;
  startTime: string;
  status: string;
};

type Props = {
  events: EventInCalendar[];
  monthParam?: string;
};

export default async function EventsCalendarView({ events, monthParam }: Props) {
  const t = await getServerT();
  const lang = getServerLang();
  const STATUS_LABELS = getStatusLabels(t);

  const { year, month } = parseMonthParam(monthParam);
  const cells = getCalendarGrid(year, month);
  const weekDays = getWeekDaysShort(lang);

  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);

  const byDay = new Map<string, EventInCalendar[]>();
  for (const ev of events) {
    const d = new Date(ev.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = byDay.get(key) ?? [];
    arr.push(ev);
    byDay.set(key, arr);
  }
  for (const arr of byDay.values()) {
    arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const prevHref = `/eventos?view=calendario&month=${formatMonthParam(prev.year, prev.month)}`;
  const nextHref = `/eventos?view=calendario&month=${formatMonthParam(next.year, next.month)}`;
  const todayHref = "/eventos?view=calendario";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card">
          <Link
            href={prevHref}
            aria-label={lang === "es" ? "Mes anterior" : "Previous month"}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-50 active:scale-95"
          >
            <FiChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-[160px] px-2 text-center text-sm font-semibold capitalize text-slate-900 sm:min-w-[180px] sm:text-base">
            {formatMonthName(year, month, lang)}
          </div>
          <Link
            href={nextHref}
            aria-label={lang === "es" ? "Mes siguiente" : "Next month"}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-50 active:scale-95"
          >
            <FiChevronRight className="h-5 w-5" />
          </Link>
        </div>

        <Link href={todayHref} className="btn-secondary btn-sm">
          {t("common.today")}
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {weekDays.map((d, idx) => (
            <div
              key={d}
              className={clsx(
                "px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:px-2 sm:text-xs",
                idx >= 5 && "text-brand-700"
              )}
            >
              <span className="sm:hidden">{d.slice(0, 1)}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, idx) => {
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayEvents = byDay.get(key) ?? [];
            const inMonth = date.getMonth() === month;
            const today = isToday(date);
            const isWeekend = idx % 7 >= 5;

            const MAX_VISIBLE_DESKTOP = 3;
            const MAX_VISIBLE_MOBILE = 2;
            const overflowDesktop = Math.max(0, dayEvents.length - MAX_VISIBLE_DESKTOP);
            const overflowMobile = Math.max(0, dayEvents.length - MAX_VISIBLE_MOBILE);

            return (
              <div
                key={key}
                className={clsx(
                  "flex min-h-[88px] flex-col gap-1 border-b border-r border-slate-100 p-1 sm:min-h-[120px] sm:p-1.5",
                  (idx + 1) % 7 === 0 && "border-r-0",
                  idx >= cells.length - 7 && "border-b-0",
                  !inMonth && "bg-slate-50/40",
                  isWeekend && inMonth && "bg-brand-50/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm",
                      today
                        ? "bg-brand-600 text-white"
                        : inMonth
                        ? "text-slate-800"
                        : "text-slate-400"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[9px] font-medium text-slate-400 sm:hidden">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <ul className="hidden flex-1 space-y-1 sm:block">
                  {dayEvents.slice(0, MAX_VISIBLE_DESKTOP).map((ev) => (
                    <li key={ev.id}>
                      <Link
                        href={`/eventos/${ev.id}`}
                        title={`${ev.clientName} · ${ev.startTime} · ${
                          STATUS_LABELS[ev.status] ?? ev.status
                        }`}
                        className={clsx(
                          "block truncate rounded-md px-1.5 py-0.5 text-[11px] leading-tight transition hover:opacity-80",
                          STATUS_CALENDAR_COLORS[ev.status] ?? STATUS_CALENDAR_COLORS.apartado
                        )}
                      >
                        <span className="font-mono text-[10px] opacity-75">{ev.startTime}</span>{" "}
                        <span className="font-medium">{ev.clientName}</span>
                      </Link>
                    </li>
                  ))}
                  {overflowDesktop > 0 && (
                    <li className="px-1.5 text-[10px] font-medium text-slate-500">
                      +{overflowDesktop} {lang === "es" ? "más" : "more"}
                    </li>
                  )}
                </ul>

                <ul className="flex flex-1 flex-col gap-0.5 sm:hidden">
                  {dayEvents.slice(0, MAX_VISIBLE_MOBILE).map((ev) => (
                    <li key={ev.id}>
                      <Link
                        href={`/eventos/${ev.id}`}
                        aria-label={`${ev.clientName} ${ev.startTime}`}
                        className={clsx(
                          "block h-1.5 w-full rounded-full",
                          STATUS_DOT_COLORS[ev.status] ?? STATUS_DOT_COLORS.apartado
                        )}
                      />
                    </li>
                  ))}
                  {overflowMobile > 0 && (
                    <li className="text-[9px] leading-none text-slate-500">
                      +{overflowMobile}
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs text-slate-600">
        <span className="font-medium uppercase tracking-wide text-slate-500">
          {t("events.legend")}:
        </span>
        {(["apartado", "confirmado", "pagado", "cancelado"] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={clsx("inline-block h-2.5 w-2.5 rounded-full", STATUS_DOT_COLORS[s])} />
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>

      {/* Lista de eventos del mes (móvil) */}
      <MonthEventsList
        events={events}
        year={year}
        month={month}
        STATUS_LABELS={STATUS_LABELS}
        title={t("events.month_events")}
      />
    </div>
  );
}

function MonthEventsList({
  events,
  year,
  month,
  STATUS_LABELS,
  title,
}: {
  events: EventInCalendar[];
  year: number;
  month: number;
  STATUS_LABELS: Record<string, string>;
  title: string;
}) {
  const monthEvents = events
    .filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort(
      (a, b) =>
        +new Date(a.date) - +new Date(b.date) ||
        a.startTime.localeCompare(b.startTime)
    );

  if (monthEvents.length === 0) return null;

  return (
    <details className="card sm:hidden" open>
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
        {title} ({monthEvents.length})
      </summary>
      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        {monthEvents.map((ev) => (
          <li key={ev.id}>
            <Link
              href={`/eventos/${ev.id}`}
              className="flex items-center gap-3 px-4 py-3 active:bg-slate-50"
            >
              <span
                className={clsx(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  STATUS_DOT_COLORS[ev.status] ?? STATUS_DOT_COLORS.apartado
                )}
              />
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-center">
                <div className="text-xs font-bold leading-none text-slate-800">
                  {new Date(ev.date).getDate()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">
                  {ev.clientName}
                </div>
                <div className="text-xs text-slate-500">
                  {ev.startTime} · {STATUS_LABELS[ev.status] ?? ev.status}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
