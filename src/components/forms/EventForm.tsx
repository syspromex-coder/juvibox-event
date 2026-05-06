import Link from "next/link";
import { toInputDate } from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";
import OpenInMapsButton from "@/components/ui/OpenInMapsButton";
import DepositAmountInputs from "./DepositAmountInputs";

type EventInput = {
  id?: string;
  clientName: string;
  phone: string | null;
  eventType: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  address: string | null;
  location: string | null;
  services: string | null;
  total: number;
  deposit: number;
  /** Moneda del anticipo (independiente de la moneda del evento). */
  depositCurrency: string;
  /** TC capturado al momento del anticipo, solo cuando depositCurrency=USD. */
  depositExchangeRate: number | null;
  status: string;
  currency: string;
  notes: string | null;
};

export default async function EventForm({
  event,
  action,
  submitLabel,
}: {
  event?: Partial<EventInput>;
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  const t = await getServerT();
  const e = event ?? {};
  const submit = submitLabel ?? t("common.save");

  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">{t("form.client_name")} *</label>
            <input
              name="clientName"
              defaultValue={e.clientName ?? ""}
              required
              autoComplete="name"
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.phone")}</label>
            <input
              name="phone"
              defaultValue={e.phone ?? ""}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.event_type")} *</label>
            <input
              name="eventType"
              defaultValue={e.eventType ?? ""}
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">{t("form.date")} *</label>
            <input
              type="date"
              name="date"
              defaultValue={e.date ? toInputDate(e.date as any) : ""}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.status")}</label>
            <select
              name="status"
              defaultValue={e.status ?? "apartado"}
              className="select"
            >
              <option value="apartado">{t("status.apartado")}</option>
              <option value="confirmado">{t("status.confirmado")}</option>
              <option value="pagado">{t("status.pagado")}</option>
              <option value="cancelado">{t("status.cancelado")}</option>
            </select>
          </div>

          <div>
            <label className="label">{t("form.start_time")}</label>
            <input
              type="time"
              name="startTime"
              defaultValue={e.startTime ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.end_time")}</label>
            <input
              type="time"
              name="endTime"
              defaultValue={e.endTime ?? ""}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <label className="label" htmlFor="event-location">
                {t("form.location")}
              </label>
              {/* Botón aparece si hay ubicación guardada. Para eventos viejos
                  que solo tienen `address` (campo deprecated del form pero todavía
                  en DB), cae a address como fallback para que el botón siga
                  funcionando. */}
              <OpenInMapsButton
                location={e.location ?? e.address}
                label={t("common.open_in_maps")}
              />
            </div>
            <input
              id="event-location"
              name="location"
              defaultValue={e.location ?? ""}
              placeholder={t("form.location.placeholder")}
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">{t("form.location.hint")}</p>
          </div>

          <div className="md:col-span-2">
            <label className="label">{t("common.notes")}</label>
            <textarea
              name="services"
              defaultValue={e.services ?? ""}
              rows={2}
              className="textarea"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">{t("form.currency")}</label>
            <select
              name="currency"
              defaultValue={e.currency ?? "MXN"}
              className="select"
            >
              <option value="MXN">MXN — Pesos mexicanos</option>
              <option value="USD">USD — Dólares</option>
            </select>
          </div>

          <div>
            <label className="label">{t("form.total")}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="total"
              defaultValue={e.total ?? 0}
              className="input"
            />
          </div>
          {/* Bloque cliente: anticipo + moneda + TC condicional + equivalente live */}
          <DepositAmountInputs
            defaultDeposit={e.deposit ?? 0}
            defaultDepositCurrency={e.depositCurrency}
            defaultDepositExchangeRate={e.depositExchangeRate ?? null}
            isEditing={!!event?.id}
            labels={{
              deposit: t("form.deposit"),
              depositHint: t("form.deposit.hint"),
              currency: t("form.deposit.currency"),
              exchangeRate: t("form.exchange_rate"),
              exchangeRateHint: t("form.exchange_rate.hint"),
              equivalent: t("form.equivalent_mxn"),
            }}
          />

          <div className="md:col-span-2">
            <label className="label">{t("form.notes")}</label>
            <textarea
              name="notes"
              defaultValue={e.notes ?? ""}
              rows={3}
              className="textarea"
            />
          </div>
        </div>
      </div>

      <div className="above-bottom-nav sticky z-10 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <Link href="/eventos" className="btn-secondary flex-1 lg:flex-none">
          {t("common.cancel")}
        </Link>
        <button type="submit" className="btn-primary flex-1 lg:flex-none">
          {submit}
        </button>
      </div>
    </form>
  );
}
