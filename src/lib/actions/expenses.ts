"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const num = (v: FormDataEntryValue | null) => (v ? Number(v) : 0);
const str = (v: FormDataEntryValue | null) => (v ? String(v) : "");

export async function createExpense(formData: FormData) {
  const eventId = str(formData.get("eventId"));
  await prisma.expense.create({
    data: {
      date: new Date(str(formData.get("date"))),
      category: str(formData.get("category")),
      description: str(formData.get("description")),
      amount: num(formData.get("amount")),
      eventId: eventId || null,
    },
  });
  revalidatePath("/gastos");
  revalidatePath("/");
  redirect("/gastos");
}

export async function updateExpense(id: string, formData: FormData) {
  const eventId = str(formData.get("eventId"));
  await prisma.expense.update({
    where: { id },
    data: {
      date: new Date(str(formData.get("date"))),
      category: str(formData.get("category")),
      description: str(formData.get("description")),
      amount: num(formData.get("amount")),
      eventId: eventId || null,
    },
  });
  revalidatePath("/gastos");
  revalidatePath("/");
  redirect("/gastos");
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/gastos");
  revalidatePath("/");
}
