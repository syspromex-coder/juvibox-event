"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useSettings } from "@/lib/settings";

export default function LoginForm() {
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";
  const { t } = useSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);
    if (!res) {
      setError(t("login.error.unknown"));
      return;
    }
    if (res.error) {
      setError(t("login.error.invalid"));
      return;
    }
    // Navegación dura (hard navigation) en lugar de router.push + router.refresh.
    // Razón: en iOS Safari y Android Chrome existe una carrera entre el
    // Set-Cookie de la sesión que acaba de emitir NextAuth y el siguiente
    // render. Con router.push() la navegación SPA puede ocurrir antes de que
    // la cookie esté disponible, el middleware no ve sesión y rebota a /login.
    // window.location.assign() fuerza una request HTTP nueva, garantizando
    // que la cookie ya esté aplicada cuando el server-side render se ejecute.
    //
    // callbackUrl por defecto es "/" (el dashboard, src/app/page.tsx). Si
    // el role es EMPLEADO, el middleware lo redirige automáticamente a /mi-agenda.
    window.location.assign(callbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Jubivox"
            width={240}
            height={80}
            priority
            className="h-16 w-auto"
          />
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-slate-500">
            Admin
          </p>
        </div>

        {/* Card de login */}
        <div className="card p-5 sm:p-6">
          <h1 className="text-lg font-semibold text-slate-900">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("login.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@juvibox.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                {t("login.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
                  aria-label={show ? t("login.hide") : t("login.show")}
                >
                  {show ? t("login.hide") : t("login.show")}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("login.loading") : t("login.submit")}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">Jubivox Party Rentals</p>
      </div>
    </div>
  );
}
