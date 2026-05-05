import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { createInventoryMovement } from "@/lib/actions/inventory";
import { getServerT } from "@/lib/i18n-server";
import { MOVEMENT_TYPES, getMovementLabels, getUnitLabels, toInputDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NuevoMovimientoPage({
  searchParams,
}: {
  searchParams: { itemId?: string };
}) {
  const t = await getServerT();
  const MOV = getMovementLabels(t);
  const UNIT = getUnitLabels(t);

  const [items, events] = await Promise.all([
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: { id: true, clientName: true, date: true, eventType: true },
      take: 50,
    }),
  ]);

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title={t("page.inventario.movement.new")} subtitle={t("form.movement.subtitle")} />
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500">{t("page.inventario.empty")}</p>
          <Link href="/inventario/nuevo" className="btn-primary mt-4">
            + {t("page.inventario.empty.cta")}
          </Link>
        </div>
      </div>
    );
  }

  const preselected = searchParams.itemId
    ? items.find((i) => i.id === searchParams.itemId)
    : null;

  return (
    <div>
      <PageHeader
        title={t("page.inventario.movement.new")}
        subtitle={t("form.movement.subtitle")}
      />

      <form action={createInventoryMovement} className="space-y-4">
        <div className="card space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">{t("inventory.col.name")} *</label>
              <select
                name="itemId"
                defaultValue={preselected?.id ?? items[0].id}
                required
                className="select"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} · stock {it.stock} {UNIT[it.unit] ?? it.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t("inventory.history.col.type")} *</label>
              <select name="type" defaultValue="entrada" required className="select">
                {MOVEMENT_TYPES.map((tp) => (
                  <option key={tp} value={tp}>
                    {MOV[tp]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {t("inventory.movement.ajuste.hint")}
              </p>
            </div>
            <div>
              <label className="label">{t("form.date")}</label>
              <input
                type="date"
                name="date"
                defaultValue={toInputDate(new Date())}
                className="input"
              />
            </div>

            <div>
              <label className="label">{t("inventory.movement.field.qty")} *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                name="qty"
                required
                defaultValue={1}
                className="input"
              />
            </div>
            <div>
              <label className="label">
                {t("inventory.movement.field.unit_cost")}{" "}
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
                defaultValue={preselected?.unitCost ?? 0}
                className="input"
              />
            </div>

            <div>
              <label className="label">{t("inventory.movement.field.reason")}</label>
              <input name="reason" className="input" />
            </div>
            <div>
              <label className="label">{t("inventory.movement.field.event")}</label>
              <select name="eventId" defaultValue="" className="select">
                <option value="">{t("form.no_event")}</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.clientName} · {e.eventType}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">{t("inventory.movement.field.note")}</label>
              <textarea name="note" rows={2} className="textarea" />
            </div>
          </div>
        </div>

        <div className="above-bottom-nav sticky z-10 -mx-4 flex gap-2 bg-slate-50/90 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:justify-end lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <Link
            href={preselected ? `/inventario/${preselected.id}` : "/inventario"}
            className="btn-secondary flex-1 lg:flex-none"
          >
            {t("common.cancel")}
          </Link>
          <button type="submit" className="btn-primary flex-1 lg:flex-none">
            {t("form.btn.create_movement")}
          </button>
        </div>
      </form>
    </div>
  );
}
