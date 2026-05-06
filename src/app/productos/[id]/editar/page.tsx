import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/forms/ProductForm";
import PageHeader from "@/components/layout/PageHeader";
import { updateProduct } from "@/lib/actions/products";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerT();
  const [product, inventory] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { ingredients: true },
    }),
    prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true },
    }),
  ]);
  if (!product) notFound();

  const update = updateProduct.bind(null, product.id);

  return (
    <div>
      <PageHeader title={t("page.productos.edit")} subtitle={product.name} />
      <ProductForm
        product={product}
        inventory={inventory}
        action={update}
        submitLabel={t("form.btn.save_changes")}
      />
    </div>
  );
}
