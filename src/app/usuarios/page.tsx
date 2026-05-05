import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import DeleteButton from "@/components/ui/DeleteButton";
import ToggleActiveButton from "@/components/ui/ToggleActiveButton";
import { deleteUser } from "@/lib/actions/users";
import { fmtDate } from "@/lib/utils";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  // Guarda server-side: solo ADMIN.
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/mi-agenda");
  }

  const t = await getServerT();
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  // ¿Cuántos admins activos hay? Para deshabilitar acciones cuando sea el último.
  const activeAdminCount = users.filter((u) => u.role === "ADMIN" && u.active).length;

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: t("role.admin"),
    EMPLEADO: t("role.empleado"),
  };
  const ROLE_COLORS: Record<string, string> = {
    ADMIN: "border-brand-200 bg-brand-50 text-brand-700",
    EMPLEADO: "border-accent-200 bg-accent-50 text-accent-800",
  };

  return (
    <div>
      <PageHeader
        title={t("page.usuarios.title")}
        subtitle={t("page.usuarios.subtitle")}
        hideTitleOnMobile
      />

      {/* Botón "+ Nuevo usuario" SIEMPRE visible (móvil y desktop) */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {t("page.usuarios.count", { count: String(users.length) })}
        </p>
        <Link href="/usuarios/nuevo" className="btn-primary w-full sm:w-auto">
          + {t("page.usuarios.new")}
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="card p-8 text-center sm:p-10">
          <p className="text-sm text-slate-500">{t("page.usuarios.empty")}</p>
          <Link href="/usuarios/nuevo" className="btn-primary mt-4">
            + {t("page.usuarios.empty.cta")}
          </Link>
        </div>
      ) : (
        <>
          {/* MÓVIL — cards */}
          <ul className="space-y-3 lg:hidden">
            {users.map((u) => {
              const isSelf = u.id === session?.user?.id;
              const isLastAdmin =
                u.role === "ADMIN" && u.active && activeAdminCount <= 1;
              const cantToggle = isSelf || isLastAdmin;
              const cantDelete = isSelf || isLastAdmin;
              return (
                <li key={u.id} className={`list-card ${!u.active ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-base font-semibold text-slate-900">
                          {u.name}
                        </span>
                        <span className={`badge ${ROLE_COLORS[u.role] ?? ""}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                        {!u.active && (
                          <span className="badge border-slate-300 bg-slate-100 text-slate-600">
                            {t("users.inactive")}
                          </span>
                        )}
                        {isSelf && (
                          <span className="badge border-slate-200 bg-slate-50 text-slate-500">
                            {t("users.you")}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                      {u.phone && <p className="text-xs text-slate-500">📞 {u.phone}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/usuarios/${u.id}/editar`}
                      className="btn-secondary btn-sm flex-1"
                    >
                      ✎ {t("common.edit")}
                    </Link>
                    <ToggleActiveButton
                      userId={u.id}
                      active={u.active}
                      disabled={cantToggle && u.active}
                    />
                    {!cantDelete && (
                      <DeleteButton
                        action={deleteUser.bind(null, u.id)}
                        label={t("common.delete")}
                        className="btn-danger btn-sm"
                        message={t("users.delete.confirm", { name: u.name })}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* DESKTOP — tabla */}
          <div className="hidden lg:block">
            <div className="table-wrap">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="th">{t("users.col.name")}</th>
                    <th className="th">{t("users.col.email")}</th>
                    <th className="th">{t("users.col.phone")}</th>
                    <th className="th">{t("users.col.role")}</th>
                    <th className="th">{t("users.col.status")}</th>
                    <th className="th">{t("users.col.created")}</th>
                    <th className="th text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === session?.user?.id;
                    const isLastAdmin =
                      u.role === "ADMIN" && u.active && activeAdminCount <= 1;
                    const cantToggle = isSelf || isLastAdmin;
                    const cantDelete = isSelf || isLastAdmin;
                    return (
                      <tr key={u.id} className={`row-hover ${!u.active ? "opacity-60" : ""}`}>
                        <td className="td font-medium text-slate-900">
                          {u.name}
                          {isSelf && (
                            <span className="ml-2 text-xs font-normal text-slate-500">
                              ({t("users.you")})
                            </span>
                          )}
                        </td>
                        <td className="td text-slate-600">{u.email}</td>
                        <td className="td text-slate-600">
                          {u.phone || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="td">
                          <span className={`badge ${ROLE_COLORS[u.role] ?? ""}`}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                        </td>
                        <td className="td">
                          {u.active ? (
                            <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">
                              ● {t("users.active")}
                            </span>
                          ) : (
                            <span className="badge border-slate-300 bg-slate-100 text-slate-600">
                              ○ {t("users.inactive")}
                            </span>
                          )}
                        </td>
                        <td className="td text-slate-500">{fmtDate(u.createdAt)}</td>
                        <td className="td">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/usuarios/${u.id}/editar`}
                              className="btn-secondary btn-sm"
                            >
                              ✎ {t("common.edit")}
                            </Link>
                            <ToggleActiveButton
                              userId={u.id}
                              active={u.active}
                              disabled={cantToggle && u.active}
                            />
                            {!cantDelete ? (
                              <DeleteButton
                                action={deleteUser.bind(null, u.id)}
                                label={t("common.delete")}
                                className="btn-danger btn-sm"
                                message={t("users.delete.confirm", { name: u.name })}
                              />
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
