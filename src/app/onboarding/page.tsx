import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  // Get current user's onboarding status
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      onboardingCompleted: true,
      onboardingStep: true,
    },
  });

  if (user?.onboardingCompleted) {
    redirect("/clubs");
  }

  // Redirect to appropriate step
  const step = user?.onboardingStep || "NAME";
  const stepRoutes = {
    NAME: "/onboarding/name",
    CLUB_CHOICE: "/onboarding/club-choice",
    INVITE: "/onboarding/invite",
    COMPLETED: "/clubs",
  };

  redirect(stepRoutes[step as keyof typeof stepRoutes]);
}
