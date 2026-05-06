"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const num = (v: FormDataEntryValue | null) => (v ? Number(v) : 0);
const str = (v: FormDataEntryValue | null) => (v ? String(v) : "");

/** Solo acepta "MXN" o "USD". Cualquier otro valor cae a "MXN". */
function currencyOrDefault(v: FormDataEntryValue | null): "MXN" | "USD" {
  return String(v ?? "").toUpperCase() === "USD" ? "USD" : "MXN";
}

/**
 * Lee exchangeRate del form. Solo se guarda si hay un valor positivo válido.
 * Para pagos en MXN devolvemos null (no aplica).
 */
function exchangeRateOrNull(
  v: FormDataEntryValue | null,
  currency: "MXN" | "USD",
): number | null {
  if (currency !== "USD") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function createPayment(formData: FormData) {
  const eventId = str(formData.get("eventId"));
  const amount = num(formData.get("amount"));
  const currency = currencyOrDefault(formData.get("currency"));
  const exchangeRate = exchangeRateOrNull(formData.get("exchangeRate"), currency);

  await prisma.payment.create({
    data: {
      eventId,
      date: new Date(str(formData.get("date"))),
      amount,
      currency,
      exchangeRate,
      method: str(formData.get("method")),
      note: str(formData.get("note")) || null,
    },
  });

  // Si la suma de pagos cubre el total del evento, marcar como pagado.
  // OJO: comparamos en la moneda DEL EVENTO, no en MXN, para evitar errores
  // donde un pago USD convertido a MXN parece cubrir un total en MXN.
  // totalPaid del evento ya hace la conversión correcta hacia event.currency.
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    include: { payments: true },
  });
  if (ev && ev.status !== "cancelado") {
    // Importamos aquí para evitar ciclos al cargar el archivo.
    const { totalPaid } = await import("@/lib/utils");
    const paid = totalPaid(ev);
    if (paid >= ev.total) {
      await prisma.event.update({ where: { id: eventId }, data: { status: "pagado" } });
    }
  }

  revalidatePath("/pagos");
  revalidatePath("/eventos");
  revalidatePath("/");
  redirect("/pagos");
}

export async function updatePayment(id: string, formData: FormData) {
  const currency = currencyOrDefault(formData.get("currency"));
  const exchangeRate = exchangeRateOrNull(formData.get("exchangeRate"), currency);

  await prisma.payment.update({
    where: { id },
    data: {
      eventId: str(formData.get("eventId")),
      date: new Date(str(formData.get("date"))),
      amount: num(formData.get("amount")),
      currency,
      exchangeRate,
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
