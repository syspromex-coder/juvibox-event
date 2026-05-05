/**
 * scripts/cleanData.ts
 * ============================================================
 * Limpia datos de operación SIN tocar autenticación.
 *
 *   Conservados:    User
 *   Limpiados:      Event, Payment, Expense, Quote, QuoteItem,
 *                   Product, Ingredient, InventoryItem,
 *                   InventoryMovement
 *
 * NO modifica el schema. NO corre migraciones. NO borra tablas.
 * NO toca el archivo .db (solo borra filas).
 *
 * Uso:
 *   npm run clean:data           # dry-run (sólo muestra conteos)
 *   npm run clean:data -- --yes  # ejecuta el borrado real
 * ============================================================
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Credenciales esperadas del admin (para verificación post-limpieza)
const ADMIN_EMAIL = "admin@juvibox.com";
const ADMIN_PASSWORD = "123456";

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
  console.log(`  User (preservado)  : ${c.users}`);
}

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes("--yes") || args.includes("-y");

  console.log("============================================================");
  console.log(" Juvibox Admin — limpieza de datos de operación");
  console.log("============================================================");
  console.log("");
  console.log("Modelos que se LIMPIAN:");
  console.log("  Event, Payment, Expense, Quote, QuoteItem,");
  console.log("  Product, Ingredient, InventoryItem, InventoryMovement");
  console.log("");
  console.log("Modelos que NO se tocan:");
  console.log("  User  (autenticación / login intactos)");

  const before = await countAll();
  printCounts("Conteo ANTES:", before);

  if (!confirmed) {
    console.log("\n--------------------------------------------------------");
    console.log(" DRY RUN: no se borró nada.");
    console.log(" Para ejecutar el borrado real corre:");
    console.log("   npm run clean:data -- --yes");
    console.log("--------------------------------------------------------");
    return;
  }

  // Orden de borrado: hijos → padres, derivado del schema.
  //
  //   InventoryMovement → InventoryItem (Cascade), Event (SetNull)
  //   Payment           → Event (Cascade)
  //   Expense           → Event (SetNull)
  //   QuoteItem         → Quote (Cascade), Product (SetNull)
  //   Quote             → Event (SetNull)
  //   Ingredient        → Product (Cascade), InventoryItem (SetNull)
  //   Product           → padre
  //   InventoryItem     → padre
  //   Event             → padre
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
  printCounts("Conteo DESPUÉS:", after);

  // ---------------------------------------------------------
  // Verificaciones de seguridad
  // ---------------------------------------------------------
  console.log("\nVerificaciones:");

  // 1. User no se tocó
  if (after.users !== before.users) {
    console.error(
      `  ✗ ALERTA: el número de usuarios cambió (${before.users} → ${after.users}). Algo se borró que NO debía.`,
    );
    process.exit(1);
  }
  console.log(`  ✓ Usuarios intactos: ${after.users} (igual que antes)`);

  // 2. Existe al menos el admin
  if (after.users < 1) {
    console.error("  ✗ ALERTA: no hay ningún usuario en la DB. El login no funcionará.");
    process.exit(1);
  }
  const admin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase() },
  });
  if (!admin) {
    console.error(`  ✗ ALERTA: el usuario "${ADMIN_EMAIL}" NO existe en la DB.`);
    console.error(`    Ejecuta:  npm run db:create-admin`);
    process.exit(1);
  }
  console.log(`  ✓ Usuario admin existe: ${admin.email} (active=${admin.active}, role=${admin.role})`);

  // 3. El password del admin sigue siendo válido (login funcionará)
  const passwordValid = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
  if (!passwordValid) {
    console.error(`  ✗ ALERTA: bcrypt.compare falló. La contraseña del admin no es "${ADMIN_PASSWORD}".`);
    console.error(`    Ejecuta:  npm run db:create-admin   (resetea el password)`);
    process.exit(1);
  }
  console.log(`  ✓ Login válido: bcrypt.compare("${ADMIN_PASSWORD}", hash) = true`);

  // 4. Todos los demás conteos deben ser 0
  const operationalTotal =
    after.events +
    after.payments +
    after.expenses +
    after.quotes +
    after.quoteItems +
    after.products +
    after.ingredients +
    after.inventoryItems +
    after.inventoryMovements;
  if (operationalTotal !== 0) {
    console.error(`  ✗ ALERTA: quedaron ${operationalTotal} registros operativos sin borrar.`);
    process.exit(1);
  }
  console.log(`  ✓ Todos los modelos de operación quedaron en 0`);

  console.log("\n============================================================");
  console.log(" ✅ LIMPIEZA COMPLETADA");
  console.log("============================================================");
  console.log(` Login sigue funcionando con:`);
  console.log(`   ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("\nError en cleanData:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
