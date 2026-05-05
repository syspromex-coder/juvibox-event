/**
 * Funciones puras para el sistema de moneda.
 *
 * Reglas:
 *  - La base de datos SIEMPRE guarda MXN.
 *  - Aquí sólo formateamos y/o convertimos para visualización.
 *  - 2 decimales SIEMPRE.
 */

export type Currency = "MXN" | "USD";

export const DEFAULT_EXCHANGE_RATE = 17.0;

/**
 * Formatea un monto en una moneda dada con 2 decimales.
 * Devuelve siempre el sufijo " MXN" o " USD" para que quede inequívoco.
 *
 * Ejemplo: formatAmount(1234.5, "MXN") → "$1,234.50 MXN"
 */
export function formatAmount(amount: number, currency: Currency): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign}$${n} ${currency}`;
}

/**
 * Convierte MXN → USD usando un tipo de cambio (pesos por dólar).
 * Si el TC es inválido, devuelve 0 (en lugar de NaN/Infinity).
 */
export function convertMxnToUsd(amountMxn: number, exchangeRate: number): number {
  if (!isValidRate(exchangeRate)) return 0;
  return amountMxn / exchangeRate;
}

/** Convierte USD → MXN (no usado actualmente, por simetría). */
export function convertUsdToMxn(amountUsd: number, exchangeRate: number): number {
  if (!isValidRate(exchangeRate)) return 0;
  return amountUsd * exchangeRate;
}

/** Valida un tipo de cambio. */
export function isValidRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0;
}

/**
 * Formatea un monto en MXN al formato de moneda visual seleccionado.
 * NO modifica el valor original.
 */
export function formatMoney(
  amountMxn: number,
  opts: { currency: Currency; exchangeRate: number }
): string {
  if (opts.currency === "USD") {
    const usd = convertMxnToUsd(amountMxn, opts.exchangeRate);
    return formatAmount(usd, "USD");
  }
  return formatAmount(amountMxn, "MXN");
}

/**
 * Convierte un monto MXN al equivalente en la moneda visual seleccionada.
 * Si la moneda visual es MXN, devuelve el mismo valor.
 */
export function convertMoney(
  amountMxn: number,
  opts: { currency: Currency; exchangeRate: number }
): number {
  if (opts.currency === "USD") return convertMxnToUsd(amountMxn, opts.exchangeRate);
  return amountMxn;
}
