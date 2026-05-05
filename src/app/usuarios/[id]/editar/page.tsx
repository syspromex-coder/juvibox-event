import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import UserForm from "@/components/forms/UserForm";
import PasswordChangeForm from "@/components/forms/PasswordChangeForm";
import { updateUser, changeUserPassword } from "@/lib/actions/users";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { changed?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/mi-agenda");
  }

  const t = await getServerT();
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
    },
  });
  if (!user) notFound();

  const isSelf = session?.user?.id === user.id;
  const updateAction = updateUser.bind(null, user.id);
  const passwordAction = changeUserPassword.bind(null, user.id);
  const passwordChanged = searchParams.changed === "password";

  return (
    <div className="space-y-5">
      <PageHeader title={t("page.usuarios.edit")} subtitle={user.name} />

      {/* Sección 1: Perfil */}
      <section>
        <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("users.section.profile")}
        </h2>
        <UserForm
          mode="edit"
          user={user}
          action={updateAction}
          submitLabel={t("form.btn.save_changes")}
          isSelf={isSelf}
        />
      </section>

      {/* Sección 2: Cambiar contraseña */}
      <section>
        <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("users.section.security")}
        </h2>
        <PasswordChangeForm action={passwordAction} changedHint={passwordChanged} />
      </section>
    </div>
  );
}
