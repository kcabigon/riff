import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export default async function PostLoginPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      onboardingStep: true,
      lastActiveClubId: true,
      clubMemberships: {
        select: { clubId: true },
        orderBy: { joinedAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user?.onboardingCompleted) {
    const step = user?.onboardingStep || "NAME";
    const stepRoutes: Record<string, string> = {
      NAME: "/onboarding/name",
      CLUB_CHOICE: "/onboarding/club-choice",
      INVITE: "/onboarding/invite",
      COMPLETED: "/clubs",
    };
    redirect(stepRoutes[step] || "/onboarding/name");
  }

  // User has completed onboarding — find their club
  if (user.lastActiveClubId) {
    const isMember = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: user.lastActiveClubId,
      },
    });
    if (isMember) {
      redirect(`/clubs/${user.lastActiveClubId}`);
    }
  }

  // Fallback to first club
  if (user.clubMemberships.length > 0) {
    redirect(`/clubs/${user.clubMemberships[0].clubId}`);
  }

  // No clubs — waiting on an invite
  redirect("/no-club");
}
