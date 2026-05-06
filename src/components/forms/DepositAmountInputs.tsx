"use client";

import { useState } from "react";
import { useSettings } from "@/lib/settings";
import { formatAmount, isValidRate } from "@/lib/currency";

type Props = {
  /** Default deposit amount (al editar un evento existente). */
  defaultDeposit: number;
  /** Moneda inicial del anticipo. Default "MXN". */
  defaultDepositCurrency?: string | null;
  /** TC inicial del anticipo. Si null, se usa el TC global de settings cuando se elija USD. */
  defaultDepositExchangeRate?: number | null;
  /** Solo se usa para esconder el hint "se crea pago automático" al editar. */
  isEditing: boolean;
  /** Labels traducidos del padre. */
  labels: {
    deposit: string;
    depositHint: string;
    currency: string;
    exchangeRate: string;
    exchangeRateHint: string;
    equivalent: string;
  };
};

/**
 * Bloque cliente para el ANTICIPO del evento.
 *
 * Captura: monto + moneda (MXN/USD) + TC (cuando USD) + muestra equivalente en MXN.
 *
 * Los inputs se nombran:
 *   - "deposit"               → Event.deposit (Float)
 *   - "depositCurrency"       → Event.depositCurrency (String "MXN" | "USD")
 *   - "depositExchangeRate"   → Event.depositExchangeRate (Float?)
 *
 * El input de TC solo se renderiza cuando depositCurrency = "USD". Si es MXN,
 * el server recibe null y no guarda ningún TC.
 */
export default function DepositAmountInputs({
  defaultDeposit,
  defaultDepositCurrency,
  defaultDepositExchangeRate,
  isEditing,
  labels,
}: Props) {
  const { settings } = useSettings();
  const initialCurrency = defaultDepositCurrency === "USD" ? "USD" : "MXN";
  const [currency, setCurrency] = useState<"MXN" | "USD">(initialCurrency);
  const [amount, setAmount] = useState<number | "">(defaultDeposit ?? 0);
  const [rate, setRate] = useState<number | "">(
    defaultDepositExchangeRate && defaultDepositExchangeRate > 0
      ? defaultDepositExchangeRate
      : settings.exchangeRate,
  );

  const numAmount = typeof amount === "number" ? amount : 0;
  const numRate = typeof rate === "number" ? rate : 0;
  const equivalentMxn = currency === "USD" ? numAmount * numRate : numAmount;
  const equivalentValid =
    currency === "MXN" || (numAmount > 0 && isValidRate(numRate));

  return (
    <>
      <div>
        <label className="label" htmlFor="event-deposit">
          {labels.deposit}
        </label>
        <input
          id="event-deposit"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          name="deposit"
          value={amount}
          onChange={(e) => {
            const v = e.target.value;
            setAmount(v === "" ? "" : Number(v));
          }}
          className="input"
        />
        {!isEditing && (
          <p className="mt-1 text-xs text-slate-500">{labels.depositHint}</p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="event-deposit-currency">
          {labels.currency}
        </label>
        <select
          id="event-deposit-currency"
          name="depositCurrency"
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
            <label className="label" htmlFor="event-deposit-rate">
              {labels.exchangeRate} *
            </label>
            <input
              id="event-deposit-rate"
              type="number"
              step="0.0001"
              min="0"
              inputMode="decimal"
              name="depositExchangeRate"
              value={rate}
              onChange={(e) => {
                const v = e.target.value;
                setRate(v === "" ? "" : Number(v));
              }}
              required
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">{labels.exchangeRateHint}</p>
          </div>
          <div className="md:col-span-2">
            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">{labels.equivalent}: </span>
              <span className="font-semibold text-slate-900">
                {equivalentValid ? formatAmount(equivalentMxn, "MXN") : "—"}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
