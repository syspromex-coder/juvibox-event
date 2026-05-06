import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import OpenInMapsButton from "@/components/ui/OpenInMapsButton";
import { formatAmount, type Currency } from "@/lib/currency";
import {
  fmtDate,
  totalPaid,
  pendingBalance,
  paymentAmountMxn,
  getStatusLabels,
  getMethodLabels,
  STATUS_COLORS,
} from "@/lib/utils";
import { getServerT, getServerLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

/**
 * Página de detalle/reporte del evento.
 *
 * Diseño:
 *   - Header con nombre del cliente + botón "Editar evento" en esquina (rightSlot)
 *   - Tarjetas apiladas: General, Ubicación, Servicios/Notas, Finanzas
 *   - Acciones inferiores tipo sticky: "Volver" + "Editar evento" (full-width móvil)
 *
 * No edita nada — todo es solo lectura. Para edición, se navega a
 * /eventos/[id]/editar (la página existente, que no se modificó).
 */
export default async function EventoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerT();
  const lang = getServerLang();
  const STATUS_LABELS = getStatusLabels(t);
  const METHOD_LABELS = getMethodLabels(t);

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { payments: { orderBy: { date: "asc" } } },
  });
  if (!event) notFound();

  const cur = (event.currency ?? "MXN") as Currency;
  const paid = totalPaid(event);
  const pending = pendingBalance(event);
  const editHref = `/eventos/${event.id}/editar`;

  // Para mostrar la ubicación: location es lo nuevo, address es el legacy.
  // Si ambos están vacíos, no renderizamos la sección.
  const locationText = event.location || event.address || "";
  const hasLocation = locationText.trim().length > 0;

  // Servicios y notas: ocultamos la sección si AMBOS son vacíos.
  const hasServicesOrNotes =
    (event.services && event.services.trim().length > 0) ||
    (event.notes && event.notes.trim().length > 0);

  const dateLong = new Date(event.date).toLocaleDateString(
    lang === "es" ? "es-MX" : "en-US",
    { weekday: "long", day: "2-digit", month: "long", year: "numeric" },
  );

  return (
    <div>
      <PageHeader
        title={event.clientName}
        subtitle={
          <>
            <span>{event.eventType}</span>
            {" · "}
            <span className="capitalize">{dateLong}</span>
          </>
        }
        rightSlot={
          <Link
            href={editHref}
            className="btn-primary btn-sm whitespace-nowrap"
          >
            {t("page.eventos.edit")}
          </Link>
        }
      />

      <div className="space-y-4 lg:space-y-5">
        {/* ===== INFORMACIÓN GENERAL ===== */}
        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            {t("page.eventos.detail.section.general")}
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                {t("form.client_name")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                {event.clientName}
              </dd>
            </div>
            {event.phone && (
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  {t("form.phone")}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">
                  <a
                    href={`tel:${event.phone}`}
                    className="text-brand-700 hover:underline"
                  >
                    {event.phone}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                {t("form.event_type")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                {event.eventType}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                {t("form.status")}
              </dt>
              <dd className="mt-0.5">
                <span className={`badge ${STATUS_COLORS[event.status] ?? ""}`}>
                  {STATUS_LABELS[event.status] ?? event.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                {t("form.date")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                {fmtDate(event.date)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                {t("form.start_time")} – {t("form.end_time")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                {event.startTime} – {event.endTime}
              </dd>
            </div>
          </dl>
        </section>

        {/* ===== UBICACIÓN ===== */}
        {hasLocation && (
          <section className="card p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                {t("form.location")}
              </h2>
              <OpenInMapsButton
                location={locationText}
                label={t("common.open_in_maps")}
              />
            </div>
            <p className="break-words text-sm text-slate-700">
              {locationText}
            </p>
          </section>
        )}

        {/* ===== SERVICIOS Y NOTAS ===== */}
        {hasServicesOrNotes && (
          <section className="card space-y-3 p-4 sm:p-5">
            {event.services && event.services.trim() && (
              <div>
                <h2 className="mb-1 text-sm font-semibold text-slate-900">
                  {t("page.eventos.detail.section.services")}
                </h2>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {event.services}
                </p>
              </div>
            )}
            {event.notes && event.notes.trim() && (
              <div>
                <h2 className="mb-1 text-sm font-semibold text-slate-900">
                  {t("form.notes")}
                </h2>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {event.notes}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ===== FINANZAS ===== */}
        <section className="card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {t("page.eventos.detail.section.finance")}
            </h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {cur}
            </span>
          </div>

          <dl className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                {t("events.col.total")}
              </dt>
              <dd className="mt-1 text-base font-semibold text-slate-900">
                {formatAmount(event.total, cur)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                {t("events.col.paid")}
              </dt>
              <dd className="mt-1 text-base font-semibold text-emerald-700">
                {formatAmount(paid, cur)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                {t("events.col.balance")}
              </dt>
              <dd
                className={`mt-1 text-base font-semibold ${
                  pending > 0 ? "text-accent-700" : "text-slate-400"
                }`}
              >
                {formatAmount(pending, cur)}
              </dd>
            </div>
          </dl>

          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {t("page.eventos.detail.payments.title")}
          </h3>
          {event.payments.length === 0 ? (
            <p className="rounded-md bg-slate-50 px-3 py-3 text-center text-sm text-slate-500">
              {t("page.eventos.detail.payments.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {event.payments.map((p) => {
                const payCur = ((p.currency ?? "MXN") as Currency);
                const isUsd = p.currency === "USD";
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium capitalize text-slate-900">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {fmtDate(p.date)}
                        {p.note ? ` · ${p.note}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-emerald-700">
                        {formatAmount(p.amount, payCur)}
                      </div>
                      {/* Si el pago fue USD, mostramos el TC capturado y el
                          equivalente en MXN — útil cuando el evento es MXN
                          o cuando se quiere ver el valor en pesos. */}
                      {isUsd && p.exchangeRate && (
                        <div className="text-xs text-slate-500">
                          TC {p.exchangeRate} · ≈{" "}
                          {formatAmount(paymentAmountMxn(p), "MXN")}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ===== ACCIONES INFERIORES ===== */}
        <div className="above-bottom-nav sticky bottom-0 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <Link
            href="/eventos"
            className="btn-secondary flex-1 lg:flex-none"
          >
            {t("common.back")}
          </Link>
          <Link href={editHref} className="btn-primary flex-1 lg:flex-none">
            {t("page.eventos.edit")}
          </Link>
        </div>
      </div>
    </div>
  );
}
