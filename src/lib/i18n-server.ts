/**
 * Helper para server components: lee la cookie `juvi-lang` y devuelve un `t()`
 * pre-vinculado al idioma actual. La cookie es escrita por SettingsProvider
 * en el cliente cada vez que cambia el idioma.
 *
 * Uso:
 *   const t = await getServerT();
 *   <h1>{t("page.dashboard.title")}</h1>
 *
 * Importante: usa `cookies()` de `next/headers`, lo que hace que la página sea
 * dinámica. Las páginas de Jubivox ya tienen `export const dynamic = "force-dynamic"`.
 */

import { cookies } from "next/headers";
import { type Lang, t as pureT } from "./i18n";

export function getServerLang(): Lang {
  try {
    const c = cookies();
    const v = c.get("juvi-lang")?.value;
    return v === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

/**
 * Devuelve un `t(key, vars?)` pre-vinculado al idioma actual.
 * Async para futura compatibilidad si Next deprecia `cookies()` síncrono.
 */
export async function getServerT(): Promise<
  (key: string, vars?: Record<string, string | number>) => string
> {
  const lang = getServerLang();
  return (key, vars) => pureT(key, lang, vars);
}

/** Alias síncrono — útil cuando ya se sabe que `cookies()` está disponible. */
export function getServerTSync(): {
  lang: Lang;
  t: (key: string, vars?: Record<string, string | number>) => string;
} {
  const lang = getServerLang();
  return { lang, t: (key, vars) => pureT(key, lang, vars) };
}
