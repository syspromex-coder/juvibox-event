import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Protege rutas + aplica reglas por role.
 *
 * Reglas:
 *   1. Sin sesión → redirige a /login (manejado por withAuth automáticamente).
 *   2. Sesión EMPLEADO + ruta ≠ /mi-agenda → redirige a /mi-agenda.
 *   3. Sesión ADMIN → puede acceder a todo.
 *
 * UBICACIÓN: este archivo DEBE estar en `src/middleware.ts`. Si está en la raíz
 * del proyecto cuando se usa folder `src/`, Next.js lo ignora silenciosamente.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Si es EMPLEADO y NO va a /mi-agenda → redirigir
    if (token?.role === "EMPLEADO") {
      const allowedForEmpleado = path === "/mi-agenda" || path.startsWith("/mi-agenda/");
      if (!allowedForEmpleado) {
        const url = req.nextUrl.clone();
        url.pathname = "/mi-agenda";
        url.search = ""; // limpiar query strings
        return NextResponse.redirect(url);
      }
    }

    // ADMIN o role no definido → continuar
    return NextResponse.next();
  },
  {
    callbacks: {
      // Si hay token, está autenticado. Sin token, redirige a signIn.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match TODOS los paths excepto:
     *  - login (página pública)
     *  - api/auth/* (handlers de NextAuth)
     *  - _next/static, _next/image (assets de Next)
     *  - favicon, icons, manifest, sw.js, logo, apple-touch-icon, robots
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon|manifest\\.webmanifest|icons|sw\\.js|logo|apple-touch-icon|robots\\.txt).*)",
  ],
};
