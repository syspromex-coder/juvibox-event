import ProductForm from "@/components/forms/ProductForm";
import PageHeader from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/actions/products";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const t = await getServerT();
  const inventory = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true },
  });
  return (
    <div>
      <PageHeader
        title={t("page.productos.new")}
        subtitle={t("form.product.subtitle")}
      />
      <ProductForm
        inventory={inventory}
        action={createProduct}
        submitLabel={t("form.btn.create_product")}
      />
    </div>
  );
}
