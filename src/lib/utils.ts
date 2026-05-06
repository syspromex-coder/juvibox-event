import { DEFAULT_EXCHANGE_RATE } from "./currency";

export const MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export function money(n: number | null | undefined) {
  return MXN.format(Number(n ?? 0));
}

export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function fmtDateShort(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function toInputDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

// ============================================================
// Payments con moneda propia (MXN/USD)
// ============================================================

export type PaymentLike = {
  amount: number;
  /** "MXN" o "USD". Si está vacío/null, se asume "MXN" (back-compat). */
  currency?: string | null;
  /** TC MXN/USD. Solo relevante cuando currency === "USD". */
  exchangeRate?: number | null;
};

/**
 * Equivalente en MXN de un pago.
 *
 *   - currency = "MXN" o vacío → amount tal cual
 *   - currency = "USD" + exchangeRate guardado → amount * exchangeRate (foto exacta)
 *   - currency = "USD" sin exchangeRate → amount * DEFAULT_EXCHANGE_RATE (best-effort)
 *
 * Casos donde exchangeRate puede venir null/0:
 *   - Pagos viejos creados antes de esta columna (currency=MXN igual, no aplica)
 *   - Auto-anticipo de un evento USD con deposit > 0: el sistema lo crea como
 *     currency=USD pero sin TC porque no había nada que convertir cuando solo
 *     se mira en moneda del evento. Para el dashboard MXN, cae a default.
 *   - Datos editados a mano en la BD.
 */
export function paymentAmountMxn(p: PaymentLike): number {
  if (p.currency === "USD") {
    const rate = p.exchangeRate && p.exchangeRate > 0 ? p.exchangeRate : DEFAULT_EXCHANGE_RATE;
    return p.amount * rate;
  }
  return p.amount;
}

export type EventLike = {
  total: number;
  /** Moneda del evento ("MXN" | "USD"). Si vacío se asume MXN. */
  currency?: string | null;
  payments?: PaymentLike[];
  deposit?: number;
};

/**
 * Suma de pagos en la MONEDA DEL EVENTO. Para mostrar "Pagado" y "Pendiente"
 * en cada fila de evento (mantiene su propia moneda).
 *
 *   - Evento MXN + pago MXN → pago.amount
 *   - Evento MXN + pago USD → pago.amount * exchangeRate (USD→MXN)
 *   - Evento USD + pago USD → pago.amount
 *   - Evento USD + pago MXN → pago.amount / exchangeRate (MXN→USD), si rate
 *     está disponible; si no, 0 (defensivo)
 */
export function totalPaid(ev: EventLike): number {
  if (!ev.payments || ev.payments.length === 0) return ev.deposit ?? 0;
  const eventCur = (ev.currency ?? "MXN") === "USD" ? "USD" : "MXN";

  return ev.payments.reduce((sum, p) => {
    const payCur = p.currency === "USD" ? "USD" : "MXN";
    if (payCur === eventCur) {
      return sum + p.amount;
    }
    if (eventCur === "MXN" && payCur === "USD") {
      return sum + p.amount * (p.exchangeRate ?? 0);
    }
    // eventCur === "USD" && payCur === "MXN": pago MXN en evento USD
    const rate = p.exchangeRate ?? 0;
    return sum + (rate > 0 ? p.amount / rate : 0);
  }, 0);
}

/** Saldo pendiente en la moneda del evento. */
export function pendingBalance(ev: EventLike): number {
  return Math.max(0, (ev.total ?? 0) - totalPaid(ev));
}

/**
 * Saldo pendiente convertido a MXN para agregaciones de dashboard.
 * Para eventos MXN: idéntico a pendingBalance.
 * Para eventos USD: pendingBalance(ev) * TC (foto reciente o default).
 */
export function pendingBalanceMxn(ev: EventLike, fallbackRate: number): number {
  const balanceInEventCurrency = pendingBalance(ev);
  if ((ev.currency ?? "MXN") === "MXN") return balanceInEventCurrency;
  // evento USD: convertir a MXN
  const recentRate = ev.payments?.find(
    (p) => p.currency === "USD" && p.exchangeRate && p.exchangeRate > 0,
  )?.exchangeRate;
  return balanceInEventCurrency * (recentRate ?? fallbackRate);
}

export type IngredientLike = { cost: number; qtyUsed: number };

/** Costo total de la receta (suma de costo * cantidad usada). */
export function recipeCost(ings: IngredientLike[]) {
  return ings.reduce((s, i) => s + (i.cost ?? 0) * (i.qtyUsed ?? 0), 0);
}

/** Costo unitario = costo de receta / rendimiento. */
export function unitCost(ings: IngredientLike[], yieldQty: number) {
  if (!yieldQty || yieldQty <= 0) return 0;
  return recipeCost(ings) / yieldQty;
}

/** Utilidad por unidad = precio venta - costo unitario. */
export function unitProfit(ings: IngredientLike[], yieldQty: number, salePrice: number) {
  return (salePrice ?? 0) - unitCost(ings, yieldQty);
}

export function profitMargin(ings: IngredientLike[], yieldQty: number, salePrice: number) {
  if (!salePrice) return 0;
  return (unitProfit(ings, yieldQty, salePrice) / salePrice) * 100;
}

export const STATUS_LABELS: Record<string, string> = {
  apartado: "Apartado",
  confirmado: "Confirmado",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

/** Devuelve los labels de estatus traducidos al idioma activo via la función t(). */
export function getStatusLabels(
  tFn: (key: string) => string
): Record<string, string> {
  return {
    apartado: tFn("status.apartado"),
    confirmado: tFn("status.confirmado"),
    pagado: tFn("status.pagado"),
    cancelado: tFn("status.cancelado"),
  };
}

/** Igual para métodos de pago. */
export function getMethodLabels(
  tFn: (key: string) => string
): Record<string, string> {
  return {
    efectivo: tFn("method.efectivo"),
    transferencia: tFn("method.transferencia"),
    tarjeta: tFn("method.tarjeta"),
    anticipo: tFn("method.anticipo"),
    otro: tFn("method.otro"),
  };
}

export const STATUS_COLORS: Record<string, string> = {
  apartado: "bg-highlight-100 text-highlight-800 border-highlight-200",
  confirmado: "bg-accent-100 text-accent-800 border-accent-200",
  pagado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelado: "bg-rose-100 text-rose-700 border-rose-200",
};

/* ----------- Helpers para la vista de calendario ----------- */

/** Colores para los chips dentro del calendario (más sólidos para mayor visibilidad). */
export const STATUS_CALENDAR_COLORS: Record<string, string> = {
  apartado: "bg-highlight-100 text-highlight-900 border-l-2 border-highlight-500",
  confirmado: "bg-accent-100 text-accent-900 border-l-2 border-accent-500",
  pagado: "bg-emerald-100 text-emerald-900 border-l-2 border-emerald-500",
  cancelado: "bg-rose-100 text-rose-800 border-l-2 border-rose-500 line-through opacity-75",
};

/** Punto pequeño coloreado por estatus (para indicador móvil). */
export const STATUS_DOT_COLORS: Record<string, string> = {
  apartado: "bg-highlight-400",
  confirmado: "bg-accent-500",
  pagado: "bg-emerald-500",
  cancelado: "bg-rose-500",
};

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Días de la semana iniciando en Lunes (estándar México). */
export const WEEK_DAYS_ES_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEK_DAYS_EN_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getWeekDaysShort(lang: "es" | "en" = "es"): string[] {
  return lang === "en" ? WEEK_DAYS_EN_SHORT : WEEK_DAYS_ES_SHORT;
}

/** Parsea "YYYY-MM"; si es inválido, devuelve el mes actual. */
export function parseMonthParam(s: string | undefined | null): { year: number; month: number } {
  if (s) {
    const m = /^(\d{4})-(\d{1,2})$/.exec(s);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]) - 1; // 0-indexed
      if (year >= 1970 && year <= 9999 && month >= 0 && month <= 11) {
        return { year, month };
      }
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/** Formatea como "YYYY-MM" para el query param. */
export function formatMonthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** "Mayo 2026" / "May 2026" */
export function formatMonthName(year: number, month: number, lang: "es" | "en" = "es"): string {
  const names = lang === "en" ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  return `${names[month]} ${year}`;
}

/**
 * Devuelve todas las fechas que se mostrarán en el grid del calendario
 * (incluyendo días del mes anterior y siguiente para completar la semana).
 * Inicia en Lunes.
 */
export function getCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Lunes = 1, Domingo = 0 → días desde el lunes anterior
  const firstDow = firstOfMonth.getDay();
  const daysBeforeMonday = firstDow === 0 ? 6 : firstDow - 1;
  const start = new Date(year, month, 1 - daysBeforeMonday);

  // Días después del último día hasta el domingo
  const lastDow = lastOfMonth.getDay();
  const daysAfterSunday = lastDow === 0 ? 0 : 7 - lastDow;
  const end = new Date(year, month, lastOfMonth.getDate() + daysAfterSunday);

  const cells: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    cells.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/* ============= Cotizaciones ============= */

export const QUOTE_STATUSES = ["borrador", "enviada", "aceptada", "rechazada"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-700 border-slate-200",
  enviada: "bg-accent-100 text-accent-800 border-accent-200",
  aceptada: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rechazada: "bg-rose-100 text-rose-700 border-rose-200",
};

export function getQuoteStatusLabels(
  tFn: (key: string) => string
): Record<string, string> {
  return {
    borrador: tFn("quote.status.borrador"),
    enviada: tFn("quote.status.enviada"),
    aceptada: tFn("quote.status.aceptada"),
    rechazada: tFn("quote.status.rechazada"),
  };
}

type QuoteItemLike = { qty: number; unitCost: number; unitPrice: number };

export function quoteItemSubtotalCost(it: QuoteItemLike): number {
  return (it.qty || 0) * (it.unitCost || 0);
}
export function quoteItemSubtotalSale(it: QuoteItemLike): number {
  return (it.qty || 0) * (it.unitPrice || 0);
}
export function quoteItemProfit(it: QuoteItemLike): number {
  return quoteItemSubtotalSale(it) - quoteItemSubtotalCost(it);
}
export function quoteTotals(items: QuoteItemLike[]) {
  const totalCost = items.reduce((s, it) => s + quoteItemSubtotalCost(it), 0);
  const totalSale = items.reduce((s, it) => s + quoteItemSubtotalSale(it), 0);
  const profit = totalSale - totalCost;
  const margin = totalSale > 0 ? (profit / totalSale) * 100 : 0;
  return { totalCost, totalSale, profit, margin };
}

/* ============= Inventario ============= */

export const INVENTORY_UNITS = [
  "piezas",
  "gramos",
  "kilos",
  "litros",
  "mililitros",
  "paquetes",
  "cajas",
] as const;
export type InventoryUnit = (typeof INVENTORY_UNITS)[number];

export function getUnitLabels(
  tFn: (key: string) => string
): Record<string, string> {
  return {
    piezas: tFn("inventory.unit.piezas"),
    gramos: tFn("inventory.unit.gramos"),
    kilos: tFn("inventory.unit.kilos"),
    litros: tFn("inventory.unit.litros"),
    mililitros: tFn("inventory.unit.mililitros"),
    paquetes: tFn("inventory.unit.paquetes"),
    cajas: tFn("inventory.unit.cajas"),
  };
}

export const INVENTORY_CATEGORIES_DEFAULT = [
  "General",
  "Insumos",
  "Desechables",
  "Photobooth",
  "Decoración",
  "Materiales",
];

export const MOVEMENT_TYPES = ["entrada", "salida", "ajuste"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_COLORS: Record<string, string> = {
  entrada: "bg-emerald-100 text-emerald-800 border-emerald-200",
  salida: "bg-rose-100 text-rose-700 border-rose-200",
  ajuste: "bg-accent-100 text-accent-800 border-accent-200",
};

export function getMovementLabels(
  tFn: (key: string) => string
): Record<string, string> {
  return {
    entrada: tFn("inventory.movement.entrada"),
    salida: tFn("inventory.movement.salida"),
    ajuste: tFn("inventory.movement.ajuste"),
  };
}

type InventoryItemLike = { stock: number; minStock: number; unitCost: number };

export function inventoryItemValue(it: InventoryItemLike): number {
  return (it.stock || 0) * (it.unitCost || 0);
}
export function isLowStock(it: InventoryItemLike): boolean {
  return (it.stock || 0) <= (it.minStock || 0);
}
export function inventoryTotalValue(items: InventoryItemLike[]): number {
  return items.reduce((s, it) => s + inventoryItemValue(it), 0);
}

/**
 * Dado un quote y los productos (con sus ingredientes/inventario), calcula
 * cuánto se necesitará de cada artículo de inventario.
 *
 * Resultado: un Map<inventoryItemId, requiredQty>
 *
 * Para cada quoteItem que apunta a un Product:
 *   - Ese product tiene yieldQty (cuántas unidades produce 1 receta)
 *   - quoteItem.qty = unidades pedidas
 *   - recetasNecesarias = quoteItem.qty / product.yieldQty
 *   - Por cada ingredient con inventoryItemId:
 *       requerido += ingredient.inventoryQty * recetasNecesarias
 */
export function estimateInventoryNeeds<
  Q extends { items: { productId: string | null; qty: number }[] },
  P extends {
    id: string;
    yieldQty: number;
    ingredients: { inventoryItemId: string | null; inventoryQty: number }[];
  }
>(quote: Q, products: P[]): Map<string, number> {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const needs = new Map<string, number>();
  for (const item of quote.items) {
    if (!item.productId) continue;
    const p = productMap.get(item.productId);
    if (!p || !p.yieldQty || p.yieldQty <= 0) continue;
    const recetasNecesarias = (item.qty || 0) / p.yieldQty;
    for (const ing of p.ingredients) {
      if (!ing.inventoryItemId || !ing.inventoryQty) continue;
      const prev = needs.get(ing.inventoryItemId) ?? 0;
      needs.set(ing.inventoryItemId, prev + ing.inventoryQty * recetasNecesarias);
    }
  }
  return needs;
}

// ============================================================
// Google Maps
// ============================================================

/**
 * Construye una URL para abrir una ubicación en Google Maps.
 *
 * Reglas:
 *  - Si el input ya es una URL completa (http/https), se usa tal cual.
 *    Cubre los casos: link de Google Maps (`https://maps.app.goo.gl/...`,
 *    `https://www.google.com/maps/...`), o cualquier link compartido.
 *  - Si NO es URL, se trata como dirección y se construye una búsqueda:
 *    `https://www.google.com/maps/search/?api=1&query=DIRECCION`
 *  - Si está vacío, devuelve null (para que el caller no renderice botón).
 *
 * El resultado siempre se abre en target="_blank" desde el componente
 * OpenInMapsButton — no es responsabilidad de esta función.
 */
export function buildMapsUrl(location: string | null | undefined): string | null {
  if (!location) return null;
  const trimmed = location.trim();
  if (trimmed.length === 0) return null;
  // ¿Es una URL ya?
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Tratar como dirección de texto libre → búsqueda en Google Maps
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

