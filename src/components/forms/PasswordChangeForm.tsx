import { getServerT } from "@/lib/i18n-server";

export default async function PasswordChangeForm({
  action,
  changedHint = false,
}: {
  action: (formData: FormData) => void;
  changedHint?: boolean;
}) {
  const t = await getServerT();
  return (
    <div className="card p-4 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        {t("users.password.title")}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{t("users.password.hint")}</p>

      {changedHint && (
        <div
          role="status"
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          ✓ {t("users.password.success")}
        </div>
      )}

      <form action={action} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label className="label">{t("users.password.new")} *</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="input"
            autoComplete="new-password"
            placeholder="••••••"
          />
          <p className="mt-1 text-xs text-slate-500">{t("form.user.password.hint")}</p>
        </div>
        <button type="submit" className="btn-primary">
          {t("users.password.update")}
        </button>
      </form>
    </div>
  );
}
