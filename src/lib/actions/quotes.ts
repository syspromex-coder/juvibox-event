"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const num = (v: FormDataEntryValue | null) => (v ? Number(v) : 0);
const str = (v: FormDataEntryValue | null) => (v ? String(v) : "");

const VALID_STATUS = new Set(["borrador", "enviada", "aceptada", "rechazada"]);

type QuoteItemInput = {
  productId: string | null;
  name: string;
  qty: number;
  unitCost: number;
  unitPrice: number;
};

function parseItems(formData: FormData): QuoteItemInput[] {
  const productIds = formData.getAll("item_product").map((v) => String(v ?? ""));
  const names = formData.getAll("item_name").map(String);
  const qtys = formData.getAll("item_qty").map((v) => Number(v) || 0);
  const costs = formData.getAll("item_cost").map((v) => Number(v) || 0);
  const prices = formData.getAll("item_price").map((v) => Number(v) || 0);
  const out: QuoteItemInput[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = (names[i] ?? "").trim();
    if (!name) continue;
    const pid = (productIds[i] ?? "").trim();
    out.push({
      productId: pid || null,
      name,
      qty: qtys[i] ?? 0,
      unitCost: costs[i] ?? 0,
      unitPrice: prices[i] ?? 0,
    });
  }
  return out;
}

function parseDateOrNull(v: FormDataEntryValue | null): Date | null {
  const s = str(v).trim();
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(+d) ? null : d;
}

export async function createQuote(formData: FormData) {
  const items = parseItems(formData);
  const status = str(formData.get("status")) || "borrador";
  const safeStatus = VALID_STATUS.has(status) ? status : "borrador";

  const quote = await prisma.quote.create({
    data: {
      clientName: str(formData.get("clientName")),
      phone: str(formData.get("phone")) || null,
      eventType: str(formData.get("eventType")),
      eventDate: parseDateOrNull(formData.get("eventDate")),
      notes: str(formData.get("notes")) || null,
      status: safeStatus,
      items: {
        create: items.map((it, idx) => ({ ...it, position: idx })),
      },
    },
  });

  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${quote.id}/editar`);
}

export async function updateQuote(id: string, formData: FormData) {
  const items = parseItems(formData);
  const status = str(formData.get("status")) || "borrador";
  const safeStatus = VALID_STATUS.has(status) ? status : "borrador";

  await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
  await prisma.quote.update({
    where: { id },
    data: {
      clientName: str(formData.get("clientName")),
      phone: str(formData.get("phone")) || null,
      eventType: str(formData.get("eventType")),
      eventDate: parseDateOrNull(formData.get("eventDate")),
      notes: str(formData.get("notes")) || null,
      status: safeStatus,
      items: {
        create: items.map((it, idx) => ({ ...it, position: idx })),
      },
    },
  });

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${id}/editar`);
  redirect("/cotizaciones");
}

export async function deleteQuote(id: string) {
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/cotizaciones");
}

/**
 * Convierte la cotización en un evento usando los datos capturados.
 * - El total del evento = suma(qty * unitPrice).
 * - services = lista de productos con cantidades.
 * - Marca la cotización como "aceptada" y guarda convertedToEventId/convertedAt.
 *
 * No descuenta inventario aquí (se hace explícitamente desde inventario).
 */
export async function convertQuoteToEvent(id: string, formData: FormData) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!quote) throw new Error("Cotización no encontrada");

  if (quote.convertedToEventId) {
    // Ya fue convertida — redirige al evento existente
    redirect(`/eventos/${quote.convertedToEventId}/editar`);
  }

  const ventaTotal = quote.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const servicesText = quote.items
    .map((it) => `${it.qty} × ${it.name}`)
    .join(", ");

  // Datos opcionales del formulario de conversión
  const startTime = str(formData.get("startTime")) || "12:00";
  const endTime = str(formData.get("endTime")) || "18:00";
  const address = str(formData.get("address")) || null;
  // Si el form de conversión envía una fecha, la usamos; sino la del quote o hoy.
  const eventDate =
    parseDateOrNull(formData.get("date")) ??
    quote.eventDate ??
    new Date();

  const event = await prisma.event.create({
    data: {
      clientName: quote.clientName,
      phone: quote.phone,
      eventType: quote.eventType,
      date: eventDate,
      startTime,
      endTime,
      address,
      services: servicesText,
      total: ventaTotal,
      deposit: 0,
      status: "apartado",
      notes: quote.notes,
    },
  });

  await prisma.quote.update({
    where: { id },
    data: {
      status: "aceptada",
      convertedToEventId: event.id,
      convertedAt: new Date(),
    },
  });

  revalidatePath("/cotizaciones");
  revalidatePath("/eventos");
  redirect(`/eventos/${event.id}/editar`);
}
