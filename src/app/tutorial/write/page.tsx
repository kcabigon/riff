import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import TutorialWritePage from "@/components/tutorial/TutorialWritePage";

interface TutorialWritePageProps {
  searchParams: Promise<{ clubId?: string }>;
}

export default async function TutorialWrite({
  searchParams,
}: TutorialWritePageProps) {
  await requireAuth();
  const { clubId } = await searchParams;

  if (!clubId) {
    redirect("/");
  }

  return <TutorialWritePage clubId={clubId} />;
}
