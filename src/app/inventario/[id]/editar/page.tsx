import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import InventoryForm from "@/components/forms/InventoryForm";
import { updateInventoryItem } from "@/lib/actions/inventory";
import { getServerT } from "@/lib/i18n-server";

export default async function EditarArticuloPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerT();
  const item = await prisma.inventoryItem.findUnique({ where: { id: params.id } });
  if (!item) notFound();

  const update = updateInventoryItem.bind(null, item.id);

  return (
    <div>
      <PageHeader title={t("page.inventario.edit")} subtitle={item.name} />
      <InventoryForm
        item={item}
        action={update}
        submitLabel={t("form.btn.save_changes")}
      />
    </div>
  );
}
