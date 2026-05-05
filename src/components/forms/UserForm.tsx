import Link from "next/link";
import { getServerT } from "@/lib/i18n-server";

type UserInput = {
  id?: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
};

export default async function UserForm({
  user,
  action,
  submitLabel,
  mode,
  isSelf = false,
}: {
  user?: Partial<UserInput>;
  action: (formData: FormData) => void;
  submitLabel?: string;
  mode: "create" | "edit";
  /** Si true, el usuario edita su propio perfil → bloquea el toggle de active. */
  isSelf?: boolean;
}) {
  const t = await getServerT();
  const submit = submitLabel ?? t("common.save");
  const u = user ?? {};
  const active = mode === "create" ? true : u.active ?? true;

  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">{t("form.user.name")} *</label>
            <input
              name="name"
              defaultValue={u.name ?? ""}
              required
              className="input"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="label">{t("form.user.email")} *</label>
            <input
              name="email"
              type="email"
              defaultValue={u.email ?? ""}
              required
              className="input"
              autoComplete="email"
              inputMode="email"
              placeholder="ejemplo@juvibox.com"
            />
          </div>

          <div>
            <label className="label">{t("form.user.phone")}</label>
            <input
              name="phone"
              type="tel"
              defaultValue={u.phone ?? ""}
              className="input"
              autoComplete="tel"
              inputMode="tel"
              placeholder="555-123-4567"
            />
          </div>

          <div>
            <label className="label">{t("form.user.role")} *</label>
            <select
              name="role"
              defaultValue={u.role ?? "EMPLEADO"}
              required
              className="select"
            >
              <option value="EMPLEADO">{t("role.empleado")}</option>
              <option value="ADMIN">{t("role.admin")}</option>
            </select>
          </div>

          {/* Solo en CREATE pedimos contraseña inicial */}
          {mode === "create" && (
            <div>
              <label className="label">{t("form.user.password")} *</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="input"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-slate-500">{t("form.user.password.hint")}</p>
            </div>
          )}

          {/* Active toggle — siempre visible, deshabilitado si es self-edit */}
          <div className={mode === "create" ? "" : "md:col-span-2"}>
            <label className="label">{t("form.user.active")}</label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={active}
                disabled={isSelf}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="font-medium text-slate-800">
                {t("form.user.active.label")}
              </span>
              {isSelf && (
                <span className="ml-auto text-xs text-slate-400">
                  {t("form.user.active.self")}
                </span>
              )}
            </label>
            <p className="mt-1 text-xs text-slate-500">{t("form.user.active.hint")}</p>
          </div>
        </div>
      </div>

      <div className="above-bottom-nav sticky z-10 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <Link href="/usuarios" className="btn-secondary flex-1 lg:flex-none">
          {t("common.cancel")}
        </Link>
        <button type="submit" className="btn-primary flex-1 lg:flex-none">
          {submit}
        </button>
      </div>
    </form>
  );
}
