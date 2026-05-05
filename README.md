# Jubivox Admin

App web **PWA** para administrar **Jubivox Party Rentals**: agenda de eventos, anticipos, pagos, gastos, productos con receta y cálculo automático de costos y utilidades.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite · PWA

---

## 🚀 Cómo correrlo en local

### Opción A — PostgreSQL con Docker (recomendado)

Necesitas Docker instalado.

```bash
# 1) Levantar PostgreSQL en un contenedor
docker compose up -d

# 2) Instalar dependencias (postinstall corre `prisma generate`)
npm install

# 3) Aplicar el schema a la BD y sembrar datos de muestra
npm run db:push
npm run db:seed

# 4) Arrancar dev server
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El seed crea:

```
ADMIN     →  admin@juvibox.com    /  123456
EMPLEADO  →  empleado@juvibox.com /  empleado123
```

Cambia las contraseñas desde `/usuarios → Editar` antes de usar en serio.

### Opción B — PostgreSQL existente

Si ya tienes PostgreSQL corriendo en tu máquina o un servidor remoto:

```bash
# Edita .env con tu URL de PG
echo 'DATABASE_URL="postgresql://USUARIO:PASSWORD@HOST:PUERTO/DB"' > .env
echo 'DIRECT_URL="postgresql://USUARIO:PASSWORD@HOST:PUERTO/DB"' >> .env
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env

npm install
npm run db:push
npm run db:seed
npm run dev
```

### Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server con HMR |
| `npm run build` | Build de producción (ejecuta `prisma generate` antes) |
| `npm run db:push` | Aplica el schema a la BD (crea/actualiza tablas) |
| `npm run db:seed` | Llena la BD con datos de muestra (**borra todo lo existente**) |
| `npm run db:seed:prod` | Crea solo el admin inicial si no hay usuarios (**idempotente**) |
| `npm run db:reset` | `db:push --force-reset` + seed de muestra (DESTRUYE datos) |
| `npm run db:studio` | Abre Prisma Studio en localhost:5555 |
| `docker compose up -d` | Arranca la BD local |
| `docker compose down` | Detiene la BD (mantiene datos) |

---

## ☁️ Deploy en Vercel

### Paso 1 — Provisionar PostgreSQL

Tres opciones recomendadas (todas tienen plan gratis):

| Provider | Notas | Pooling |
|---|---|---|
| **Vercel Postgres** | Integración nativa, 1 click | Sí (`POSTGRES_PRISMA_URL`) |
| **Supabase** | Gratis 500 MB | Sí (puerto 6543) |
| **Neon** | Gratis 0.5 GB, scale-to-zero | Sí (con `-pooler` en host) |

**Si usas Vercel Postgres**: en el dashboard del proyecto → "Storage" → "Create Database" → Postgres. Vercel inyecta automáticamente las variables `POSTGRES_PRISMA_URL` (pooled) y `POSTGRES_URL_NON_POOLING` (directa). Mapéalas a `DATABASE_URL` y `DIRECT_URL` en el siguiente paso.

### Paso 2 — Variables de entorno en Vercel

En tu proyecto de Vercel → "Settings" → "Environment Variables", define:

```env
# Apunta a la URL POOLED (puerto 6543 en Supabase, o POSTGRES_PRISMA_URL en Vercel Postgres)
DATABASE_URL = postgresql://...

# Apunta a la URL DIRECTA (puerto 5432 en Supabase, o POSTGRES_URL_NON_POOLING en Vercel Postgres)
DIRECT_URL = postgresql://...

# La URL pública de tu app
NEXTAUTH_URL = https://tu-app.vercel.app

# Genera con: openssl rand -base64 32
NEXTAUTH_SECRET = pega-aqui-cadena-aleatoria-de-32-bytes
```

Marca cada variable como visible en `Production`, `Preview` y `Development` según corresponda.

### Paso 3 — Crear las tablas (una sola vez)

Vercel solo corre `npm run build` — **no aplica migraciones automáticamente**. Tienes que aplicar el schema una vez. Dos opciones:

**Opción A — Desde tu máquina local apuntando a la BD de producción** (rápido):

```bash
# Pega temporalmente las URLs de prod en .env (sin committear)
DATABASE_URL="postgresql://...prod..." \
DIRECT_URL="postgresql://...prod-direct..." \
npx prisma db push

# Crear el admin inicial (idempotente, no toca otros datos)
DATABASE_URL="postgresql://...prod..." \
DIRECT_URL="postgresql://...prod-direct..." \
npx tsx prisma/seed-prod.ts
```

**Opción B — Migrations (más profesional, recomendado para equipos)**:

```bash
# Una vez en local, genera la migración inicial
npx prisma migrate dev --name init

# Committea la carpeta prisma/migrations/

# En Vercel, agrega esto al build command (Settings → General → Build Command):
prisma migrate deploy && prisma generate && next build
```

### Paso 4 — Crear el admin inicial

Si usaste Opción A del paso anterior, ya está creado. Si no:

```bash
# Con tu PROD DATABASE_URL en el shell:
DATABASE_URL="..." DIRECT_URL="..." npx tsx prisma/seed-prod.ts
```

Esto SOLO crea el admin si no hay usuarios. Es **idempotente y no destructivo**.

Credenciales por defecto (cámbialas inmediatamente desde la UI):
```
admin@juvibox.com / 123456
```

Puedes overridear con env vars antes de correr el seed:
```bash
SEED_ADMIN_EMAIL="tu@email.com" \
SEED_ADMIN_PASSWORD="ContraseñaSegura123!" \
SEED_ADMIN_NAME="Tu Nombre" \
DATABASE_URL="..." DIRECT_URL="..." \
npx tsx prisma/seed-prod.ts
```

### Paso 5 — Deploy

```bash
# Push a Git → Vercel deploya automáticamente
git push origin main
```

Vercel ejecuta `npm install` (que corre `postinstall: prisma generate`) y luego `npm run build` (que corre `prebuild: prisma generate` y `next build`). Listo.

### Cosas que NO debes hacer en producción

❌ **No corras `npm run db:seed`** — borra todos los datos
❌ **No corras `npm run db:reset`** — borra y reseed con muestra
❌ **No subas `.env` al repo** — está en `.gitignore`
❌ **No uses la contraseña por defecto en serio** — cámbiala desde `/usuarios`
❌ **No uses `directUrl` para queries normales** — Vercel se queda sin conexiones rápido sin pooling

### Troubleshooting de despliegue

**Error: `Can't reach database server`**: confirma que `DATABASE_URL` apunte a la URL POOLED (PgBouncer). La URL directa puede agotar las conexiones de tu provider en serverless.

**Error: `prepared statement "s1" does not exist`** (Supabase/PgBouncer): añade `?pgbouncer=true` al final de `DATABASE_URL`. Prisma lo necesita para deshabilitar prepared statements.

**Error: `PrismaClient is unable to be run in the browser`**: alguien intentó importar `@/lib/prisma` en un client component. Mueve la query a un server component o server action.

**Login funciona en local pero no en Vercel**: revisa que `NEXTAUTH_URL` y `NEXTAUTH_SECRET` estén definidos en Production. Sin estos, NextAuth no firma tokens correctamente.

## 🔒 Autenticación

La app está protegida por NextAuth con credenciales (email + contraseña). Toda ruta excepto `/login` y `/api/auth/*` requiere sesión activa.

### Credenciales por defecto del seed

```
Email:      admin@jubivox.com
Contraseña: jubivox2025
```

**Cámbialas antes de usar en producción**. Para cambiarlas:

1. Edita `prisma/seed.ts` (constantes `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
2. Corre `npm run db:reset` (borra BD y vuelve a sembrar con las nuevas credenciales).

O actualiza directamente el registro vía Prisma Studio:

```bash
npm run db:studio
# Abre el modelo User → edita el campo password (debe estar hasheado con bcrypt)
```

### Variables de entorno necesarias (`.env`)

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"   # cámbialo en producción
NEXTAUTH_SECRET="cadena-aleatoria-larga"
```

Genera un secret con:

```bash
openssl rand -base64 32
# o:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Si cambias `NEXTAUTH_SECRET`, todas las sesiones existentes se invalidan (los usuarios deberán volver a iniciar sesión).

### Cómo está implementado

- **Modelo `User`**: `id`, `name`, `email` (único), `password` (hash bcrypt), `createdAt`, `updatedAt`
- **bcryptjs** para hashing (`bcrypt.hash` con salt rounds = 10) — pure JS, sin dependencias nativas
- **NextAuth v4** con estrategia JWT (sin tabla Session ni Account adicionales)
- **Middleware** (`middleware.ts`): protege todas las rutas con `withAuth` excepto las explícitamente listadas en `matcher`
- **`AppShell`**: componente cliente que oculta el sidebar/bottom-nav en `/login` (login es fullscreen limpio)
- **Logout**: botón en el sidebar desktop y en `/mas` (menú "Más" móvil)

### Para desactivar la autenticación temporalmente

Si necesitas desactivar el bloqueo (por ejemplo, para hacer pruebas):

1. Renombra `middleware.ts` → `middleware.ts.disabled`
2. Reinicia el dev server

Para reactivarla, vuelve a renombrar.
