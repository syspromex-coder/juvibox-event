"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const num = (v: FormDataEntryValue | null) => (v ? Number(v) : 0);
const str = (v: FormDataEntryValue | null) => (v ? String(v) : "");

const VALID_UNITS = new Set([
  "piezas",
  "gramos",
  "kilos",
  "litros",
  "mililitros",
  "paquetes",
  "cajas",
]);
const VALID_TYPES = new Set(["entrada", "salida", "ajuste"]);

function parseDateOrNull(v: FormDataEntryValue | null): Date | null {
  const s = str(v).trim();
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(+d) ? null : d;
}

/* ---------- Items ---------- */

export async function createInventoryItem(formData: FormData) {
  const unit = str(formData.get("unit")) || "piezas";
  await prisma.inventoryItem.create({
    data: {
      name: str(formData.get("name")),
      category: str(formData.get("category")) || "General",
      unit: VALID_UNITS.has(unit) ? unit : "piezas",
      stock: num(formData.get("stock")),
      minStock: num(formData.get("minStock")),
      unitCost: num(formData.get("unitCost")),
      supplier: str(formData.get("supplier")) || null,
      notes: str(formData.get("notes")) || null,
    },
  });
  revalidatePath("/inventario");
  redirect("/inventario");
}

export async function updateInventoryItem(id: string, formData: FormData) {
  const unit = str(formData.get("unit")) || "piezas";
  await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: str(formData.get("name")),
      category: str(formData.get("category")) || "General",
      unit: VALID_UNITS.has(unit) ? unit : "piezas",
      stock: num(formData.get("stock")),
      minStock: num(formData.get("minStock")),
      unitCost: num(formData.get("unitCost")),
      supplier: str(formData.get("supplier")) || null,
      notes: str(formData.get("notes")) || null,
    },
  });
  revalidatePath("/inventario");
  revalidatePath(`/inventario/${id}/editar`);
  redirect("/inventario");
}

export async function deleteInventoryItem(id: string) {
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/inventario");
}

/* ---------- Movimientos ---------- */

/**
 * Registra un movimiento y ajusta el stock atómicamente:
 *  - entrada: stock += qty
 *  - salida:  stock -= qty
 *  - ajuste:  stock = qty (set absoluto)
 */
export async function createInventoryMovement(formData: FormData) {
  const itemId = str(formData.get("itemId"));
  const type = str(formData.get("type"));
  const qty = num(formData.get("qty"));
  const unitCost = num(formData.get("unitCost"));
  const reason = str(formData.get("reason")) || null;
  const note = str(formData.get("note")) || null;
  const eventId = str(formData.get("eventId")) || null;
  const date = parseDateOrNull(formData.get("date")) ?? new Date();

  if (!itemId || !VALID_TYPES.has(type) || !Number.isFinite(qty) || qty < 0) {
    throw new Error("Datos del movimiento inválidos");
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Artículo no encontrado");

  let newStock = item.stock;
  if (type === "entrada") newStock = item.stock + qty;
  else if (type === "salida") newStock = Math.max(0, item.stock - qty);
  else if (type === "ajuste") newStock = qty;

  await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        itemId,
        type,
        date,
        qty,
        unitCost,
        reason,
        note,
        eventId: eventId || null,
      },
    }),
    prisma.inventoryItem.update({
      where: { id: itemId },
      data: { stock: newStock },
    }),
  ]);

  revalidatePath("/inventario");
  revalidatePath(`/inventario/${itemId}`);
  redirect(`/inventario/${itemId}`);
}

/**
 * Eliminar un movimiento revierte su efecto sobre el stock.
 *  - entrada eliminada: stock -= qty
 *  - salida eliminada:  stock += qty
 *  - ajuste eliminado:  no se puede revertir con precisión histórica;
 *                       no afectamos stock (solo borramos el registro).
 */
export async function deleteInventoryMovement(id: string) {
  const mov = await prisma.inventoryMovement.findUnique({ where: { id } });
  if (!mov) return;

  const item = await prisma.inventoryItem.findUnique({ where: { id: mov.itemId } });
  if (!item) {
    await prisma.inventoryMovement.delete({ where: { id } });
    return;
  }

  let newStock = item.stock;
  if (mov.type === "entrada") newStock = Math.max(0, item.stock - mov.qty);
  else if (mov.type === "salida") newStock = item.stock + mov.qty;
  // ajuste: no revertimos (no sabemos el valor previo)

  await prisma.$transaction([
    prisma.inventoryMovement.delete({ where: { id } }),
    prisma.inventoryItem.update({
      where: { id: item.id },
      data: { stock: newStock },
    }),
  ]);

  revalidatePath("/inventario");
  revalidatePath(`/inventario/${mov.itemId}`);
}
