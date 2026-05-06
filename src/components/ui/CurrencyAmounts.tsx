import { formatAmount } from "@/lib/currency";
import type { CurrencyAmounts as CA } from "@/lib/utils";
import clsx from "clsx";

type Props = {
  /** Montos por moneda. */
  amounts: CA;
  /**
   * Si true, fuerza mostrar AMBAS líneas aunque alguna sea 0.
   * Default: false (oculta MXN si todo está en USD, y viceversa).
   */
  showZero?: boolean;
  className?: string;
};

/**
 * Muestra montos separados por moneda, una línea por moneda activa.
 *
 * Reglas (default `showZero=false`):
 *   - Solo hay MXN  → muestra MXN
 *   - Solo hay USD  → muestra USD
 *   - Hay ambas     → muestra ambas
 *   - Todo es 0     → muestra "$0.00 MXN" como default (nunca queda en blanco)
 *
 * NO convierte entre monedas. Es 100% presentación.
 *
 * NOTA: Este componente actualmente no se usa en ninguna parte del proyecto.
 * El dashboard cambió a mostrar todo en MXN único usando paymentAmountMxn /
 * pendingBalanceMxn. Se conserva el archivo por si se necesita en el futuro
 * para vistas de detalle multi-moneda.
 */
export default function CurrencyAmountsView({
  amounts,
  showZero = false,
  className,
}: Props) {
  const hasMxn = amounts.MXN !== 0;
  const hasUsd = amounts.USD !== 0;

  // Default a MXN cuando todo es 0, así nunca queda vacío.
  const showMxn = showZero || hasMxn || (!hasMxn && !hasUsd);
  const showUsd = showZero || hasUsd;

  return (
    <span className={clsx("block leading-tight", className)}>
      {showMxn && (
        <span className="block">{formatAmount(amounts.MXN, "MXN")}</span>
      )}
      {showUsd && (
        <span className="block">{formatAmount(amounts.USD, "USD")}</span>
      )}
    </span>
  );
}
