import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import OpenInMapsButton from "@/components/ui/OpenInMapsButton";
import { deleteEvent } from "@/lib/actions/events";
import { formatAmount, type Currency } from "@/lib/currency";
import {
  fmtDate,
  pendingBalance,
  totalPaid,
  getStatusLabels,
  STATUS_COLORS,
} from "@/lib/utils";
import { getServerT, getServerLang } from "@/lib/i18n-server";

type EventWithPayments = {
  id: string;
  clientName: string;
  phone: string | null;
  eventType: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  total: number;
  deposit: number;
  /** "MXN" | "USD" — guardada en BD como string para evitar enum migrations. */
  currency: string;
  /** Para botón "Abrir en Maps". Cae a `address` si está vacío. */
  location: string | null;
  address: string | null;
  payments: { amount: number }[];
};

export default async function EventsListView({
  events,
}: {
  events: EventWithPayments[];
}) {
  const t = await getServerT();
  const lang = getServerLang();
  const STATUS_LABELS = getStatusLabels(t);

  if (events.length === 0) {
    return (
      <div className="card p-8 text-center sm:p-10">
        <p className="text-sm text-slate-500">
          {t("page.eventos.empty")}
        </p>
        <Link href="/eventos/nuevo" className="btn-primary mt-4">
          + {t("page.eventos.empty.cta")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* MÓVIL: cards */}
      <ul className="space-y-3 lg:hidden">
        {events.map((ev) => {
          const paid = totalPaid(ev);
          const balance = pendingBalance(ev);
          return (
            <li key={ev.id} className="list-card">
              <Link href={`/eventos/${ev.id}`} className="flex items-start gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <div className="text-center leading-tight">
                    <div className="text-[10px] font-medium uppercase">
                      {new Date(ev.date).toLocaleDateString(
                        lang === "es" ? "es-MX" : "en-US",
                        { month: "short" }
                      )}
                    </div>
                    <div className="text-lg font-bold">{new Date(ev.date).getDate()}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-base font-semibold text-slate-900">
                      {ev.clientName}
                    </span>
                    <span className={`badge ${STATUS_COLORS[ev.status] ?? ""}`}>
                      {STATUS_LABELS[ev.status] ?? ev.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-600">
                    {ev.eventType}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ev.startTime}–{ev.endTime}
                    {ev.phone ? ` · ${ev.phone}` : ""}
                  </p>
                </div>
              </Link>

              <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                <div>
                  <dt className="text-[10px] uppercase text-slate-500">
                    {t("events.col.total")}
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {formatAmount(ev.total, ev.currency as Currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-slate-500">
                    {t("events.col.paid")}
                  </dt>
                  <dd className="text-sm font-semibold text-emerald-700">
                    {formatAmount(paid, ev.currency as Currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-slate-500">
                    {t("events.col.balance")}
                  </dt>
                  <dd
                    className={`text-sm font-semibold ${
                      balance > 0
                        ? "text-accent-700"
                        : "text-slate-400"
                    }`}
                  >
                    {formatAmount(balance, ev.currency as Currency)}
                  </dd>
                </div>
              </dl>

              <div className="flex gap-2">
                <Link
                  href={`/eventos/${ev.id}/editar`}
                  className="btn-secondary btn-sm flex-1"
                >
                  {t("common.edit")}
                </Link>
                {/* Botón Maps inline. Si no hay location ni address, OpenInMapsButton devuelve null. */}
                <OpenInMapsButton
                  location={ev.location ?? ev.address}
                  label={t("common.open_in_maps")}
                />
                <DeleteButton
                  action={deleteEvent.bind(null, ev.id)}
                  label={t("common.delete")}
                  className="btn-danger btn-sm flex-1"
                  message={t("events.delete.confirm", { client: ev.clientName })}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* DESKTOP: tabla */}
      <div className="hidden lg:block">
        <div className="table-wrap">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="th">{t("events.col.date")}</th>
                <th className="th">{t("events.col.client")}</th>
                <th className="th">{t("events.col.type")}</th>
                <th className="th text-right">{t("events.col.total")}</th>
                <th className="th text-right">{t("events.col.paid")}</th>
                <th className="th text-right">{t("events.col.balance")}</th>
                <th className="th">{t("events.col.status")}</th>
                <th className="th text-right">{t("events.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const paid = totalPaid(ev);
                const balance = pendingBalance(ev);
                return (
                  <tr key={ev.id} className="row-hover">
                    <td className="td">
                      <div className="font-medium text-slate-900">
                        {fmtDate(ev.date)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {ev.startTime}–{ev.endTime}
                      </div>
                    </td>
                    <td className="td">
                      <Link
                        href={`/eventos/${ev.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                      >
                        {ev.clientName}
                      </Link>
                      {ev.phone && (
                        <div className="text-xs text-slate-500">
                          {ev.phone}
                        </div>
                      )}
                    </td>
                    <td className="td">{ev.eventType}</td>
                    <td className="td text-right font-medium">
                      {formatAmount(ev.total, ev.currency as Currency)}
                    </td>
                    <td className="td text-right text-emerald-700">
                      {formatAmount(paid, ev.currency as Currency)}
                    </td>
                    <td
                      className={`td text-right ${
                        balance > 0
                          ? "text-accent-700"
                          : "text-slate-400"
                      }`}
                    >
                      {formatAmount(balance, ev.currency as Currency)}
                    </td>
                    <td className="td">
                      <span className={`badge ${STATUS_COLORS[ev.status] ?? ""}`}>
                        {STATUS_LABELS[ev.status] ?? ev.status}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/eventos/${ev.id}/editar`}
                          className="btn-secondary btn-sm"
                        >
                          {t("common.edit")}
                        </Link>
                        <OpenInMapsButton
                          location={ev.location ?? ev.address}
                          label={t("common.open_in_maps")}
                        />
                        <DeleteButton
                          action={deleteEvent.bind(null, ev.id)}
                          label={t("common.delete")}
                          className="btn-danger btn-sm"
                          message={t("events.delete.confirm", {
                            client: ev.clientName,
                          })}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
