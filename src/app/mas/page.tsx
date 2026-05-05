import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import UserMenu from "@/components/layout/UserMenu";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function MasPage() {
  // Defensa: solo ADMIN llega aquí (middleware ya redirige EMPLEADO)
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "EMPLEADO") {
    redirect("/mi-agenda");
  }

  const t = await getServerT();
  const items = [
    { href: "/pagos", labelKey: "nav.pagos", icon: "💵" },
    { href: "/gastos", labelKey: "nav.gastos", icon: "🧾" },
    { href: "/productos", labelKey: "nav.productos", icon: "📦" },
    { href: "/usuarios", labelKey: "nav.usuarios", icon: "👥" },
    { href: "/configuracion", labelKey: "nav.configuracion", icon: "⚙️" },
  ];
  return (
    <div className="space-y-5">
      <PageHeader title={t("page.mas.title")} subtitle={t("page.mas.subtitle")} hideTitleOnMobile />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map(({ href, labelKey, icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="card flex h-28 flex-col items-center justify-center gap-2 p-4 text-center hover:border-brand-300 hover:bg-brand-50/30 active:scale-[0.98]"
            >
              <span className="text-3xl" aria-hidden>
                {icon}
              </span>
              <span className="text-sm font-medium text-slate-800">{t(labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Cuenta */}
      <section>
        <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("auth.account")}
        </h2>
        <UserMenu />
      </section>
    </div>
  );
}
