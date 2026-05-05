/**
 * create-admin.ts
 * ============================================================
 * Crea (o actualiza si ya existe) UN usuario administrador.
 *
 * - email:    admin@juvibox.com
 * - password: 123456  (hasheada con bcrypt, 10 rounds)
 * - role:     ADMIN
 * - active:   true
 *
 * NO borra nada más, NO toca el schema, NO corre migraciones.
 *
 * Uso:
 *   npm run db:create-admin
 *
 * Implementación:
 *   - prisma.user.upsert: si el usuario ya existía, le actualiza
 *     name/password/role/active. Si no existía, lo crea. Esto evita
 *     el error "Unique constraint failed on email" si se corre 2 veces.
 *   - Después del upsert, lee el usuario de la DB y corre bcrypt.compare
 *     para confirmar que el hash valida con el password original.
 * ============================================================
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Credenciales pedidas
const ADMIN_EMAIL_RAW = "admin@juvibox.com";
const ADMIN_PASSWORD = "123456";
const ADMIN_NAME = "Administrador";

async function main() {
  // Normalizar email igual que lo hace authorize() en src/lib/auth.ts
  // (trim + lowercase). Si no coinciden exactamente, el login falla.
  const email = ADMIN_EMAIL_RAW.trim().toLowerCase();

  console.log("============================================================");
  console.log(" Juvibox Admin — crear usuario administrador");
  console.log("============================================================");
  console.log(`Email:    ${email}`);
  console.log(`Password: (oculto, longitud ${ADMIN_PASSWORD.length})`);
  console.log(`Rol:      ADMIN`);
  console.log("");

  // 1) Hashear la contraseña con bcrypt (mismo costo que el seed: 10)
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  console.log(`✓ Password hasheada con bcrypt (prefijo: ${passwordHash.slice(0, 7)}...)`);

  // 2) Upsert — crea si no existe, actualiza si ya existía.
  //    Importante: en update NO tocamos createdAt; updatedAt se setea solo.
  const before = await prisma.user.findUnique({ where: { email } });
  const existed = !!before;

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name: ADMIN_NAME,
      email,
      password: passwordHash,
      role: "ADMIN",
      active: true,
    },
    update: {
      // Si el usuario ya existía, le reseteamos password, rol y lo activamos.
      // No tocamos `name` si ya estaba seteado.
      password: passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  if (existed) {
    console.log(`✓ Usuario YA EXISTÍA → actualizado (id: ${user.id})`);
  } else {
    console.log(`✓ Usuario CREADO (id: ${user.id})`);
  }

  // 3) Confirmar leyendo de la DB y validando el hash
  const fromDb = await prisma.user.findUnique({ where: { email } });
  if (!fromDb) {
    throw new Error("ERROR: el usuario no se encontró en la DB después del upsert.");
  }

  const verified = await bcrypt.compare(ADMIN_PASSWORD, fromDb.password);
  if (!verified) {
    throw new Error("ERROR: bcrypt.compare devolvió false — el hash no valida.");
  }

  console.log("");
  console.log("Confirmación post-creación:");
  console.log(`  id:        ${fromDb.id}`);
  console.log(`  name:      ${fromDb.name}`);
  console.log(`  email:     ${fromDb.email}`);
  console.log(`  role:      ${fromDb.role}`);
  console.log(`  active:    ${fromDb.active}`);
  console.log(`  password:  hash bcrypt (no se muestra)`);
  console.log(`  createdAt: ${fromDb.createdAt.toISOString()}`);
  console.log(`  updatedAt: ${fromDb.updatedAt.toISOString()}`);
  console.log("");
  console.log(`✓ bcrypt.compare("${ADMIN_PASSWORD}", hash) = true`);
  console.log("");

  // Conteo total de usuarios — sólo para que veas que no se borró nadie más.
  const totalUsers = await prisma.user.count();
  console.log(`Usuarios totales en la DB: ${totalUsers}`);
  console.log("");
  console.log("------------------------------------------------------------");
  console.log(` Login con:  ${email}  /  ${ADMIN_PASSWORD}`);
  console.log("------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error en create-admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
