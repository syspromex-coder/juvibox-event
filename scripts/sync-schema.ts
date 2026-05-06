/**
 * Sincroniza dev.db con schema.prisma usando ALTER TABLE directos.
 *
 * Para usar SOLO si `npx prisma db push` falla por alguna razón. La ruta
 * normal es `prisma db push` (ese es el comando recomendado y oficial).
 * Este script existe como red de seguridad.
 *
 * Qué hace:
 *   - Para cada columna nueva, intenta ALTER TABLE ADD COLUMN.
 *   - Si la columna ya existe (SQLite tira "duplicate column name"), lo
 *     ignora silenciosamente y sigue con la siguiente.
 *   - NO toca datos. NO borra nada. NO hace DROP de nada. Solo ADD COLUMN.
 *   - NO toca usuarios, eventos, pagos, ni cotizaciones existentes.
 *
 * Uso:
 *   npx tsx scripts/sync-schema.ts
 *
 * Después corre:
 *   npx prisma generate
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function safeAlter(sql: string, label: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  ✓ ${label}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // SQLite tira este error cuando la columna ya existe — es exactamente
    // lo que queremos para idempotencia.
    if (msg.includes("duplicate column name") || msg.includes("already exists")) {
      console.log(`  - ${label}  (ya existía, se omite)`);
      return;
    }
    throw e;
  }
}

async function main(): Promise<void> {
  console.log("\nSincronizando dev.db con schema.prisma");
  console.log("(idempotente — solo agrega columnas que falten)\n");

  console.log("Tabla Event:");
  await safeAlter(
    `ALTER TABLE "Event" ADD COLUMN "location" TEXT`,
    "location",
  );
  await safeAlter(
    `ALTER TABLE "Event" ADD COLUMN "depositCurrency" TEXT NOT NULL DEFAULT 'MXN'`,
    "depositCurrency",
  );
  await safeAlter(
    `ALTER TABLE "Event" ADD COLUMN "depositExchangeRate" REAL`,
    "depositExchangeRate",
  );
  // currency también podría faltar si la BD es muy vieja:
  await safeAlter(
    `ALTER TABLE "Event" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'MXN'`,
    "currency",
  );

  console.log("\nTabla Payment:");
  await safeAlter(
    `ALTER TABLE "Payment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'MXN'`,
    "currency",
  );
  await safeAlter(
    `ALTER TABLE "Payment" ADD COLUMN "exchangeRate" REAL`,
    "exchangeRate",
  );

  console.log("\n✓ dev.db sincronizado.");
  console.log("\nÚltimo paso → regenera el cliente Prisma:");
  console.log("  npx prisma generate\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("\n✗ Error inesperado:", e);
    prisma.$disconnect();
    process.exit(1);
  });
