/**
 * doctor.ts
 * ============================================================
 * Diagnóstico completo del login. Prueba la misma cadena que
 * authorize() en src/lib/auth.ts pero desde la terminal, así
 * vemos exactamente dónde se rompe sin tener que mirar el navegador.
 *
 * Uso:
 *   npm run db:doctor
 *
 * Lo que verifica, en orden:
 *   1. Que DATABASE_URL esté definida (la imprime enmascarada).
 *   2. Que Prisma se pueda conectar a la DB.
 *   3. Que la tabla User exista.
 *   4. Cuántos usuarios hay en total.
 *   5. Lista de emails registrados (sin password).
 *   6. Que exista admin@juvibox.com específicamente.
 *   7. Que tenga password hash y que esté active.
 *   8. Que bcrypt.compare("123456", hash) devuelva true.
 *
 * NO modifica nada. Sólo lee.
 * ============================================================
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_EMAIL = "admin@juvibox.com";
const TEST_PASSWORD = "123456";

function maskUrl(url: string | undefined): string {
  if (!url) return "(NO DEFINIDA)";
  // Enmascara user:password@ en la URL para no exponer credenciales
  return url.replace(/(\w+:\/\/[^:]+):[^@]+@/, "$1:****@");
}

function ok(msg: string) {
  console.log(`  ✓  ${msg}`);
}
function fail(msg: string) {
  console.log(`  ✗  ${msg}`);
}
function info(msg: string) {
  console.log(`     ${msg}`);
}
function step(n: number, title: string) {
  console.log(`\n[${n}] ${title}`);
}

async function main() {
  console.log("============================================================");
  console.log(" Juvibox Admin — DOCTOR (diagnóstico de login)");
  console.log("============================================================");

  // -----------------------------------------------------------
  // Paso 1: DATABASE_URL
  // -----------------------------------------------------------
  step(1, "Variables de entorno");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail("DATABASE_URL NO está definida.");
    info("→ Crea un archivo .env con DATABASE_URL apuntando a tu Postgres.");
    info("  Ejemplo local: postgresql://postgres:postgres@localhost:5432/jubivox");
    process.exit(1);
  }
  ok(`DATABASE_URL: ${maskUrl(dbUrl)}`);
  if (process.env.DIRECT_URL) {
    ok(`DIRECT_URL:   ${maskUrl(process.env.DIRECT_URL)}`);
  }
  if (!process.env.NEXTAUTH_SECRET) {
    fail("NEXTAUTH_SECRET no está definida (NextAuth la requiere).");
  } else {
    ok("NEXTAUTH_SECRET definida.");
  }
  if (!process.env.NEXTAUTH_URL) {
    fail("NEXTAUTH_URL no está definida.");
  } else {
    ok(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  }

  // -----------------------------------------------------------
  // Paso 2: Conexión a la DB
  // -----------------------------------------------------------
  step(2, "Conexión a la base de datos");
  try {
    await prisma.$queryRaw`SELECT 1`;
    ok("Postgres responde.");
  } catch (e) {
    fail("No se puede conectar a la DB.");
    info(`Error: ${(e as Error).message}`);
    info("→ Verifica que Postgres esté corriendo y que DATABASE_URL sea correcta.");
    info("  Si usas docker-compose: docker compose up -d");
    process.exit(1);
  }

  // -----------------------------------------------------------
  // Paso 3: Tabla User existe
  // -----------------------------------------------------------
  step(3, "Tabla User");
  let totalUsers = 0;
  try {
    totalUsers = await prisma.user.count();
    ok(`Tabla User existe. Usuarios totales: ${totalUsers}`);
  } catch (e) {
    fail("La tabla User NO existe (el schema no se ha aplicado).");
    info(`Error: ${(e as Error).message}`);
    info("→ Corre:  npm run db:push");
    process.exit(1);
  }

  // -----------------------------------------------------------
  // Paso 4: Lista de usuarios (sin password)
  // -----------------------------------------------------------
  step(4, "Usuarios en la DB");
  if (totalUsers === 0) {
    fail("No hay NINGÚN usuario en la DB.");
    info("→ Corre:  npm run db:create-admin");
    process.exit(1);
  }
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, active: true },
    orderBy: { createdAt: "asc" },
  });
  for (const u of users) {
    info(`- ${u.email}   role=${u.role}   active=${u.active}`);
  }

  // -----------------------------------------------------------
  // Paso 5: Buscar admin@juvibox.com
  // -----------------------------------------------------------
  step(5, `Buscar usuario "${TEST_EMAIL}"`);
  // Mismo lookup que hace authorize(): trim + lowercase + findUnique
  const lookupEmail = TEST_EMAIL.trim().toLowerCase();
  info(`lookup con email = "${lookupEmail}"`);
  const user = await prisma.user.findUnique({ where: { email: lookupEmail } });
  if (!user) {
    fail(`No existe ningún usuario con email "${lookupEmail}".`);
    info("→ Posibles causas:");
    info("  a) Nunca se ejecutó la creación. Corre:  npm run db:create-admin");
    info("  b) El usuario está con otro email (mira la lista arriba).");
    info(`  c) DATABASE_URL apunta a una DB diferente a la del dev server.`);
    process.exit(1);
  }
  ok(`Encontrado. id=${user.id}, name="${user.name}", role=${user.role}, active=${user.active}`);

  // -----------------------------------------------------------
  // Paso 6: Hash y estado
  // -----------------------------------------------------------
  step(6, "Estado del password hash");
  if (!user.password) {
    fail("El usuario NO tiene password en DB (campo vacío).");
    info("→ Corre:  npm run db:create-admin   (le va a setear el hash)");
    process.exit(1);
  }
  ok(`Hash existe. prefijo="${user.password.slice(0, 7)}..." longitud=${user.password.length}`);
  if (!user.password.startsWith("$2")) {
    fail("El hash NO parece ser bcrypt (debería empezar con $2a$, $2b$ o $2y$).");
    info("→ El password se guardó sin hashear. Corre:  npm run db:create-admin");
    process.exit(1);
  }
  if (!user.active) {
    fail("El usuario está DESACTIVADO (active=false). El login lo rechaza.");
    info("→ Corre:  npm run db:create-admin   (lo va a poner active=true)");
    process.exit(1);
  }
  ok("Usuario activo.");

  // -----------------------------------------------------------
  // Paso 7: bcrypt.compare con "123456"
  // -----------------------------------------------------------
  step(7, `bcrypt.compare("${TEST_PASSWORD}", hash)`);
  const valid = await bcrypt.compare(TEST_PASSWORD, user.password);
  if (!valid) {
    fail(`bcrypt.compare = false. La contraseña "${TEST_PASSWORD}" NO valida con el hash guardado.`);
    info("→ La contraseña en la DB no es 123456. Para resetearla corre:");
    info("    npm run db:create-admin");
    process.exit(1);
  }
  ok(`bcrypt.compare = true. La contraseña "${TEST_PASSWORD}" valida con el hash.`);

  // -----------------------------------------------------------
  // Resumen
  // -----------------------------------------------------------
  console.log("\n============================================================");
  console.log(" RESULTADO: TODO BIEN");
  console.log("============================================================");
  console.log(` El login con  ${TEST_EMAIL}  /  ${TEST_PASSWORD}  debería funcionar.`);
  console.log("");
  console.log(" Si en el navegador SIGUE diciendo 'correo o contraseña incorrectos':");
  console.log("  - Verifica que la app dev esté usando la MISMA DATABASE_URL que");
  console.log("    este script (a veces .env.local sobreescribe .env).");
  console.log("  - Reinicia el server:  Ctrl+C  y  npm run dev");
  console.log("  - Mira los logs [auth-debug] en la terminal de npm run dev");
  console.log("    al intentar el login — te dicen exactamente qué paso falla.");
  console.log("");
}

main()
  .catch((e) => {
    console.error("\nError inesperado en doctor:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
