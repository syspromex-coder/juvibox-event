"use client";

import Link from "next/link";
import { useSettings } from "@/lib/settings";

/**
 * Banner global mostrado cuando la moneda visual es USD.
 * Indica el tipo de cambio activo para que el usuario siempre lo vea.
 * Si el TC es el de por defecto sin actualizar manualmente, agrega advertencia.
 */
export default function CurrencyBanner() {
  const { settings, hydrated, isUsingDefaultRate, t } = useSettings();
  if (!hydrated || settings.currency !== "USD") return null;

  return (
    <div
      role="status"
      className="border-b border-accent-200 bg-accent-50 px-4 py-2 text-xs text-accent-900 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span aria-hidden>$</span>
            {t("currency.banner.label")}
          </span>
          <span className="font-mono">
            {t("currency.exchange_rate_short")}: {settings.exchangeRate.toFixed(2)} MXN/USD
          </span>
          {isUsingDefaultRate && (
            <span
              className="inline-flex items-center rounded-full bg-highlight-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-highlight-900"
              title={t("settings.exchange_rate.warning")}
            >
              ⚠ {t("settings.exchange_rate.warning")}
            </span>
          )}
        </div>
        <Link
          href="/configuracion"
          className="rounded-md px-2 py-1 text-[11px] font-medium underline-offset-2 hover:underline"
        >
          {t("currency.banner.update_rate")} →
        </Link>
      </div>
    </div>
  );
}
