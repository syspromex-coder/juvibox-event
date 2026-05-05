"use client";

import { useSettings } from "@/lib/settings";
import { formatAmount } from "@/lib/currency";
import clsx from "clsx";

type Variant = "inline" | "detail";

type Props = {
  /** Monto en MXN (siempre — la BD guarda en MXN). */
  amountMxn: number;
  /** "inline" = sólo el monto (default). "detail" = con TC + equivalente. */
  variant?: Variant;
  /** Clase aplicada al span principal. */
  className?: string;
  /** Clase aplicada a las líneas pequeñas (TC, equivalente). */
  hintClassName?: string;
};

/**
 * Muestra un monto MXN en la moneda visual seleccionada.
 * - Antes de hidratar: muestra MXN (default seguro).
 * - Si moneda visual = USD: convierte; opcionalmente muestra TC y equivalente.
 *
 * NUNCA modifica el dato original. Es 100% presentación.
 */
export default function CurrencyDisplay({
  amountMxn,
  variant = "inline",
  className,
  hintClassName,
}: Props) {
  const { settings, formatMoney, hydrated, t } = useSettings();
  const { currency, exchangeRate, showAlsoMxn } = settings;

  // Antes de hidratar usamos formato MXN puro para evitar mismatch SSR.
  const main = hydrated ? formatMoney(amountMxn) : formatAmount(amountMxn, "MXN");
  const showingUsd = hydrated && currency === "USD";

  if (variant === "inline") {
    return <span className={className}>{main}</span>;
  }

  return (
    <span className={clsx("inline-block", className)}>
      <span className="block">{main}</span>
      {showingUsd && (
        <span
          className={clsx(
            "mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-slate-500",
            hintClassName
          )}
        >
          {t("currency.exchange_rate_short")}: {exchangeRate.toFixed(2)} MXN/USD
        </span>
      )}
      {showingUsd && showAlsoMxn && (
        <span
          className={clsx(
            "block text-[10px] font-normal text-slate-500",
            hintClassName
          )}
        >
          ≈ {formatAmount(amountMxn, "MXN")}
        </span>
      )}
    </span>
  );
}
