import { setUserActive } from "@/lib/actions/users";
import { getServerT } from "@/lib/i18n-server";

export default async function ToggleActiveButton({
  userId,
  active,
  disabled = false,
}: {
  userId: string;
  active: boolean;
  disabled?: boolean;
}) {
  const t = await getServerT();
  // bind del action con los args fijos
  const next = !active;
  const action = setUserActive.bind(null, userId, next);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="btn-secondary btn-sm cursor-not-allowed opacity-50"
        title={t("users.toggle.self_disabled")}
      >
        {active ? t("users.deactivate") : t("users.activate")}
      </button>
    );
  }

  return (
    <form action={action}>
      <button
        type="submit"
        className={
          active
            ? "inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
            : "inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
        }
      >
        {active ? "⏸ " + t("users.deactivate") : "▶ " + t("users.activate")}
      </button>
    </form>
  );
}
