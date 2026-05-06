import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@/types/next-auth";

/**
 * Configuración de NextAuth para Juvibox Admin.
 * - Estrategia JWT (sin tabla Session, no requiere modelos extra de NextAuth).
 * - Credenciales: email + password verificados contra la tabla User con bcrypt.
 * - El `role` (ADMIN | EMPLEADO) se propaga: User → JWT → Session.
 */

// =====================================================================
// Logs temporales de diagnóstico para depurar login.
// Nunca imprimen la contraseña ni el hash completo.
// Para desactivarlos en producción, pon AUTH_DEBUG = false.
// =====================================================================
const AUTH_DEBUG = true;
function dlog(...args: unknown[]) {
  if (AUTH_DEBUG) console.log("[auth-debug]", ...args);
}

/**
 * Normaliza el `role` que viene de la BD (donde es String simple) al tipo
 * estricto `Role` que esperan los tipos aumentados de NextAuth.
 *
 * El schema de Prisma guarda `role` como String, así que técnicamente puede
 * contener cualquier cosa (datos editados a mano, futuros roles, etc.). Esta
 * función filtra: solo "ADMIN" pasa como ADMIN; cualquier otro valor cae a
 * "EMPLEADO" (el más restrictivo, default seguro).
 */
function toRole(value: string | null | undefined): Role {
  return value === "ADMIN" ? "ADMIN" : "EMPLEADO";
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.trim().toLowerCase();
          const password = credentials?.password;

          // 1) Email/usuario recibido (sin password)
          dlog("email recibido:", email ?? "(vacío)");
          dlog("password recibido (longitud):", password ? password.length : 0);

          if (!email || !password) {
            dlog("→ rechazo: faltan credenciales");
            return null;
          }

          // 2) ¿Encontró usuario en la base de datos?
          const user = await prisma.user.findUnique({ where: { email } });
          dlog("usuario encontrado en DB:", !!user);

          if (!user) {
            dlog("→ rechazo: no existe usuario con ese email");
            return null;
          }

          // 3) ¿Existe el hash de password?
          dlog("password hash existe:", !!user.password);
          if (user.password) {
            // Solo prefijo del hash, NUNCA completo. Los primeros 7 chars
            // son metadata bcrypt (ej. "$2a$10$") — no revelan nada secreto.
            dlog("hash prefijo:", user.password.slice(0, 7) + "...");
          }
          if (!user.password) {
            dlog("→ rechazo: usuario sin password en DB");
            return null;
          }

          // Bloquear login a usuarios desactivados
          dlog("usuario activo:", user.active);
          if (!user.active) {
            dlog(`→ rechazo: usuario ${email} está desactivado`);
            return null;
          }

          // 4) Resultado true/false de bcrypt.compare
          const ok = await bcrypt.compare(password, user.password);
          dlog("bcrypt.compare resultado:", ok);

          if (!ok) {
            dlog("→ rechazo: password no coincide con hash");
            return null;
          }

          dlog("→ login OK para:", email, "rol:", user.role);

          // El role viaja con el user → de aquí pasa al JWT y luego a la session.
          // Normalizamos a Role estricto porque la BD guarda String simple.
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: toRole(user.role),
          };
        } catch (err) {
          console.error("[auth] error en authorize():", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // En el primer sign-in, copiamos id+role del user al token.
      // El user aquí es el que devolvió authorize() arriba, así que su `role`
      // ya viene como Role normalizado.
      if (user) {
        const u = user as { id: string; role?: Role };
        token.id = u.id;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        const u = session.user as { id?: string; role?: Role };
        u.id = token.id as string;
        // token.role ya es Role (definido en next-auth/jwt augmentation),
        // pero TS lo trata como unknown en este contexto, así que normalizamos.
        u.role = toRole(token.role as string | undefined);
      }
      return session;
    },
  },
};
