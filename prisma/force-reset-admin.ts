/**
 * force-reset-admin.ts
 * ============================================================
 * Borra el usuario admin@juvibox.com y lo vuelve a crear con
 * la contraseña correctamente hasheada con bcrypt.
 *
 * Causa raíz que resuelve:
 *   En auth.ts la comparación es bcrypt.compare(password, user.password).
 *   Si en la DB el campo `password` quedó como texto plano (ej. "123456"
 *   en vez de "$2a$10$..."), bcrypt.compare devuelve siempre false.
 *   La solución es regenerar al usuario con un hash bcrypt real.
 *
 * Uso:
 *   npm run db:reset-admin
 *
 * Lo que hace:
 *   1. Busca admin@juvibox.com y muestra el prefijo de su password
 *      actual (para que veas si era un hash o texto plano).
 *   2. Lo borra (solo a ese usuario, nada más).
 *   3. Hashea "123456" con bcrypt.hash (10 rounds).
 *   4. Crea el usuario nuevo con ese hash.
 *   5. Lee el usuario recién creado y corre bcrypt.compare para
 *      confirmar que el hash valida con "123456" → true.
 *
 * Lo que NO hace:
 *   - No toca a otros usuarios.
 *   - No toca otras tablas.
 *   - No corre migraciones, ni reset, ni db:push.
 *   - No cambia el schema.
 * ============================================================
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "admin@juvibox.com";
const PASSWORD = "123456";
const NAME = "Administrador";

async function main() {
  // Email normalizado IGUAL que en authorize() (trim + lowercase)
  const email = EMAIL.trim().toLowerCase();

  console.log("============================================================");
  console.log(" Juvibox Admin — RESET FORZADO del usuario admin");
  console.log("============================================================");
  console.log(`Email:    ${email}`);
  console.log(`Password: 123456 (será hasheado con bcrypt antes de guardar)`);
  console.log("");

  // ---------------------------------------------------------
  // 1) Inspeccionar estado actual
  // ---------------------------------------------------------
  console.log("[1] Estado actual en la DB");
  const before = await prisma.user.findUnique({ where: { email } });
  if (!before) {
    console.log("    No existía. Vamos a crearlo desde cero.");
  } else {
    const pwd = before.password ?? "";
    const looksLikeBcrypt = pwd.startsWith("$2");
    console.log(`    Encontrado: id=${before.id}`);
    console.log(`    password en DB: prefijo="${pwd.slice(0, 7)}..." longitud=${pwd.length}`);
    console.log(
      `    ¿parece bcrypt?  ${looksLikeBcrypt ? "sí (empieza con $2)" : "NO — está en texto plano u otro formato"}`,
    );
  }

  // ---------------------------------------------------------
  // 2) Borrar SOLO este usuario
  // ---------------------------------------------------------
  console.log("\n[2] Borrar usuario existente (si lo hay)");
  const deleted = await prisma.user.deleteMany({ where: { email } });
  console.log(`    Borrados: ${deleted.count}`);

  // ---------------------------------------------------------
  // 3) Hashear "123456" con bcrypt
  // ---------------------------------------------------------
  console.log("\n[3] Hashear password con bcrypt");
  const hash = await bcrypt.hash(PASSWORD, 10);
  console.log(`    bcrypt.hash("123456", 10) → "${hash.slice(0, 7)}..." (longitud ${hash.length})`);
  if (!hash.startsWith("$2")) {
    throw new Error("El hash generado no empieza con $2 — bcryptjs falló.");
  }

  // ---------------------------------------------------------
  // 4) Crear el usuario nuevo
  // ---------------------------------------------------------
  console.log("\n[4] Crear usuario nuevo");
  const created = await prisma.user.create({
    data: {
      name: NAME,
      email,
      password: hash,
      role: "ADMIN",
      active: true,
    },
  });
  console.log(`    Creado: id=${created.id}, email=${created.email}, role=${created.role}, active=${created.active}`);

  // ---------------------------------------------------------
  // 5) Verificar leyendo de la DB y corriendo bcrypt.compare
  // ---------------------------------------------------------
  console.log("\n[5] Verificación post-creación");
  const fromDb = await prisma.user.findUnique({ where: { email } });
  if (!fromDb) {
    throw new Error("ERROR: el usuario no se encontró en la DB después del create.");
  }
  console.log(`    Lookup OK. password en DB prefijo="${fromDb.password.slice(0, 7)}..."`);

  const valid = await bcrypt.compare(PASSWORD, fromDb.password);
  console.log(`    bcrypt.compare("123456", hashEnDB) = ${valid}`);

  if (!valid) {
    throw new Error("ERROR INESPERADO: bcrypt.compare devolvió false justo después de crear.");
  }

  // Conteo total para que veas que no se tocó a nadie más
  const total = await prisma.user.count();
  console.log(`    Usuarios totales en la DB: ${total}`);

  console.log("\n============================================================");
  console.log(" ✅ LISTO — El login DEBE funcionar ahora.");
  console.log("============================================================");
  console.log(` Email:    ${email}`);
  console.log(` Password: ${PASSWORD}`);
  console.log("");
  console.log(" Pasos finales:");
  console.log("   1. Detén el dev server con Ctrl+C");
  console.log("   2. Vuelve a iniciar:  npm run dev");
  console.log("   3. Abre /login y entra con esas credenciales.");
  console.log("");
  console.log(" Si TODAVÍA falla, mira los [auth-debug] en la terminal de");
  console.log(" `npm run dev` mientras intentas el login — esos logs te");
  console.log(" dicen el motivo exacto en cada paso.");
}

main()
  .catch((e) => {
    console.error("\nError en force-reset-admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
