"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/lib/settings";
import { FiSettings } from "react-icons/fi";

const titlePatterns: { match: RegExp; key: string; defaultEs: string }[] = [
  { match: /^\/$/, key: "nav.dashboard", defaultEs: "Dashboard" },
  { match: /^\/eventos\/nuevo/, key: "page.events.new", defaultEs: "Nuevo evento" },
  { match: /^\/eventos\/[^/]+\/editar/, key: "page.events.edit", defaultEs: "Editar evento" },
  { match: /^\/eventos/, key: "nav.eventos", defaultEs: "Eventos" },
  { match: /^\/cotizaciones\/nuevo/, key: "page.cotizaciones.new", defaultEs: "Nueva cotización" },
  { match: /^\/cotizaciones\/[^/]+\/editar/, key: "page.cotizaciones.edit", defaultEs: "Editar cotización" },
  { match: /^\/cotizaciones/, key: "nav.cotizaciones", defaultEs: "Cotizaciones" },
  { match: /^\/inventario\/nuevo/, key: "page.inventario.new", defaultEs: "Nuevo artículo" },
  { match: /^\/inventario\/movimientos\/nuevo/, key: "page.inventario.movement.new", defaultEs: "Nuevo movimiento" },
  { match: /^\/inventario\/[^/]+\/editar/, key: "page.inventario.edit", defaultEs: "Editar artículo" },
  { match: /^\/inventario\/[^/]+/, key: "page.inventario.detail", defaultEs: "Detalle de artículo" },
  { match: /^\/inventario/, key: "nav.inventario", defaultEs: "Inventario" },
  { match: /^\/pagos\/nuevo/, key: "page.payments.new", defaultEs: "Nuevo pago" },
  { match: /^\/pagos\/[^/]+\/editar/, key: "page.payments.edit", defaultEs: "Editar pago" },
  { match: /^\/pagos/, key: "nav.pagos", defaultEs: "Pagos" },
  { match: /^\/gastos\/nuevo/, key: "page.expenses.new", defaultEs: "Nuevo gasto" },
  { match: /^\/gastos\/[^/]+\/editar/, key: "page.expenses.edit", defaultEs: "Editar gasto" },
  { match: /^\/gastos/, key: "nav.gastos", defaultEs: "Gastos" },
  { match: /^\/productos\/nuevo/, key: "page.productos.new", defaultEs: "Nuevo producto" },
  { match: /^\/productos\/[^/]+\/editar/, key: "page.productos.edit", defaultEs: "Editar producto" },
  { match: /^\/productos/, key: "nav.productos", defaultEs: "Productos" },
  { match: /^\/mas/, key: "page.mas.title", defaultEs: "Más opciones" },
  { match: /^\/mi-agenda/, key: "page.mi-agenda.title", defaultEs: "Mi Agenda" },
  { match: /^\/usuarios\/nuevo/, key: "page.usuarios.new", defaultEs: "Nuevo usuario" },
  { match: /^\/usuarios\/[^/]+\/editar/, key: "page.usuarios.edit", defaultEs: "Editar usuario" },
  { match: /^\/usuarios/, key: "nav.usuarios", defaultEs: "Usuarios" },
  { match: /^\/configuracion/, key: "nav.configuracion", defaultEs: "Configuración" },
];

export default function MobileHeader() {
  const pathname = usePathname();
  const { t } = useSettings();

  const found = titlePatterns.find((p) => p.match.test(pathname));
  // Si tenemos clave de i18n usamos t(); sino, fallback al título por defecto.
  const title = found ? t(found.key) : "Jubivox";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm pt-safe lg:hidden">
      <Link href="/" className="flex items-center" aria-label="Inicio">
        <Image
          src="/logo.png"
          alt="Jubivox"
          width={120}
          height={36}
          priority
          className="h-8 w-auto"
        />
      </Link>
      <span className="h-5 w-px bg-slate-200" aria-hidden />
      <h1 className="flex-1 truncate text-base font-semibold text-slate-900">
        {title}
      </h1>

      <Link
        href="/configuracion"
        aria-label={t("nav.configuracion")}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95"
      >
        <FiSettings className="h-5 w-5" />
      </Link>
    </header>
  );
}
