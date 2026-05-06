"use client";

import { useState } from "react";
import { useSettings } from "@/lib/settings";
import { formatAmount, isValidRate } from "@/lib/currency";

type Props = {
  /** Default amount al renderizar (edición). */
  defaultAmount: number | "";
  /** Moneda inicial. Si vacío/null, default "MXN". */
  defaultCurrency?: string | null;
  /** TC inicial. Si null, se usará el TC global de settings cuando se elija USD. */
  defaultExchangeRate?: number | null;
  /** Labels traducidos del padre (server component) — para no duplicar i18n. */
  labels: {
    amount: string;
    currency: string;
    exchangeRate: string;
    equivalent: string;
    rateHint: string;
  };
};

/**
 * Bloque de inputs que captura un pago con moneda elegible + TC + equivalente
 * en MXN en vivo.
 *
 *  - Si moneda = MXN: solo se muestra el input de monto.
 *  - Si moneda = USD: aparece input de TC (pre-llenado con el TC global de
 *    settings) y se muestra "Equivalente: $X MXN" actualizado en vivo.
 *
 * Los nombres de los inputs (`amount`, `currency`, `exchangeRate`) deben
 * coincidir con lo que esperan las server actions de payments.ts. El input
 * de exchangeRate solo se renderiza cuando currency === "USD"; si es MXN, el
 * server recibe `null` y no guarda nada.
 */
export default function PaymentAmountInputs({
  defaultAmount,
  defaultCurrency,
  defaultExchangeRate,
  labels,
}: Props) {
  const { settings } = useSettings();
  const initialCurrency = defaultCurrency === "USD" ? "USD" : "MXN";
  const [currency, setCurrency] = useState<"MXN" | "USD">(initialCurrency);
  const [amount, setAmount] = useState<number | "">(defaultAmount);
  // Para edición: usa el TC guardado. Para nuevo: usa el TC global de settings.
  const [rate, setRate] = useState<number | "">(
    defaultExchangeRate && defaultExchangeRate > 0
      ? defaultExchangeRate
      : settings.exchangeRate,
  );

  // Cálculo del equivalente en MXN
  const numAmount = typeof amount === "number" ? amount : 0;
  const numRate = typeof rate === "number" ? rate : 0;
  const equivalentMxn = currency === "USD" ? numAmount * numRate : numAmount;
  const equivalentValid =
    currency === "MXN" ||
    (numAmount > 0 && isValidRate(numRate));

  return (
    <>
      <div>
        <label className="label" htmlFor="payment-amount">
          {labels.amount} *
        </label>
        <input
          id="payment-amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          name="amount"
          value={amount}
          onChange={(e) => {
            const v = e.target.value;
            setAmount(v === "" ? "" : Number(v));
          }}
          required
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="payment-currency">
          {labels.currency} *
        </label>
        <select
          id="payment-currency"
          name="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value === "USD" ? "USD" : "MXN")}
          className="select"
        >
          <option value="MXN">MXN</option>
          <option value="USD">USD</option>
        </select>
      </div>

      {currency === "USD" && (
        <>
          <div className="md:col-span-2">
            <label className="label" htmlFor="payment-rate">
              {labels.exchangeRate} *
            </label>
            <input
              id="payment-rate"
              type="number"
              step="0.0001"
              min="0"
              inputMode="decimal"
              name="exchangeRate"
              value={rate}
              onChange={(e) => {
                const v = e.target.value;
                setRate(v === "" ? "" : Number(v));
              }}
              required
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">{labels.rateHint}</p>
          </div>
          <div className="md:col-span-2">
            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">{labels.equivalent}: </span>
              <span className="font-semibold text-slate-900">
                {equivalentValid
                  ? formatAmount(equivalentMxn, "MXN")
                  : "—"}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
