"use client";

import Link from "next/link";
import clsx from "clsx";
import { useSettings } from "@/lib/settings";
import { FiList, FiCalendar } from "react-icons/fi";

type View = "lista" | "calendario";

export default function EventsViewToggle({
  current,
  monthParam,
}: {
  current: View;
  monthParam?: string;
}) {
  const { t } = useSettings();

  const calHref = monthParam
    ? `/eventos?view=calendario&month=${monthParam}`
    : "/eventos?view=calendario";

  const items: { view: View; href: string; label: string; icon: React.ReactNode }[] = [
    {
      view: "lista",
      href: "/eventos",
      label: t("events.view.list"),
      icon: <FiList className="h-5 w-5" />,
    },
    {
      view: "calendario",
      href: calHref,
      label: t("events.view.calendar"),
      icon: <FiCalendar className="h-5 w-5" />,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("events.view.list") + " / " + t("events.view.calendar")}
      className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-card"
    >
      {items.map(({ view, href, label, icon }) => {
        const active = view === current;
        return (
          <Link
            key={view}
            href={href}
            role="tab"
            aria-selected={active}
            className={clsx(
              "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </div>
  );
}
