/**
 * test-connection.ts
 * ============================================================
 * Prueba ÚNICAMENTE la conexión a PostgreSQL usando la
 * DATABASE_URL del .env. Traduce el error de Prisma en una
 * recomendación concreta de qué arreglar.
 *
 * NO toca login, NO toca bcrypt, NO toca esquema, NO borra nada.
 *
 * Uso:
 *   npm run db:test-conn
 * ============================================================
 */
import { PrismaClient } from "@prisma/client";

function maskUrl(url: string | undefined): string {
  if (!url) return "(NO DEFINIDA)";
  return url.replace(/(\w+:\/\/[^:]+):[^@]+@/, "$1:****@");
}

function parseUrl(url: string) {
  // postgresql://USER:PASS@HOST:PORT/DBNAME?params
  const m = url.match(/^(postgres(?:ql)?):\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/([^?]+)/);
  if (!m) return null;
  return {
    scheme: m[1],
    user: m[2],
    pass: m[3],
    host: m[4],
    port: m[5] ?? "5432",
    db: m[6],
  };
}

async function main() {
  console.log("============================================================");
  console.log(" Juvibox Admin — TEST de conexión a PostgreSQL");
  console.log("============================================================");

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("\n✗ DATABASE_URL no está definida en .env");
    console.log("→ Define DATABASE_URL en tu archivo .env y vuelve a correr.");
    process.exit(1);
  }

  console.log(`\nDATABASE_URL: ${maskUrl(url)}`);
  const parts = parseUrl(url);
  if (parts) {
    console.log(`  scheme: ${parts.scheme}`);
    console.log(`  user:   ${parts.user}`);
    console.log(`  pass:   (oculta, longitud ${parts.pass.length})`);
    console.log(`  host:   ${parts.host}`);
    console.log(`  port:   ${parts.port}`);
    console.log(`  db:     ${parts.db}`);
  } else {
    console.log("⚠  No pude parsear la URL — revisa el formato.");
  }

  const prisma = new PrismaClient({ log: ["error"] });

  console.log("\nIntentando conectar…");
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log("\n✅ CONEXIÓN OK — Postgres respondió.");

    // Verificar que la tabla User exista (para el siguiente paso del login)
    try {
      const count = await prisma.user.count();
      console.log(`✅ Tabla User existe. Usuarios totales: ${count}`);
      console.log("\nTodo listo para que pruebes login.");
    } catch (e) {
      console.log("\n⚠  Conexión OK, pero la tabla User no existe todavía.");
      console.log("→ Corre:  npm run db:push    (aplica el schema)");
      console.log("→ Luego:  npm run db:create-admin");
    }
  } catch (e) {
    const msg = (e as Error).message || String(e);
    console.log("\n✗ FALLÓ LA CONEXIÓN.\n");
    console.log("Mensaje de Prisma:");
    console.log(msg.split("\n").slice(0, 6).map((l) => "  " + l).join("\n"));
    console.log("");

    // Diagnóstico por patrón de error
    const lower = msg.toLowerCase();

    if (lower.includes("authentication failed") || lower.includes("password authentication")) {
      console.log("Diagnóstico: AUTENTICACIÓN RECHAZADA");
      console.log("──────────────────────────────────────────────");
      console.log("El servidor Postgres SÍ responde, pero rechaza usuario/contraseña.");
      if (parts) {
        console.log(`Estás intentando: user=${parts.user}, password=(longitud ${parts.pass.length})`);
      }
      console.log("");
      console.log("Causas comunes:");
      console.log("  a) Tienes Postgres NATIVO (no Docker) en el puerto 5432 con");
      console.log("     otra contraseña. El Docker compose nunca pudo arrancar porque");
      console.log("     el puerto está ocupado.");
      console.log("  b) Cambiaste la contraseña del usuario postgres y olvidaste");
      console.log("     actualizar .env.");
      console.log("");
      console.log("Cómo resolverlo — elige UNA opción:");
      console.log("");
      console.log("  OPCIÓN 1: Usar el Postgres del docker-compose (recomendado)");
      console.log("    1. Detén tu Postgres nativo:");
      console.log("       macOS:    brew services stop postgresql");
      console.log("                 o:  pg_ctl -D /usr/local/var/postgres stop");
      console.log("       Linux:    sudo systemctl stop postgresql");
      console.log("       Windows:  services.msc → detén el servicio PostgreSQL");
      console.log("    2. Arranca el contenedor:");
      console.log("       docker compose up -d");
      console.log("    3. Vuelve a correr:");
      console.log("       npm run db:test-conn");
      console.log("");
      console.log("  OPCIÓN 2: Seguir usando tu Postgres nativo");
      console.log("    1. Abre psql o pgAdmin con TU contraseña actual de postgres.");
      console.log("    2. Crea la DB si no existe:");
      console.log("       CREATE DATABASE jubivox;");
      console.log("    3. Edita .env y pon TU usuario y contraseña reales:");
      console.log('       DATABASE_URL="postgresql://TU_USER:TU_PASS@localhost:5432/jubivox"');
      console.log('       DIRECT_URL="postgresql://TU_USER:TU_PASS@localhost:5432/jubivox"');
      console.log("    4. Si tu password tiene caracteres especiales (@ : / # ?),");
      console.log("       hay que url-encodearlos. Ejemplos:");
      console.log("       @ → %40    : → %3A    / → %2F    # → %23    ? → %3F");
      console.log("    5. Vuelve a correr:");
      console.log("       npm run db:test-conn");
    } else if (
      lower.includes("econnrefused") ||
      lower.includes("connection refused") ||
      lower.includes("can't reach database") ||
      lower.includes("can't reach")
    ) {
      console.log("Diagnóstico: NO HAY POSTGRES ESCUCHANDO");
      console.log("──────────────────────────────────────────────");
      if (parts) {
        console.log(`Nadie atiende en ${parts.host}:${parts.port}.`);
      }
      console.log("");
      console.log("Cómo resolverlo:");
      console.log("  - Arranca Postgres con docker compose:");
      console.log("       docker compose up -d");
      console.log("  - O arranca tu Postgres nativo:");
      console.log("       macOS:   brew services start postgresql");
      console.log("       Linux:   sudo systemctl start postgresql");
      console.log("       Windows: services.msc → inicia el servicio PostgreSQL");
      console.log("  - Verifica que el puerto coincida con DATABASE_URL.");
    } else if (
      lower.includes("does not exist") &&
      (lower.includes("database") || lower.includes("base de datos"))
    ) {
      console.log("Diagnóstico: LA BASE DE DATOS NO EXISTE");
      console.log("──────────────────────────────────────────────");
      if (parts) {
        console.log(`Postgres responde y la auth es correcta, pero la DB "${parts.db}" no existe.`);
        console.log("");
        console.log("Cómo resolverlo:");
        console.log(`  psql -U ${parts.user} -h ${parts.host} -p ${parts.port} -c 'CREATE DATABASE ${parts.db};'`);
        console.log("  Luego vuelve a correr: npm run db:test-conn");
      }
    } else if (lower.includes("etimedout") || lower.includes("timeout")) {
      console.log("Diagnóstico: TIMEOUT");
      console.log("──────────────────────────────────────────────");
      console.log("El host no responde a tiempo. Verifica:");
      console.log("  - Que el host de DATABASE_URL sea alcanzable.");
      console.log("  - Firewall / VPN / red.");
    } else {
      console.log("Diagnóstico: OTRO ERROR");
      console.log("──────────────────────────────────────────────");
      console.log("Pásame el mensaje completo de arriba y te ayudo a interpretarlo.");
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
