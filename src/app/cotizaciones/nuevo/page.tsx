import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import QuoteForm from "@/components/forms/QuoteForm";
import { createQuote } from "@/lib/actions/quotes";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function NuevaCotizacionPage() {
  const t = await getServerT();
  const [products, inventory] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { ingredients: true },
    }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("page.cotizaciones.new")}
        subtitle={t("form.quote.subtitle")}
      />
      <QuoteForm
        products={products}
        inventory={inventory}
        action={createQuote}
        submitLabel={t("form.btn.create_quote")}
      />
    </div>
  );
}
