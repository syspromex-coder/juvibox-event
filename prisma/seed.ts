/**
 * seed.ts
 * ============================================================
 * Seed MÍNIMO: solo asegura que exista el usuario admin.
 *
 * Este archivo lo ejecuta Prisma automáticamente cuando corres
 * `prisma migrate dev` o `prisma migrate reset` (gracias al bloque
 * "prisma" → "seed" en package.json).
 *
 * Por eso es importante que NO siembre datos de operación
 * (eventos, productos, cotizaciones, etc): si lo hiciera, esos
 * registros volverían a aparecer cada vez que corras una migración.
 *
 * Para datos demo opcionales (Laura, María, Carlos, productos de
 * muestra, etc.) usa:
 *   npm run db:seed:demo
 *
 * Implementación:
 *   - Usa upsert: si el admin ya existe, actualiza su password y
 *     lo deja activo. Si no existe, lo crea. Es idempotente.
 *   - NO borra nada, no toca otros usuarios.
 * ============================================================
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============ Credenciales del admin inicial ============
// CAMBIA ESTO EN PRODUCCIÓN o después del primer login.
const ADMIN_EMAIL = "admin@juvibox.com";
const ADMIN_PASSWORD = "123456";
const ADMIN_NAME = "Administrador";

async function main() {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: "ADMIN",
      active: true,
    },
    create: {
      name: ADMIN_NAME,
      email,
      password: passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  // Verificación: re-leer y validar bcrypt para confirmar que el hash funciona.
  const created = await prisma.user.findUnique({ where: { email } });
  if (!created) throw new Error("ERROR: el usuario admin no se encontró tras upsert.");
  const verified = await bcrypt.compare(ADMIN_PASSWORD, created.password);
  if (!verified) throw new Error("ERROR: el hash bcrypt no valida contra el password.");

  const totalUsers = await prisma.user.count();
  const totalEvents = await prisma.event.count();

  console.log(`✓ Admin listo: ${email}`);
  console.log(`  Usuarios totales en DB: ${totalUsers}`);
  console.log(`  Eventos en DB:           ${totalEvents}  (este seed NO crea eventos demo)`);
  console.log("");
  console.log(`  Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Para datos demo opcionales: npm run db:seed:demo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
