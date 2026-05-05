"use client";

import { signOut, useSession } from "next-auth/react";
import { useSettings } from "@/lib/settings";
import { FiLogOut } from "react-icons/fi";

export default function UserMenu() {
  const { data, status } = useSession();
  const { t } = useSettings();

  if (status === "loading") {
    return (
      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        <div className="mt-1.5 h-2.5 w-32 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (!data?.user) return null;

  const initial = (data.user.name || data.user.email || "?").trim().charAt(0).toUpperCase();
  const role = data.user.role;
  const roleLabel = role === "ADMIN" ? t("role.admin") : role === "EMPLEADO" ? t("role.empleado") : null;
  const roleColor =
    role === "ADMIN"
      ? "bg-brand-100 text-brand-700"
      : role === "EMPLEADO"
      ? "bg-accent-100 text-accent-800"
      : "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-slate-900">
              {data.user.name ?? data.user.email}
            </span>
            {roleLabel && (
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${roleColor}`}>
                {roleLabel}
              </span>
            )}
          </div>
          {data.user.email && data.user.name && (
            <div className="truncate text-[11px] text-slate-500">{data.user.email}</div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
      >
        <FiLogOut className="h-3.5 w-3.5" />
        {t("auth.logout")}
      </button>
    </div>
  );
}
