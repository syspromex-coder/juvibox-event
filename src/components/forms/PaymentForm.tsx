import Link from "next/link";
import { toInputDate } from "@/lib/utils";
import { getServerT, getServerLang } from "@/lib/i18n-server";

type PaymentInput = {
  id?: string;
  eventId: string;
  date: Date | string;
  amount: number;
  method: string;
  note: string | null;
};

type EventOpt = { id: string; clientName: string; eventType: string; date: Date };

export default async function PaymentForm({
  payment,
  events,
  action,
  submitLabel,
}: {
  payment?: Partial<PaymentInput>;
  events: EventOpt[];
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  const t = await getServerT();
  const lang = getServerLang();
  const p = payment ?? {};
  const submit = submitLabel ?? t("common.save");
  const locale = lang === "en" ? "en-US" : "es-MX";

  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">{t("form.linked_event")} *</label>
            <select
              name="eventId"
              defaultValue={p.eventId ?? ""}
              required
              className="select"
            >
              <option value="" disabled>
                {lang === "es" ? "Selecciona un evento" : "Select an event"}
              </option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.clientName} — {ev.eventType} (
                  {new Date(ev.date).toLocaleDateString(locale)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t("form.payment_date")} *</label>
            <input
              type="date"
              name="date"
              defaultValue={p.date ? toInputDate(p.date as any) : toInputDate(new Date())}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.method")} *</label>
            <select
              name="method"
              defaultValue={p.method ?? "efectivo"}
              className="select"
            >
              <option value="efectivo">{t("method.efectivo")}</option>
              <option value="transferencia">{t("method.transferencia")}</option>
              <option value="tarjeta">{t("method.tarjeta")}</option>
              <option value="anticipo">{t("method.anticipo")}</option>
              <option value="otro">{t("method.otro")}</option>
            </select>
          </div>

          <div>
            <label className="label">
              {t("form.amount")} *{" "}
              <span className="text-slate-400 normal-case">
                ({t("common.in_mxn")})
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="amount"
              defaultValue={p.amount ?? ""}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("common.note")}</label>
            <input name="note" defaultValue={p.note ?? ""} className="input" />
          </div>
        </div>
      </div>

      <div className="above-bottom-nav sticky z-10 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <Link href="/pagos" className="btn-secondary flex-1 lg:flex-none">
          {t("common.cancel")}
        </Link>
        <button type="submit" className="btn-primary flex-1 lg:flex-none">
          {submit}
        </button>
      </div>
    </form>
  );
}
