import Link from "next/link";

type Props = {
  title: string;
  /** Subtítulo: puede ser texto o JSX (para incluir <CurrencyDisplay/>). */
  subtitle?: React.ReactNode;
  /** Acción principal: en móvil se reemplaza por el FAB. */
  action?: { href: string; label: string };
  /** Si es true, oculta el title (cuando ya lo muestra el header móvil). */
  hideTitleOnMobile?: boolean;
  /** Slot derecho extra: por ejemplo <CurrencyModeBadge/>. */
  rightSlot?: React.ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  action,
  hideTitleOnMobile = false,
  rightSlot,
}: Props) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1
            className={
              "text-2xl font-semibold tracking-tight text-slate-900 sm:text-2xl" +
              (hideTitleOnMobile ? "hidden lg:block" : "")
            }
          >
            {title}
          </h1>
          {/* En móvil, el rightSlot va junto al subtítulo; en desktop al lado del title */}
          {rightSlot && <div className="hidden lg:inline-flex">{rightSlot}</div>}
        </div>
        {(subtitle || rightSlot) && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {subtitle && <span>{subtitle}</span>}
            {rightSlot && <span className="lg:hidden">{rightSlot}</span>}
          </div>
        )}
      </div>
      {action && (
        <Link href={action.href} className="btn-primary hidden lg:inline-flex">
          + {action.label}
        </Link>
      )}
    </div>
  );
}
