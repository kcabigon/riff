import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import LandingClientPage from "@/components/LandingClientPage";
import { AvatarUser } from "@/types";

export default async function Page() {
  const session = await getSession();

  let user: AvatarUser | null = null;
  if (session?.user) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { avatarUrl: true },
      });
      const { firstName, lastName, name, username, id } = session.user;
      user = {
        id,
        name: [firstName, lastName].filter(Boolean).join(" ") || name || null,
        username: username ?? null,
        avatarUrl: dbUser?.avatarUrl ?? null,
      };
    } catch {
      // DB unavailable — show logged-out state rather than crashing the landing page
    }
  }

  return <LandingClientPage user={user} />;
}
