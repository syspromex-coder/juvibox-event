"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const str = (v: FormDataEntryValue | null) => (v ? String(v) : "");
const VALID_ROLES = new Set(["ADMIN", "EMPLEADO"]);

/**
 * Verifica que la sesión actual sea ADMIN. Lanza si no.
 * Defensa en profundidad sobre el middleware.
 */
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("No autorizado: se requiere role ADMIN.");
  }
  return session;
}

/**
 * ¿Este usuario es el último ADMIN activo del sistema?
 * Si lo es, no se puede eliminar, desactivar ni demover a EMPLEADO.
 */
async function isLastActiveAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN" || !user.active) return false;
  const count = await prisma.user.count({
    where: { role: "ADMIN", active: true },
  });
  return count <= 1;
}

/* ---------- Crear usuario ---------- */

export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = str(formData.get("name")).trim();
  const email = str(formData.get("email")).trim().toLowerCase();
  const phone = str(formData.get("phone")).trim() || null;
  const password = str(formData.get("password"));
  const roleRaw = str(formData.get("role")) || "EMPLEADO";
  const role = VALID_ROLES.has(roleRaw) ? roleRaw : "EMPLEADO";
  const active = formData.get("active") !== null; // checkbox: presente=true, ausente=false

  if (!name || !email || !password) {
    throw new Error("Faltan campos requeridos: nombre, email y contraseña.");
  }
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`Ya existe un usuario con el email ${email}.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, phone, password: passwordHash, role, active },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

/* ---------- Actualizar usuario (nombre, email, phone, role, active) ---------- */

export async function updateUser(id: string, formData: FormData) {
  const session = await requireAdmin();

  const name = str(formData.get("name")).trim();
  const email = str(formData.get("email")).trim().toLowerCase();
  const phone = str(formData.get("phone")).trim() || null;
  const roleRaw = str(formData.get("role")) || "EMPLEADO";
  const role = VALID_ROLES.has(roleRaw) ? roleRaw : "EMPLEADO";
  const active = formData.get("active") !== null;

  if (!name || !email) {
    throw new Error("Nombre y email son requeridos.");
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error("Usuario no encontrado.");

  // Si cambia el email, validar que el nuevo no esté en uso por otro
  if (email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup && dup.id !== id) {
      throw new Error(`Ya existe un usuario con el email ${email}.`);
    }
  }

  // Salvaguardas para "último admin activo":
  const wasLast = await isLastActiveAdmin(id);
  if (wasLast) {
    if (role !== "ADMIN") {
      throw new Error("No puedes cambiar el rol del último administrador activo.");
    }
    if (!active) {
      throw new Error("No puedes desactivar al último administrador activo.");
    }
  }

  // No te puedes desactivar tú mismo
  if (session.user?.id === id && !active) {
    throw new Error("No puedes desactivar tu propio usuario.");
  }

  await prisma.user.update({
    where: { id },
    data: { name, email, phone, role, active },
  });

  revalidatePath("/usuarios");
  revalidatePath(`/usuarios/${id}/editar`);
  redirect("/usuarios");
}

/* ---------- Toggle activo/inactivo (acción rápida desde la lista) ---------- */

export async function setUserActive(id: string, active: boolean) {
  const session = await requireAdmin();

  if (session.user?.id === id && !active) {
    throw new Error("No puedes desactivar tu propio usuario.");
  }

  if (!active) {
    const wasLast = await isLastActiveAdmin(id);
    if (wasLast) {
      throw new Error("No puedes desactivar al último administrador activo.");
    }
  }

  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/usuarios");
}

/* ---------- Cambiar contraseña ---------- */

export async function changeUserPassword(id: string, formData: FormData) {
  await requireAdmin();

  const password = str(formData.get("password"));
  if (!password || password.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Usuario no encontrado.");

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id },
    data: { password: passwordHash },
  });

  revalidatePath(`/usuarios/${id}/editar`);
  redirect(`/usuarios/${id}/editar?changed=password`);
}

/* ---------- Eliminar (con check de "último admin" y self) ---------- */

export async function deleteUser(id: string) {
  const session = await requireAdmin();

  if (session.user?.id === id) {
    throw new Error("No puedes eliminar tu propio usuario.");
  }

  const wasLast = await isLastActiveAdmin(id);
  if (wasLast) {
    throw new Error(
      "No puedes eliminar al último administrador activo del sistema."
    );
  }

  // En el schema actual User no tiene FKs a otras tablas, así que no hay
  // datos críticos relacionados a verificar. Cuando se agregue (eventos
  // asignados, etc.), se haría un count() aquí y se rechazaría si > 0.

  await prisma.user.delete({ where: { id } });
  revalidatePath("/usuarios");
}
