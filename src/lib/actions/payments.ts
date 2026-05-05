"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const num = (v: FormDataEntryValue | null) => (v ? Number(v) : 0);
const str = (v: FormDataEntryValue | null) => (v ? String(v) : "");

export async function createPayment(formData: FormData) {
  const eventId = str(formData.get("eventId"));
  const amount = num(formData.get("amount"));
  await prisma.payment.create({
    data: {
      eventId,
      date: new Date(str(formData.get("date"))),
      amount,
      method: str(formData.get("method")),
      note: str(formData.get("note")) || null,
    },
  });

  // Si la suma de pagos cubre el total, marcar evento como pagado
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    include: { payments: true },
  });
  if (ev) {
    const paid = ev.payments.reduce((s, p) => s + p.amount, 0);
    if (paid >= ev.total && ev.status !== "cancelado") {
      await prisma.event.update({ where: { id: eventId }, data: { status: "pagado" } });
    }
  }

  revalidatePath("/pagos");
  revalidatePath("/eventos");
  revalidatePath("/");
  redirect("/pagos");
}

export async function updatePayment(id: string, formData: FormData) {
  await prisma.payment.update({
    where: { id },
    data: {
      eventId: str(formData.get("eventId")),
      date: new Date(str(formData.get("date"))),
      amount: num(formData.get("amount")),
      method: str(formData.get("method")),
      note: str(formData.get("note")) || null,
    },
  });
  revalidatePath("/pagos");
  revalidatePath("/eventos");
  revalidatePath("/");
  redirect("/pagos");
}

export async function deletePayment(id: string) {
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/pagos");
  revalidatePath("/eventos");
  revalidatePath("/");
}
