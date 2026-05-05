import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import UserForm from "@/components/forms/UserForm";
import { createUser } from "@/lib/actions/users";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function NuevoUsuarioPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/mi-agenda");
  }

  const t = await getServerT();
  return (
    <div>
      <PageHeader title={t("page.usuarios.new")} subtitle={t("form.user.subtitle")} />
      <UserForm
        mode="create"
        action={createUser}
        submitLabel={t("form.btn.create_user")}
      />
    </div>
  );
}
