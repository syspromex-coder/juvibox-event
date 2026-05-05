/**
 * Seed de producción: SOLO crea el usuario admin inicial si NO existe ninguno.
 * NO toca otras tablas. NO borra nada. Idempotente — puedes correrlo varias
 * veces y solo afecta al primer arranque.
 *
 * Uso:
 *   npm run db:seed:prod
 *
 * Una vez creado el admin, INICIA SESIÓN, ENTRA a /usuarios y CAMBIA el
 * password desde la UI. Las credenciales por defecto son inseguras.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim() || "admin@juvibox.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "123456";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Administrador";

async function main() {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    console.log(`ℹ Ya hay ${existingCount} usuario(s) en la BD. Seed-prod no hace nada.`);
    console.log("  (Si necesitas crear más usuarios, hazlo desde /usuarios en la UI.)");
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  console.log("✓ Usuario admin inicial creado:");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log("");
  console.log("⚠ IMPORTANTE: inicia sesión y cambia este password desde");
  console.log("   /usuarios → Editar → Cambiar contraseña.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
