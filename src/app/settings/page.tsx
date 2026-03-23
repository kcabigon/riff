import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import SettingsPage from "@/components/settings/SettingsPage";

export const metadata = {
  title: "Settings - Riff",
};

export default async function Settings() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      bio: true,
      avatarUrl: true,
      email: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <SettingsPage user={user} />;
}
