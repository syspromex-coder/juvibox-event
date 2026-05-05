"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Currency,
  DEFAULT_EXCHANGE_RATE,
  convertMoney as pureConvertMoney,
  formatMoney as pureFormatMoney,
  isValidRate,
} from "./currency";
import { Lang, t as pureT } from "./i18n";

export type Settings = {
  lang: Lang;
  currency: Currency;
  exchangeRate: number;
  /** Mostrar también el monto en MXN cuando se está visualizando en USD. */
  showAlsoMxn: boolean;
  /** Timestamp ms de la última vez que el usuario actualizó el TC manualmente. null = nunca. */
  rateUpdatedAt: number | null;
};

export const DEFAULT_SETTINGS: Settings = {
  lang: "es",
  currency: "MXN",
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  showAlsoMxn: true,
  rateUpdatedAt: null,
};

export const STORAGE_KEY = "jubivox-settings-v1";

type SettingsContextValue = {
  settings: Settings;
  /** True después del primer mount (se hidrató desde localStorage). */
  hydrated: boolean;
  /** ¿Se está usando el TC por defecto sin actualizar manualmente? */
  isUsingDefaultRate: boolean;
  setLang: (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  setExchangeRate: (rate: number) => void;
  setShowAlsoMxn: (b: boolean) => void;
  resetSettings: () => void;
  /** Formatea un monto MXN según la moneda visual seleccionada. */
  formatMoney: (amountMxn: number) => string;
  /** Convierte un monto MXN al valor numérico en la moneda visual. */
  convertMoney: (amountMxn: number) => number;
  /** Traduce una clave usando el idioma actual. */
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function safeReadStorage(): Partial<Settings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as Partial<Settings>;
  } catch {
    return null;
  }
}

function safeWriteStorage(s: Settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota / safari private mode errors
  }
}

/** Sanitiza el valor leído del localStorage. Ignora silenciosamente campos antiguos como `theme`. */
function sanitize(input: Partial<Settings> & { theme?: unknown }): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (input.lang === "es" || input.lang === "en") out.lang = input.lang;
  if (input.currency === "MXN" || input.currency === "USD") out.currency = input.currency;
  if (typeof input.exchangeRate === "number" && isValidRate(input.exchangeRate)) {
    out.exchangeRate = input.exchangeRate;
  }
  if (typeof input.showAlsoMxn === "boolean") out.showAlsoMxn = input.showAlsoMxn;
  if (typeof input.rateUpdatedAt === "number" && Number.isFinite(input.rateUpdatedAt)) {
    out.rateUpdatedAt = input.rateUpdatedAt;
  }
  return out;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage (sólo en cliente, después del mount)
  useEffect(() => {
    const stored = safeReadStorage();
    if (stored) setSettings(sanitize(stored));
    // Limpieza adicional: si quedó la clase `dark` de una versión anterior, quitarla.
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
    }
    setHydrated(true);
  }, []);

  // Persistir cambios
  useEffect(() => {
    if (!hydrated) return;
    safeWriteStorage(settings);
  }, [settings, hydrated]);

  // Sincronizar idioma a cookie (para los server components con getServerT)
  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    document.cookie = `juvi-lang=${settings.lang}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; SameSite=Lax`;
  }, [settings.lang, hydrated]);

  /* ----- Setters individuales ----- */
  const setLang = useCallback(
    (lang: Lang) => setSettings((s) => ({ ...s, lang })),
    []
  );
  const setCurrency = useCallback(
    (currency: Currency) => setSettings((s) => ({ ...s, currency })),
    []
  );
  const setExchangeRate = useCallback((rate: number) => {
    if (!isValidRate(rate)) return; // ignora 0, negativos, NaN
    setSettings((s) => ({ ...s, exchangeRate: rate, rateUpdatedAt: Date.now() }));
  }, []);
  const setShowAlsoMxn = useCallback(
    (b: boolean) => setSettings((s) => ({ ...s, showAlsoMxn: b })),
    []
  );
  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  /* ----- Helpers contextuales ----- */
  const formatMoney = useCallback(
    (amountMxn: number) =>
      pureFormatMoney(amountMxn, {
        currency: settings.currency,
        exchangeRate: settings.exchangeRate,
      }),
    [settings.currency, settings.exchangeRate]
  );

  const convertMoney = useCallback(
    (amountMxn: number) =>
      pureConvertMoney(amountMxn, {
        currency: settings.currency,
        exchangeRate: settings.exchangeRate,
      }),
    [settings.currency, settings.exchangeRate]
  );

  const tFn = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      pureT(key, settings.lang, vars),
    [settings.lang]
  );

  const isUsingDefaultRate =
    settings.rateUpdatedAt === null && settings.exchangeRate === DEFAULT_EXCHANGE_RATE;

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      hydrated,
      isUsingDefaultRate,
      setLang,
      setCurrency,
      setExchangeRate,
      setShowAlsoMxn,
      resetSettings,
      formatMoney,
      convertMoney,
      t: tFn,
    }),
    [
      settings,
      hydrated,
      isUsingDefaultRate,
      setLang,
      setCurrency,
      setExchangeRate,
      setShowAlsoMxn,
      resetSettings,
      formatMoney,
      convertMoney,
      tFn,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings debe usarse dentro de <SettingsProvider>");
  }
  return ctx;
}
