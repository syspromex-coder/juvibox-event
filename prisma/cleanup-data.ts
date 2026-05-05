/**
 * cleanup-data.ts
 * ============================================================
 * Limpia los datos de operación SIN borrar usuarios ni tablas.
 *
 * Uso:
 *   npm run db:cleanup           → modo "dry run", solo muestra qué borraría
 *   npm run db:cleanup -- --yes  → ejecuta el borrado real
 *
 * Lo que SÍ borra:
 *   - Eventos (clientes están embebidos en Event.clientName)
 *   - Pagos
 *   - Gastos
 *   - Cotizaciones y sus items
 *   - Productos e ingredientes
 *   - Inventario y movimientos de inventario
 *
 * Lo que NO toca:
 *   - Tabla User (usuarios y contraseñas se preservan)
 *   - Esquema (no hace migrate, no hace reset, no hace db push)
 *   - Estructura de la base de datos
 * ============================================================
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function countAll() {
  const [
    events,
    payments,
    expenses,
    quotes,
    quoteItems,
    products,
    ingredients,
    inventoryItems,
    inventoryMovements,
    users,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.payment.count(),
    prisma.expense.count(),
    prisma.quote.count(),
    prisma.quoteItem.count(),
    prisma.product.count(),
    prisma.ingredient.count(),
    prisma.inventoryItem.count(),
    prisma.inventoryMovement.count(),
    prisma.user.count(),
  ]);
  return {
    events,
    payments,
    expenses,
    quotes,
    quoteItems,
    products,
    ingredients,
    inventoryItems,
    inventoryMovements,
    users,
  };
}

function printCounts(label: string, c: Awaited<ReturnType<typeof countAll>>) {
  console.log(`\n${label}`);
  console.log(`  Event              : ${c.events}`);
  console.log(`  Payment            : ${c.payments}`);
  console.log(`  Expense            : ${c.expenses}`);
  console.log(`  Quote              : ${c.quotes}`);
  console.log(`  QuoteItem          : ${c.quoteItems}`);
  console.log(`  Product            : ${c.products}`);
  console.log(`  Ingredient         : ${c.ingredients}`);
  console.log(`  InventoryItem      : ${c.inventoryItems}`);
  console.log(`  InventoryMovement  : ${c.inventoryMovements}`);
  console.log(`  User (NO se toca)  : ${c.users}`);
}

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes("--yes") || args.includes("-y");

  console.log("============================================================");
  console.log(" Juvibox Admin — limpieza de datos de operación");
  console.log("============================================================");

  // 1) Mostrar qué tablas se van a limpiar
  console.log("\nModelos/tablas que se van a LIMPIAR (deleteMany):");
  console.log("  1. InventoryMovement   (movimientos de inventario)");
  console.log("  2. Payment             (pagos)");
  console.log("  3. Expense             (gastos)");
  console.log("  4. QuoteItem           (items de cotizaciones)");
  console.log("  5. Quote               (cotizaciones)");
  console.log("  6. Ingredient          (ingredientes de productos)");
  console.log("  7. Product             (productos)");
  console.log("  8. InventoryItem       (artículos de inventario)");
  console.log("  9. Event               (eventos / clientes)");
  console.log("\nModelos que NO se tocan:");
  console.log("  - User (usuarios y contraseñas se preservan)");

  const before = await countAll();
  printCounts("\nConteo ANTES:", before);

  if (!confirmed) {
    console.log("\n--------------------------------------------------------");
    console.log(" DRY RUN: no se borró nada.");
    console.log(" Para ejecutar el borrado real corre:");
    console.log("   npm run db:cleanup -- --yes");
    console.log("--------------------------------------------------------");
    return;
  }

  // 2) Borrar en orden correcto para no chocar con foreign keys
  //
  //    Orden derivado del schema.prisma:
  //      InventoryMovement → InventoryItem (Cascade), Event (SetNull)
  //      Payment           → Event (Cascade)
  //      Expense           → Event (SetNull)
  //      QuoteItem         → Quote (Cascade), Product (SetNull)
  //      Quote             → Event (SetNull)
  //      Ingredient        → Product (Cascade), InventoryItem (SetNull)
  //      Product           → (padre)
  //      InventoryItem     → (padre)
  //      Event             → (padre)
  //
  //    Borramos primero los hijos, después los padres.
  console.log("\nBorrando…");
  const r1 = await prisma.inventoryMovement.deleteMany();
  console.log(`  ✓ InventoryMovement   eliminados: ${r1.count}`);
  const r2 = await prisma.payment.deleteMany();
  console.log(`  ✓ Payment             eliminados: ${r2.count}`);
  const r3 = await prisma.expense.deleteMany();
  console.log(`  ✓ Expense             eliminados: ${r3.count}`);
  const r4 = await prisma.quoteItem.deleteMany();
  console.log(`  ✓ QuoteItem           eliminados: ${r4.count}`);
  const r5 = await prisma.quote.deleteMany();
  console.log(`  ✓ Quote               eliminados: ${r5.count}`);
  const r6 = await prisma.ingredient.deleteMany();
  console.log(`  ✓ Ingredient          eliminados: ${r6.count}`);
  const r7 = await prisma.product.deleteMany();
  console.log(`  ✓ Product             eliminados: ${r7.count}`);
  const r8 = await prisma.inventoryItem.deleteMany();
  console.log(`  ✓ InventoryItem       eliminados: ${r8.count}`);
  const r9 = await prisma.event.deleteMany();
  console.log(`  ✓ Event               eliminados: ${r9.count}`);

  const after = await countAll();
  printCounts("\nConteo DESPUÉS:", after);

  // Sanity check: usuarios deben quedar igual
  if (after.users !== before.users) {
    console.error(
      `\n⚠  ALERTA: el número de usuarios cambió (${before.users} → ${after.users}). Algo se borró que NO debía.`,
    );
  } else {
    console.log(`\n✓ Usuarios intactos: ${after.users}`);
  }

  console.log("\nLimpieza completada. Esquema y usuarios sin cambios.");
}

main()
  .catch((e) => {
    console.error("Error en cleanup-data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
