import clsx from "clsx";

type Props = {
  label: string;
  /** Valor: puede ser string o JSX (para incluir <CurrencyDisplay/>). */
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "success" | "warn" | "danger" | "brand" | "info";
  /** Si true, hace la tarjeta más grande visualmente (jerarquía superior). */
  highlight?: boolean;
};

const toneText: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "text-slate-900",
  success: "text-emerald-700",
  warn: "text-highlight-700",
  danger: "text-rose-700",
  brand: "text-brand-700",
  info: "text-accent-700",
};

const toneAccent: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "",
  success: "border-l-4 border-l-emerald-500",
  warn: "border-l-4 border-l-highlight-500",
  danger: "border-l-4 border-l-rose-500",
  brand: "border-l-4 border-l-brand-500",
  info: "border-l-4 border-l-accent-500",
};

export default function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  highlight = false,
}: Props) {
  return (
    <div
      className={clsx(
        "card p-4 sm:p-5",
        highlight && "ring-1 ring-slate-100",
        highlight && tone !== "neutral" && toneAccent[tone]
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </div>
      <div
        className={clsx(
          "mt-1.5 font-semibold tracking-tight",
          highlight ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
          toneText[tone]
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
      )}
    </div>
  );
}
