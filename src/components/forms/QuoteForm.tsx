"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSettings } from "@/lib/settings";
import {
  quoteItemSubtotalCost,
  quoteItemSubtotalSale,
  quoteItemProfit,
  quoteTotals,
  recipeCost as recipeCostOf,
  unitCost as unitCostOf,
  toInputDate,
} from "@/lib/utils";
import CurrencyDisplay from "@/components/ui/CurrencyDisplay";

type IngredientForCalc = {
  cost: number;
  qtyUsed: number;
  inventoryItemId: string | null;
  inventoryQty: number;
};
type ProductOption = {
  id: string;
  name: string;
  salePrice: number;
  yieldQty: number;
  ingredients: IngredientForCalc[];
};
type InventoryItemOption = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

type QuoteItemInput = {
  productId: string | null;
  name: string;
  qty: number;
  unitCost: number;
  unitPrice: number;
};

type QuoteInput = {
  id?: string;
  clientName: string;
  phone: string | null;
  eventType: string;
  eventDate: Date | string | null;
  notes: string | null;
  status: string;
  convertedToEventId?: string | null;
  items: QuoteItemInput[];
};

const blankItem = (): QuoteItemInput => ({
  productId: null,
  name: "",
  qty: 1,
  unitCost: 0,
  unitPrice: 0,
});

export default function QuoteForm({
  quote,
  products,
  inventory,
  action,
  submitLabel,
  convertedToEventId,
}: {
  quote?: Partial<QuoteInput>;
  products: ProductOption[];
  inventory: InventoryItemOption[];
  action: (formData: FormData) => void;
  submitLabel?: string;
  convertedToEventId?: string | null;
}) {
  const { t } = useSettings();
  const submit = submitLabel ?? t("common.save");

  const [clientName, setClientName] = useState(quote?.clientName ?? "");
  const [phone, setPhone] = useState(quote?.phone ?? "");
  const [eventType, setEventType] = useState(quote?.eventType ?? "");
  const [eventDate, setEventDate] = useState(
    quote?.eventDate ? toInputDate(quote.eventDate as any) : ""
  );
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [status, setStatus] = useState(quote?.status ?? "borrador");
  const [items, setItems] = useState<QuoteItemInput[]>(
    quote?.items && quote.items.length > 0
      ? quote.items.map((it) => ({
          productId: it.productId ?? null,
          name: it.name,
          qty: it.qty,
          unitCost: it.unitCost,
          unitPrice: it.unitPrice,
        }))
      : [blankItem()]
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  function pickProduct(idx: number, productId: string) {
    const p = productMap.get(productId);
    if (!p) {
      // sin producto = item personalizado
      update(idx, { productId: null });
      return;
    }
    const uc = unitCostOf(p.ingredients, p.yieldQty);
    update(idx, {
      productId: p.id,
      name: p.name,
      unitCost: uc,
      unitPrice: p.salePrice,
    });
  }

  function update(idx: number, patch: Partial<QuoteItemInput>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function remove(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx));
  }
  function add() {
    setItems((cur) => [...cur, blankItem()]);
  }

  const totals = useMemo(() => quoteTotals(items), [items]);

  // Estimación de inventario requerido
  const invNeeds = useMemo(() => {
    const needs = new Map<string, number>();
    for (const it of items) {
      if (!it.productId) continue;
      const p = productMap.get(it.productId);
      if (!p || !p.yieldQty || p.yieldQty <= 0) continue;
      const recetas = (it.qty || 0) / p.yieldQty;
      for (const ing of p.ingredients) {
        if (!ing.inventoryItemId || !ing.inventoryQty) continue;
        const prev = needs.get(ing.inventoryItemId) ?? 0;
        needs.set(ing.inventoryItemId, prev + ing.inventoryQty * recetas);
      }
    }
    return needs;
  }, [items, productMap]);

  const inventoryRows = useMemo(() => {
    const invMap = new Map(inventory.map((i) => [i.id, i]));
    return Array.from(invNeeds.entries())
      .map(([id, required]) => {
        const item = invMap.get(id);
        if (!item) return null;
        const after = item.stock - required;
        return {
          id,
          name: item.name,
          unit: item.unit,
          available: item.stock,
          required,
          after,
          ok: after >= 0,
        };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      unit: string;
      available: number;
      required: number;
      after: number;
      ok: boolean;
    }[];
  }, [invNeeds, inventory]);

  return (
    <form action={action} className="space-y-4">
      {/* Banner de cotización ya convertida */}
      {convertedToEventId && (
        <div className="card flex items-center justify-between gap-3 border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm text-emerald-900">
            ✓ {t("quote.converted.label")}.
          </div>
          <Link
            href={`/eventos/${convertedToEventId}`}
            className="text-sm font-medium text-emerald-800 hover:underline"
          >
            {t("quote.converted.go")}
          </Link>
        </div>
      )}

      {/* Datos básicos */}
      <div className="card space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">{t("form.client_name")} *</label>
            <input
              name="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.phone")}</label>
            <input
              name="phone"
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.event_type")} *</label>
            <input
              name="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.date")}</label>
            <input
              type="date"
              name="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.status")}</label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select"
            >
              <option value="borrador">{t("quote.status.borrador")}</option>
              <option value="enviada">{t("quote.status.enviada")}</option>
              <option value="aceptada">{t("quote.status.aceptada")}</option>
              <option value="rechazada">{t("quote.status.rechazada")}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">{t("form.notes")}</label>
            <textarea
              name="notes"
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="textarea"
            />
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">
            {t("quote.items.title")}
          </h3>
          <button type="button" onClick={add} className="btn-secondary btn-sm">
            {t("form.btn.add_product")}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            {t("quote.items.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it, idx) => {
              const subCost = quoteItemSubtotalCost(it);
              const subSale = quoteItemSubtotalSale(it);
              const profit = quoteItemProfit(it);
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      ✕ {t("form.remove")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <label className="label">{t("quote.item.product")}</label>
                      <select
                        value={it.productId ?? "__custom"}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "__custom") {
                            update(idx, { productId: null });
                          } else {
                            pickProduct(idx, v);
                          }
                        }}
                        className="select"
                      >
                        <option value="__custom">{t("quote.item.custom")}</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        name="item_product"
                        type="hidden"
                        value={it.productId ?? ""}
                      />
                      <input
                        type="text"
                        name="item_name"
                        value={it.name}
                        onChange={(e) => update(idx, { name: e.target.value })}
                        placeholder={t("quote.item.custom")}
                        className="input mt-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{t("quote.item.qty")}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        name="item_qty"
                        value={it.qty}
                        onChange={(e) => update(idx, { qty: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{t("quote.item.unit_cost")}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        name="item_cost"
                        value={it.unitCost}
                        onChange={(e) => update(idx, { unitCost: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="label">{t("quote.item.unit_price")}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        name="item_price"
                        value={it.unitPrice}
                        onChange={(e) => update(idx, { unitPrice: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white p-2 text-center text-xs">
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500">
                        {t("quote.item.subtotal_cost")}
                      </dt>
                      <dd className="font-semibold text-rose-700">
                        <CurrencyDisplay amountMxn={subCost} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500">
                        {t("quote.item.subtotal_sale")}
                      </dt>
                      <dd className="font-semibold text-slate-900">
                        <CurrencyDisplay amountMxn={subSale} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-slate-500">
                        {t("quote.item.profit")}
                      </dt>
                      <dd
                        className={`font-semibold ${
                          profit >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        <CurrencyDisplay amountMxn={profit} />
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-3 sm:p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("quote.totals.cost")}
          </div>
          <div className="mt-1 text-base font-semibold text-rose-700 sm:text-lg">
            <CurrencyDisplay amountMxn={totals.totalCost} />
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("quote.totals.sale")}
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
            <CurrencyDisplay amountMxn={totals.totalSale} />
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("quote.totals.profit")}
          </div>
          <div
            className={`mt-1 text-base font-semibold sm:text-lg ${
              totals.profit >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            <CurrencyDisplay amountMxn={totals.profit} />
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("quote.totals.margin")}
          </div>
          <div
            className={`mt-1 text-base font-semibold sm:text-lg ${
              totals.margin >= 0 ? "text-brand-700" : "text-rose-700"
            }`}
          >
            {totals.margin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Inventario requerido */}
      <div className="card p-4 sm:p-6">
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          {t("quote.inventory.title")}
        </h3>
        {inventoryRows.length === 0 ? (
          <p className="text-sm text-slate-500">{t("quote.inventory.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">{t("inventory.col.name")}</th>
                  <th className="px-3 py-2 text-right">{t("quote.inventory.required")}</th>
                  <th className="px-3 py-2 text-right">{t("quote.inventory.available")}</th>
                  <th className="px-3 py-2 text-right">{t("quote.inventory.after")}</th>
                  <th className="px-3 py-2">{t("quote.col.status")}</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{row.name}</td>
                    <td className="px-3 py-2 text-right">
                      {row.required.toFixed(2)} {row.unit}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.available.toFixed(2)} {row.unit}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${
                        row.ok ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {row.after.toFixed(2)} {row.unit}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`badge ${
                          row.ok
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {row.ok
                          ? t("quote.inventory.status.ok")
                          : t("quote.inventory.status.short")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="above-bottom-nav sticky z-10 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <Link href="/cotizaciones" className="btn-secondary flex-1 lg:flex-none">
          {t("common.cancel")}
        </Link>
        <button type="submit" className="btn-primary flex-1 lg:flex-none">
          {submit}
        </button>
      </div>
    </form>
  );
}
