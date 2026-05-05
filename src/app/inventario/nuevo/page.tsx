import PageHeader from "@/components/layout/PageHeader";
import InventoryForm from "@/components/forms/InventoryForm";
import { createInventoryItem } from "@/lib/actions/inventory";
import { getServerT } from "@/lib/i18n-server";

export default async function NuevoArticuloPage() {
  const t = await getServerT();
  return (
    <div>
      <PageHeader
        title={t("page.inventario.new")}
        subtitle={t("form.inventory.subtitle")}
      />
      <InventoryForm action={createInventoryItem} submitLabel={t("form.btn.create_item")} />
    </div>
  );
}
