"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const num = (v: FormDataEntryValue | null) => (v ? Number(v) : 0);
const str = (v: FormDataEntryValue | null) => (v ? String(v) : "");

type IngredientInput = {
  name: string;
  cost: number;
  qtyUsed: number;
  inventoryItemId: string | null;
  inventoryQty: number;
};

function parseIngredients(formData: FormData): IngredientInput[] {
  const names = formData.getAll("ing_name").map(String);
  const costs = formData.getAll("ing_cost").map((v) => Number(v) || 0);
  const qtys = formData.getAll("ing_qty").map((v) => Number(v) || 0);
  const invIds = formData.getAll("ing_inv").map((v) => String(v ?? ""));
  const invQtys = formData.getAll("ing_inv_qty").map((v) => Number(v) || 0);

  const out: IngredientInput[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i].trim();
    if (!name) continue;
    const invId = (invIds[i] ?? "").trim();
    out.push({
      name,
      cost: costs[i] ?? 0,
      qtyUsed: qtys[i] ?? 0,
      inventoryItemId: invId || null,
      inventoryQty: invQtys[i] ?? 0,
    });
  }
  return out;
}

export async function createProduct(formData: FormData) {
  const ings = parseIngredients(formData);
  await prisma.product.create({
    data: {
      name: str(formData.get("name")),
      salePrice: num(formData.get("salePrice")),
      yieldQty: num(formData.get("yieldQty")) || 1,
      notes: str(formData.get("notes")) || null,
      ingredients: { create: ings },
    },
  });
  revalidatePath("/productos");
  redirect("/productos");
}

export async function updateProduct(id: string, formData: FormData) {
  const ings = parseIngredients(formData);
  // Reemplazar ingredientes (cascade)
  await prisma.ingredient.deleteMany({ where: { productId: id } });
  await prisma.product.update({
    where: { id },
    data: {
      name: str(formData.get("name")),
      salePrice: num(formData.get("salePrice")),
      yieldQty: num(formData.get("yieldQty")) || 1,
      notes: str(formData.get("notes")) || null,
      ingredients: { create: ings },
    },
  });
  revalidatePath("/productos");
  redirect("/productos");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/productos");
}
