import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import QuoteForm from "@/components/forms/QuoteForm";
import { updateQuote, convertQuoteToEvent } from "@/lib/actions/quotes";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function EditarCotizacionPage({
  params,
}: {
  params: { id: string };
}) {
  const t = await getServerT();
  const [quote, products, inventory] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { position: "asc" } } },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { ingredients: true },
    }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!quote) notFound();

  const update = updateQuote.bind(null, quote.id);
  const convert = convertQuoteToEvent.bind(null, quote.id);

  const totalSale = quote.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  return (
    <div>
      <PageHeader
        title={t("page.cotizaciones.edit")}
        subtitle={quote.clientName}
      />

      {/* Bloque "Convertir en evento" */}
      {!quote.convertedToEventId && quote.items.length > 0 && (
        <div className="card mb-4 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-slate-900">
            {t("form.btn.convert_to_event")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{t("quote.convert.hint")}</p>
          <form action={convert} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="label">{t("form.start_time")}</label>
              <input type="time" name="startTime" defaultValue="14:00" className="input" />
            </div>
            <div>
              <label className="label">{t("form.end_time")}</label>
              <input type="time" name="endTime" defaultValue="20:00" className="input" />
            </div>
            <div>
              <label className="label">{t("form.address")}</label>
              <input name="address" className="input" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">
                ✓ {t("form.btn.convert_to_event")}
              </button>
            </div>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            {t("quote.totals.sale")}:{" "}
            <strong className="text-slate-800">${totalSale.toFixed(2)} MXN</strong>
          </p>
        </div>
      )}

      <QuoteForm
        quote={quote}
        products={products}
        inventory={inventory}
        action={update}
        submitLabel={t("form.btn.save_changes")}
        convertedToEventId={quote.convertedToEventId}
      />
    </div>
  );
}
