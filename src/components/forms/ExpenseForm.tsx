import Link from "next/link";
import { toInputDate } from "@/lib/utils";
import { getServerT, getServerLang } from "@/lib/i18n-server";

type ExpenseInput = {
  id?: string;
  eventId: string | null;
  date: Date | string;
  amount: number;
  category: string;
  description: string;
};

type EventOpt = { id: string; clientName: string; eventType: string; date: Date };

const CATEGORIES_ES = [
  "Insumos",
  "Logística",
  "Personal",
  "Renta",
  "Decoración",
  "Transporte",
  "Otro",
];
const CATEGORIES_EN = [
  "Supplies",
  "Logistics",
  "Staff",
  "Rent",
  "Decoration",
  "Transport",
  "Other",
];

export default async function ExpenseForm({
  expense,
  events,
  action,
  submitLabel,
}: {
  expense?: Partial<ExpenseInput>;
  events: EventOpt[];
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  const t = await getServerT();
  const lang = getServerLang();
  const x = expense ?? {};
  const submit = submitLabel ?? t("common.save");
  const categories = lang === "en" ? CATEGORIES_EN : CATEGORIES_ES;
  const locale = lang === "en" ? "en-US" : "es-MX";

  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">{t("form.expense_date")} *</label>
            <input
              type="date"
              name="date"
              defaultValue={x.date ? toInputDate(x.date as any) : toInputDate(new Date())}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.category")} *</label>
            <select
              name="category"
              defaultValue={x.category ?? categories[0]}
              required
              className="select"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">{t("form.description")} *</label>
            <input
              name="description"
              defaultValue={x.description ?? ""}
              required
              className="input"
            />
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
              defaultValue={x.amount ?? ""}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">
              {t("form.linked_event")}{" "}
              <span className="text-slate-400 normal-case">
                {t("common.optional_field")}
              </span>
            </label>
            <select name="eventId" defaultValue={x.eventId ?? ""} className="select">
              <option value="">{t("form.no_event")}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.clientName} — {ev.eventType} (
                  {new Date(ev.date).toLocaleDateString(locale)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="above-bottom-nav sticky z-10 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <Link href="/gastos" className="btn-secondary flex-1 lg:flex-none">
          {t("common.cancel")}
        </Link>
        <button type="submit" className="btn-primary flex-1 lg:flex-none">
          {submit}
        </button>
      </div>
    </form>
  );
}
