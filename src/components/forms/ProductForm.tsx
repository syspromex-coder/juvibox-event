"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSettings } from "@/lib/settings";

type IngredientInput = {
  id?: string;
  name: string;
  cost: number;
  qtyUsed: number;
  inventoryItemId: string | null;
  inventoryQty: number;
};

type ProductInput = {
  id?: string;
  name: string;
  salePrice: number;
  yieldQty: number;
  notes: string | null;
  ingredients: IngredientInput[];
};

type InventoryOption = {
  id: string;
  name: string;
  unit: string;
};

const blankIng = (): IngredientInput => ({
  name: "",
  cost: 0,
  qtyUsed: 1,
  inventoryItemId: null,
  inventoryQty: 0,
});

export default function ProductForm({
  product,
  inventory,
  action,
  submitLabel,
}: {
  product?: Partial<ProductInput>;
  inventory: InventoryOption[];
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  const { formatMoney, t } = useSettings();
  const submit = submitLabel ?? t("common.save");

  const [name, setName] = useState(product?.name ?? "");
  const [salePrice, setSalePrice] = useState<number>(product?.salePrice ?? 0);
  const [yieldQty, setYieldQty] = useState<number>(product?.yieldQty ?? 1);
  const [notes, setNotes] = useState(product?.notes ?? "");
  const [ings, setIngs] = useState<IngredientInput[]>(
    product?.ingredients && product.ingredients.length > 0
      ? product.ingredients.map((i) => ({
          name: i.name,
          cost: i.cost,
          qtyUsed: i.qtyUsed,
          inventoryItemId: i.inventoryItemId ?? null,
          inventoryQty: i.inventoryQty ?? 0,
        }))
      : [blankIng()]
  );

  const recipeCost = useMemo(
    () => ings.reduce((s, i) => s + (Number(i.cost) || 0) * (Number(i.qtyUsed) || 0), 0),
    [ings]
  );
  const unitCost = yieldQty > 0 ? recipeCost / yieldQty : 0;
  const profit = salePrice - unitCost;
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

  function update(idx: number, patch: Partial<IngredientInput>) {
    setIngs((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function remove(idx: number) {
    setIngs((cur) => cur.filter((_, i) => i !== idx));
  }
  function add() {
    setIngs((cur) => [...cur, blankIng()]);
  }

  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">{t("form.product_name")} *</label>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">
              {t("form.sale_price")}{" "}
              <span className="text-slate-400 normal-case">
                ({t("common.in_mxn")})
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="salePrice"
              value={salePrice}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("form.yield_qty")}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="yieldQty"
              value={yieldQty}
              onChange={(e) => setYieldQty(Number(e.target.value))}
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">{t("form.yield_qty.hint")}</p>
          </div>
          <div>
            <label className="label">{t("form.notes")}</label>
            <input
              name="notes"
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Ingredientes */}
      <div className="card p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">{t("form.ingredients")}</h3>
          <button type="button" onClick={add} className="btn-secondary btn-sm">
            {t("form.add_ingredient")}
          </button>
        </div>

        <div className="space-y-3">
          {ings.map((it, idx) => (
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
                  aria-label={t("form.remove")}
                >
                  ✕ {t("form.remove")}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label className="label">{t("form.ingredient.name")}</label>
                  <input
                    name="ing_name"
                    value={it.name}
                    onChange={(e) => update(idx, { name: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="label">
                    {t("form.ingredient.cost")}{" "}
                    <span className="text-slate-400 normal-case">
                      ({t("common.in_mxn")})
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    name="ing_cost"
                    value={it.cost}
                    onChange={(e) => update(idx, { cost: Number(e.target.value) })}
                    placeholder="0.00"
                    className="input"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="label">{t("form.ingredient.qty")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    name="ing_qty"
                    value={it.qtyUsed}
                    onChange={(e) => update(idx, { qtyUsed: Number(e.target.value) })}
                    className="input"
                  />
                </div>

                {/* Vínculo a inventario */}
                <div className="sm:col-span-7">
                  <label className="label">{t("form.ingredient.inventory")}</label>
                  <select
                    name="ing_inv"
                    value={it.inventoryItemId ?? ""}
                    onChange={(e) =>
                      update(idx, { inventoryItemId: e.target.value || null })
                    }
                    className="select"
                  >
                    <option value="">{t("form.ingredient.inventory_none")}</option>
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <label className="label">{t("form.ingredient.inventory_qty")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    name="ing_inv_qty"
                    value={it.inventoryQty}
                    onChange={(e) =>
                      update(idx, { inventoryQty: Number(e.target.value) })
                    }
                    disabled={!it.inventoryItemId}
                    className="input disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                {it.inventoryItemId && (
                  <p className="sm:col-span-12 text-xs text-slate-500">
                    {t("form.ingredient.inventory_qty.hint")}
                  </p>
                )}
              </div>
            </div>
          ))}

          {ings.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              {t("form.add_ingredient")}
            </div>
          )}

          <p className="text-xs text-slate-500">{t("form.tip.qty_used")}</p>
        </div>
      </div>

      {/* Cálculo automático */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-3 sm:p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("products.label.recipe_cost")}
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
            {formatMoney(recipeCost)}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("products.label.unit_cost")}
          </div>
          <div className="mt-1 text-base font-semibold text-rose-700 sm:text-lg">
            {formatMoney(unitCost)}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("products.label.profit")}
          </div>
          <div
            className={`mt-1 text-base font-semibold sm:text-lg ${
              profit >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatMoney(profit)}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("products.label.margin")}
          </div>
          <div
            className={`mt-1 text-base font-semibold sm:text-lg ${
              margin >= 0 ? "text-brand-700" : "text-rose-700"
            }`}
          >
            {margin.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="above-bottom-nav sticky z-10 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <Link href="/productos" className="btn-secondary flex-1 lg:flex-none">
          {t("common.cancel")}
        </Link>
        <button type="submit" className="btn-primary flex-1 lg:flex-none">
          {submit}
        </button>
      </div>
    </form>
  );
}
