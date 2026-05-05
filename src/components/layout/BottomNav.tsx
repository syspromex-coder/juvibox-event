"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import clsx from "clsx";
import { useSettings } from "@/lib/settings";

// Iconos: react-icons. Una sola librería con varios packs (md/fi).
// Md = Material Design, Fi = Feather. Los componentes aceptan `className`
// igual que un <svg>, así que las clases h-/w-/text- existentes se mantienen
// sin tocar el layout.
import { MdDashboard, MdCelebration } from "react-icons/md";
import {
  FiCalendar,
  FiFileText,
  FiPackage,
  FiMoreHorizontal,
  FiLogOut,
} from "react-icons/fi";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useSettings();
  const { data } = useSession();
  const role = data?.user?.role;

  // ---- EMPLEADO: solo "Mi Agenda" + Salir ----
  if (role === "EMPLEADO") {
    const active = pathname.startsWith("/mi-agenda");
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm pb-safe lg:hidden"
        aria-label="Navegación principal"
      >
        <ul className="mx-auto grid max-w-md grid-cols-2">
          <li>
            <Link
              href="/mi-agenda"
              className={clsx(
                "flex h-16 flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium transition-colors",
                active ? "text-brand-600" : "text-slate-500"
              )}
            >
              <span className={clsx("grid h-7 w-7 place-items-center rounded-full", active && "bg-brand-50")}>
                <FiCalendar className="h-5 w-5" />
              </span>
              <span className="leading-none">{t("nav.mi-agenda")}</span>
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-rose-700"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full">
                <FiLogOut className="h-5 w-5" />
              </span>
              <span className="leading-none">{t("auth.logout")}</span>
            </button>
          </li>
        </ul>
      </nav>
    );
  }

  // ---- ADMIN: navegación completa ----
  // Eventos usa MdCelebration (party popper) en vez de calendario, para reflejar
  // el contexto de Juvibox Party Rentals.
  const items = [
    { href: "/", labelKey: "nav.inicio", icon: MdDashboard, match: (p: string) => p === "/" },
    { href: "/eventos", labelKey: "nav.eventos", icon: MdCelebration, match: (p: string) => p.startsWith("/eventos") },
    { href: "/cotizaciones", labelKey: "nav.cotizaciones", icon: FiFileText, match: (p: string) => p.startsWith("/cotizaciones") },
    { href: "/inventario", labelKey: "nav.inventario", icon: FiPackage, match: (p: string) => p.startsWith("/inventario") },
    {
      href: "/mas",
      labelKey: "nav.mas",
      icon: FiMoreHorizontal,
      match: (p: string) =>
        p.startsWith("/mas") ||
        p.startsWith("/pagos") ||
        p.startsWith("/gastos") ||
        p.startsWith("/productos") ||
        p.startsWith("/usuarios") ||
        p.startsWith("/configuracion"),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm pb-safe lg:hidden"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, labelKey, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex h-16 flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium transition-colors",
                  active ? "text-brand-600" : "text-slate-500 hover:text-slate-800"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className={clsx("grid h-7 w-7 place-items-center rounded-full transition-colors", active && "bg-brand-50")}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="leading-none">{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
