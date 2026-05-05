import Link from "next/link";
import { getServerT } from "@/lib/i18n-server";
import {
  INVENTORY_UNITS,
  INVENTORY_CATEGORIES_DEFAULT,
  getUnitLabels,
} from "@/lib/utils";

type InventoryInput = {
  id?: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  unitCost: number;
  supplier: string | null;
  notes: string | null;
};

export default async function InventoryForm({
  item,
  action,
  submitLabel,
}: {
  item?: Partial<InventoryInput>;
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  const t = await getServerT();
  const x = item ?? {};
  const submit = submitLabel ?? t("common.save");
  const UNIT = getUnitLabels(t);

  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">{t("inventory.field.name")} *</label>
            <input
              name="name"
              defaultValue={x.name ?? ""}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("inventory.field.category")}</label>
            <input
              name="category"
              defaultValue={x.category ?? "General"}
              list="invcats"
              className="input"
            />
            <datalist id="invcats">
              {INVENTORY_CATEGORIES_DEFAULT.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">{t("inventory.field.unit")} *</label>
            <select
              name="unit"
              defaultValue={x.unit ?? "piezas"}
              className="select"
            >
              {INVENTORY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT[u]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t("inventory.field.stock")}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="stock"
              defaultValue={x.stock ?? 0}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("inventory.field.min_stock")}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="minStock"
              defaultValue={x.minStock ?? 0}
              className="input"
            />
          </div>

          <div>
            <label className="label">
              {t("inventory.field.unit_cost")}{" "}
              <span className="text-slate-400 normal-case">
                ({t("common.in_mxn")})
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="unitCost"
              defaultValue={x.unitCost ?? 0}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("inventory.field.supplier")}</label>
            <input
              name="supplier"
              defaultValue={x.supplier ?? ""}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">{t("form.notes")}</label>
            <textarea
              name="notes"
              defaultValue={x.notes ?? ""}
              rows={3}
              className="textarea"
            />
          </div>
        </div>
      </div>

      <div className="above-bottom-nav sticky z-10 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <Link href="/inventario" className="btn-secondary flex-1 lg:flex-none">
          {t("common.cancel")}
        </Link>
        <button type="submit" className="btn-primary flex-1 lg:flex-none">
          {submit}
        </button>
      </div>
    </form>
  );
}
