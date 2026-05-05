import "next-auth";
import "next-auth/jwt";

/** ADMIN ve y maneja todo. EMPLEADO sólo accede a /mi-agenda. */
export type Role = "ADMIN" | "EMPLEADO";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: Role;
    };
  }
  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
