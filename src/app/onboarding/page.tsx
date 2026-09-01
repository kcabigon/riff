import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  // Get current user's onboarding status
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      onboardingStep: true,
    },
  });

  if (user?.onboardingCompleted) {
    redirect("/my-riffs");
  }

  // Redirect to appropriate step. CLUB_CHOICE/INVITE are dead steps from the
  // old club-first onboarding flow — kept here only as a safe landing spot
  // for any pre-existing user parked mid-flow, since neither page exists
  // anymore.
  const step = user?.onboardingStep || "NAME";
  const stepRoutes = {
    NAME: "/onboarding/name",
    CLUB_CHOICE: "/my-riffs",
    INVITE: "/my-riffs",
    COMPLETED: "/my-riffs",
  };

  redirect(stepRoutes[step as keyof typeof stepRoutes]);
}
