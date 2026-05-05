import PageHeader from "@/components/layout/PageHeader";
import SettingsForm from "@/components/forms/SettingsForm";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const t = await getServerT();
  return (
    <div>
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        hideTitleOnMobile
      />
      <SettingsForm />
    </div>
  );
}
