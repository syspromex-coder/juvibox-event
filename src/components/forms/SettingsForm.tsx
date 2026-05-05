"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";
import { DEFAULT_EXCHANGE_RATE, isValidRate, formatAmount, convertMxnToUsd } from "@/lib/currency";
import clsx from "clsx";

export default function SettingsForm() {
  const {
    settings,
    setLang,
    setCurrency,
    setExchangeRate,
    setShowAlsoMxn,
    resetSettings,
    isUsingDefaultRate,
    t,
  } = useSettings();

  // Input local controlado para el TC (permite edición libre antes de validar)
  const [rateDraft, setRateDraft] = useState<string>(settings.exchangeRate.toFixed(2));
  const [rateError, setRateError] = useState<string | null>(null);

  // Sincroniza el draft cuando cambia desde fuera (por ejemplo reset)
  useSyncDraft(settings.exchangeRate, setRateDraft);

  const SAMPLE_MXN = 12000;

  function commitRate() {
    const num = Number(rateDraft.trim());
    if (rateDraft.trim() === "") {
      setExchangeRate(DEFAULT_EXCHANGE_RATE);
      setRateDraft(DEFAULT_EXCHANGE_RATE.toFixed(2));
      setRateError(null);
      return;
    }
    if (!isValidRate(num)) {
      setRateError(t("settings.error.invalid_rate"));
      return;
    }
    setRateError(null);
    setExchangeRate(num);
  }

  return (
    <div className="space-y-5">
      {/* Idioma */}
      <Section title={t("settings.language")}>
        <RadioGroup
          name="lang"
          value={settings.lang}
          onChange={(v) => setLang(v as "es" | "en")}
          options={[
            { value: "es", label: t("settings.language.es") + " 🇲🇽" },
            { value: "en", label: t("settings.language.en") + " 🇺🇸" },
          ]}
        />
      </Section>

      {/* Moneda */}
      <Section title={t("settings.currency")} hint={t("settings.currency.hint")}>
        <RadioGroup
          name="currency"
          value={settings.currency}
          onChange={(v) => setCurrency(v as "MXN" | "USD")}
          options={[
            { value: "MXN", label: "MXN ($)" },
            { value: "USD", label: "USD ($)" },
          ]}
        />
      </Section>

      {/* Tipo de cambio */}
      <Section
        title={t("settings.exchange_rate")}
        hint={t("settings.exchange_rate.hint")}
      >
        <div className="flex items-stretch gap-2">
          <input
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            value={rateDraft}
            onChange={(e) => {
              setRateDraft(e.target.value);
              setRateError(null);
            }}
            onBlur={commitRate}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="input max-w-[180px]"
            aria-invalid={Boolean(rateError)}
          />
          <button type="button" onClick={commitRate} className="btn-secondary">
            {t("common.apply")}
          </button>
        </div>
        {rateError && (
          <p className="mt-2 text-xs font-medium text-rose-600">
            {rateError}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {isUsingDefaultRate && (
            <span className="inline-flex items-center rounded-full bg-highlight-100 px-2 py-0.5 font-medium text-highlight-900">
              ⚠ {t("settings.exchange_rate.warning")}
            </span>
          )}
          {settings.rateUpdatedAt && (
            <span className="text-slate-500">
              {t("settings.exchange_rate.updated", {
                date: new Date(settings.rateUpdatedAt).toLocaleDateString(
                  settings.lang === "es" ? "es-MX" : "en-US",
                  { day: "2-digit", month: "short", year: "numeric" }
                ),
              })}
            </span>
          )}
        </div>

        {/* Vista previa */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {t("common.preview")}
          </div>
          <div className="mt-1 font-mono text-slate-900">
            {formatAmount(SAMPLE_MXN, "MXN")}{" "}
            <span className="text-slate-400">→</span>{" "}
            {formatAmount(convertMxnToUsd(SAMPLE_MXN, settings.exchangeRate), "USD")}
          </div>
        </div>
      </Section>

      {/* Mostrar también en MXN */}
      <Section>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
          <span className="text-sm text-slate-800">
            {t("settings.show_also_mxn")}
          </span>
          <input
            type="checkbox"
            checked={settings.showAlsoMxn}
            onChange={(e) => setShowAlsoMxn(e.target.checked)}
            className="h-5 w-5 cursor-pointer accent-brand-600"
          />
        </label>
      </Section>

      {/* Reset */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          className="btn-secondary text-rose-600"
          onClick={() => {
            if (confirm(t("settings.reset.confirm"))) {
              resetSettings();
              setRateDraft(DEFAULT_EXCHANGE_RATE.toFixed(2));
              setRateError(null);
            }
          }}
        >
          {t("settings.reset")}
        </button>
      </div>
    </div>
  );
}

/* ----- Helpers internos ----- */

function Section({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4 sm:p-5">
      {title && (
        <h2 className="mb-1 text-sm font-semibold text-slate-900">
          {title}
        </h2>
      )}
      {hint && <p className="mb-3 text-xs text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}

type RadioOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: RadioOption[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition active:scale-[0.98]",
              active
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
            aria-pressed={active}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Hook chiquito para sincronizar el draft cuando el valor de fuera cambia (reset). */
function useSyncDraft(rate: number, setDraft: (s: string) => void) {
  useEffect(() => {
    setDraft(rate.toFixed(2));
  }, [rate, setDraft]);
}
