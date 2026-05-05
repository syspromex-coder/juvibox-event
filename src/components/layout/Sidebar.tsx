"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { useSettings } from "@/lib/settings";
import UserMenu from "./UserMenu";

// react-icons: una sola librería, varios packs.
import { MdDashboard, MdCelebration, MdReceiptLong } from "react-icons/md";
import {
  FiCalendar,
  FiFileText,
  FiPackage,
  FiSettings,
  FiShoppingBag,
} from "react-icons/fi";
import { FaUsers, FaMoneyBillWave } from "react-icons/fa";

const ADMIN_ITEMS = [
  { href: "/", labelKey: "nav.dashboard", icon: MdDashboard, exact: true },
  { href: "/eventos", labelKey: "nav.eventos", icon: MdCelebration },
  { href: "/cotizaciones", labelKey: "nav.cotizaciones", icon: FiFileText },
  { href: "/inventario", labelKey: "nav.inventario", icon: FiPackage },
  { href: "/pagos", labelKey: "nav.pagos", icon: FaMoneyBillWave },
  { href: "/gastos", labelKey: "nav.gastos", icon: MdReceiptLong },
  { href: "/productos", labelKey: "nav.productos", icon: FiShoppingBag },
  { href: "/usuarios", labelKey: "nav.usuarios", icon: FaUsers },
];

const EMPLEADO_ITEMS = [
  { href: "/mi-agenda", labelKey: "nav.mi-agenda", icon: FiCalendar, exact: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useSettings();
  const { data } = useSession();
  const role = data?.user?.role;

  const items = role === "EMPLEADO" ? EMPLEADO_ITEMS : ADMIN_ITEMS;
  const settingsActive = pathname.startsWith("/configuracion");

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="px-5 py-6">
        <Link href={role === "EMPLEADO" ? "/mi-agenda" : "/"} className="flex items-center gap-3" aria-label="Jubivox Admin">
          <Image src="/logo.png" alt="Jubivox" width={180} height={56} priority className="h-12 w-auto" />
        </Link>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-slate-500">
          {role === "EMPLEADO" ? t("role.empleado") : ""}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ href, labelKey, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={clsx("h-5 w-5", active ? "text-brand-600" : "text-slate-500")} />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-slate-200 p-3">
        <UserMenu />
        {/* Configuración solo para ADMIN */}
        {role !== "EMPLEADO" && (
          <Link
            href="/configuracion"
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              settingsActive
                ? "bg-brand-50 text-brand-700"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            )}
            aria-current={settingsActive ? "page" : undefined}
          >
            <FiSettings
              className={clsx("h-5 w-5", settingsActive ? "text-brand-600" : "text-slate-500")}
            />
            {t("nav.configuracion")}
          </Link>
        )}
        <p className="px-3 text-[11px] text-slate-400">Jubivox Party Rentals</p>
      </div>
    </aside>
  );
}
