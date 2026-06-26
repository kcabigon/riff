import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AccountPage from "@/components/account/AccountPage";

export const metadata = {
  title: "Account",
};

export default async function Account() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, clubs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true,
        email: true,
        lastActiveClubId: true,
      },
    }),
    prisma.clubMember.findMany({
      where: { userId },
      include: { club: { select: { id: true, name: true } } },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const clubList = clubs.map((m) => m.club);
  const currentClub =
    clubList.find((c) => c.id === user.lastActiveClubId) ?? clubList[0] ?? null;

  return <AccountPage user={user} clubs={clubList} currentClub={currentClub} />;
}
