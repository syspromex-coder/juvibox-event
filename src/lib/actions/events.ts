"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function num(v: FormDataEntryValue | null) {
  return v ? Number(v) : 0;
}
function str(v: FormDataEntryValue | null) {
  return v ? String(v) : "";
}
/** Solo acepta "MXN" o "USD". Cualquier otro valor cae a "MXN" para evitar datos inválidos. */
function currencyOrDefault(v: FormDataEntryValue | null): "MXN" | "USD" {
  const s = String(v ?? "").toUpperCase();
  return s === "USD" ? "USD" : "MXN";
}

export async function createEvent(formData: FormData) {
  const data = {
    clientName: str(formData.get("clientName")),
    phone: str(formData.get("phone")) || null,
    eventType: str(formData.get("eventType")),
    date: new Date(str(formData.get("date"))),
    startTime: str(formData.get("startTime")),
    endTime: str(formData.get("endTime")),
    address: str(formData.get("address")) || null,
    services: str(formData.get("services")) || null,
    total: num(formData.get("total")),
    deposit: num(formData.get("deposit")),
    status: str(formData.get("status")) || "apartado",
    currency: currencyOrDefault(formData.get("currency")),
    notes: str(formData.get("notes")) || null,
  };

  const ev = await prisma.event.create({ data });

  // Si hay anticipo, registrar como primer pago
  if (data.deposit > 0) {
    await prisma.payment.create({
      data: {
        eventId: ev.id,
        date: new Date(),
        amount: data.deposit,
        method: "anticipo",
        note: "Anticipo inicial",
      },
    });
  }

  revalidatePath("/eventos");
  revalidatePath("/");
  redirect("/eventos");
}

export async function updateEvent(id: string, formData: FormData) {
  await prisma.event.update({
    where: { id },
    data: {
      clientName: str(formData.get("clientName")),
      phone: str(formData.get("phone")) || null,
      eventType: str(formData.get("eventType")),
      date: new Date(str(formData.get("date"))),
      startTime: str(formData.get("startTime")),
      endTime: str(formData.get("endTime")),
      address: str(formData.get("address")) || null,
      services: str(formData.get("services")) || null,
      total: num(formData.get("total")),
      deposit: num(formData.get("deposit")),
      status: str(formData.get("status")) || "apartado",
      currency: currencyOrDefault(formData.get("currency")),
      notes: str(formData.get("notes")) || null,
    },
  });
  revalidatePath("/eventos");
  revalidatePath("/");
  redirect("/eventos");
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  revalidatePath("/eventos");
  revalidatePath("/");
}
