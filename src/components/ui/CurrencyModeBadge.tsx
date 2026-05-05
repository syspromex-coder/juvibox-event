"use client";

import Link from "next/link";
import { useSettings } from "@/lib/settings";
import clsx from "clsx";

/**
 * Badge que indica si la app está mostrando montos en MXN o USD.
 * Vinculado a /configuracion para cambiar fácilmente.
 */
export default function CurrencyModeBadge() {
  const { settings, hydrated, isUsingDefaultRate, t } = useSettings();
  if (!hydrated) {
    // placeholder neutro durante SSR
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
        $ MXN
      </span>
    );
  }

  const isUsd = settings.currency === "USD";

  return (
    <Link
      href="/configuracion"
      title={t("currency.banner.update_rate")}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition active:scale-95",
        isUsd
          ? "border-accent-300 bg-accent-50 text-accent-800 hover:bg-accent-100"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      <span aria-hidden>$</span>
      <span>
        {t("currency.mode_label")}: <strong>{settings.currency}</strong>
      </span>
      {isUsd && (
        <>
          <span className="hidden sm:inline">·</span>
          <span className="hidden font-mono text-[10px] sm:inline">
            {settings.exchangeRate.toFixed(2)}
          </span>
          {isUsingDefaultRate && (
            <span
              aria-label={t("settings.exchange_rate.warning")}
              className="grid h-4 w-4 place-items-center rounded-full bg-highlight-300 text-[10px] font-bold text-highlight-900"
            >
              !
            </span>
          )}
        </>
      )}
    </Link>
  );
}
