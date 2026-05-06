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
/**
 * Lee el TC del form. Solo es relevante cuando depositCurrency = "USD".
 * Para MXN devuelve null (no aplica). Si la moneda es USD pero el rate viene
 * vacío/inválido, también devuelve null y dejamos que el dashboard caiga al
 * DEFAULT_EXCHANGE_RATE como fallback.
 */
function rateOrNull(
  v: FormDataEntryValue | null,
  currency: "MXN" | "USD",
): number | null {
  if (currency !== "USD") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function createEvent(formData: FormData) {
  const depositCurrency = currencyOrDefault(formData.get("depositCurrency"));
  const depositExchangeRate = rateOrNull(
    formData.get("depositExchangeRate"),
    depositCurrency,
  );

  const data = {
    clientName: str(formData.get("clientName")),
    phone: str(formData.get("phone")) || null,
    eventType: str(formData.get("eventType")),
    date: new Date(str(formData.get("date"))),
    startTime: str(formData.get("startTime")),
    endTime: str(formData.get("endTime")),
    // address: REMOVIDO del form. Eventos nuevos quedan con address = null por
    // default del schema.
    location: str(formData.get("location")) || undefined,
    services: str(formData.get("services")) || null,
    total: num(formData.get("total")),
    deposit: num(formData.get("deposit")),
    // Defensive (mismo patrón que `location`): cuando el anticipo es MXN
    // (default), mandamos `undefined` para que Prisma OMITA estos campos del
    // INSERT y use los defaults del schema (MXN, null). Esto hace que crear
    // eventos en MXN funcione incluso si el cliente Prisma local no está
    // regenerado todavía. Para anticipos USD sí los enviamos explícitamente
    // (en ese caso el usuario DEBE haber corrido `npx prisma generate`).
    depositCurrency: depositCurrency === "MXN" ? undefined : depositCurrency,
    depositExchangeRate: depositExchangeRate ?? undefined,
    status: str(formData.get("status")) || "apartado",
    currency: currencyOrDefault(formData.get("currency")),
    notes: str(formData.get("notes")) || null,
  };

  const ev = await prisma.event.create({ data });

  // Auto-anticipo: si hay deposit > 0, creamos el primer Payment usando los
  // campos de moneda DEL ANTICIPO (NO los del evento). Esto es el corazón del
  // fix: si el anticipo es USD, el Payment se guarda con currency=USD y el TC
  // capturado, así el dashboard lo convierte correctamente a MXN.
  if (data.deposit > 0) {
    await prisma.payment.create({
      data: {
        eventId: ev.id,
        date: new Date(),
        amount: data.deposit,
        // Igual que arriba: undefined cuando MXN (default), explícito cuando USD.
        currency: depositCurrency === "MXN" ? undefined : depositCurrency,
        exchangeRate: depositExchangeRate ?? undefined,
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
  const depositCurrency = currencyOrDefault(formData.get("depositCurrency"));
  const depositExchangeRate = rateOrNull(
    formData.get("depositExchangeRate"),
    depositCurrency,
  );

  await prisma.event.update({
    where: { id },
    data: {
      clientName: str(formData.get("clientName")),
      phone: str(formData.get("phone")) || null,
      eventType: str(formData.get("eventType")),
      date: new Date(str(formData.get("date"))),
      startTime: str(formData.get("startTime")),
      endTime: str(formData.get("endTime")),
      // address: NO se incluye en el payload (preserva valor viejo de DB).
      // location: undefined cuando vacío para evitar "Invalid update" si el
      // cliente Prisma no está regenerado.
      location: str(formData.get("location")) || undefined,
      services: str(formData.get("services")) || null,
      total: num(formData.get("total")),
      deposit: num(formData.get("deposit")),
      // Defensive: undefined cuando MXN (default schema) o sin TC. Misma razón
      // que `location` arriba — protege contra clientes Prisma desactualizados.
      depositCurrency: depositCurrency === "MXN" ? undefined : depositCurrency,
      depositExchangeRate: depositExchangeRate ?? undefined,
      status: str(formData.get("status")) || "apartado",
      currency: currencyOrDefault(formData.get("currency")),
      notes: str(formData.get("notes")) || null,
    },
  });
  // OJO: NO modificamos el Payment del anticipo aquí. Si el usuario cambia
  // depositCurrency o depositExchangeRate al EDITAR un evento existente, los
  // Payments ya creados quedan como están (cada Payment tiene su propio
  // currency/exchangeRate, son inmutables desde la edición del evento).
  // Para corregir el anticipo viejo el usuario debe editarlo en /pagos.
  revalidatePath("/eventos");
  revalidatePath("/");
  redirect("/eventos");
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  revalidatePath("/eventos");
  revalidatePath("/");
}
