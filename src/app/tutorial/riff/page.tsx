import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import TutorialRiffPage from "@/components/tutorial/TutorialRiffPage";

interface TutorialRiffPageProps {
  searchParams: Promise<{ step?: string; clubId?: string }>;
}

export default async function TutorialRiff({
  searchParams,
}: TutorialRiffPageProps) {
  const user = await requireAuth();
  const { step, clubId } = await searchParams;

  if (!clubId) {
    redirect("/no-club");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarUrl: true },
  });

  const validStep = ["", "submitted", "revealed", "read"].includes(step ?? "")
    ? ((step ?? "") as "" | "submitted" | "revealed" | "read")
    : ("" as const);

  return (
    <TutorialRiffPage
      step={validStep}
      clubId={clubId}
      userId={user.id}
      userName={user.name ?? null}
      userAvatar={dbUser?.avatarUrl ?? null}
    />
  );
}
