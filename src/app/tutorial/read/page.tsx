import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ReadPageLayout from "@/components/read/ReadPageLayout";
import {
  TUTORIAL_PIECE,
  TUTORIAL_EDITOR_CONTENT,
  getTutorialDates,
  getTutorialComments,
} from "@/lib/tutorial";

interface TutorialReadPageProps {
  searchParams: Promise<{ clubId?: string }>;
}

export default async function TutorialReadPage({
  searchParams,
}: TutorialReadPageProps) {
  const user = await requireAuth();
  const { clubId } = await searchParams;

  if (!clubId) {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarUrl: true },
  });

  const currentUser = {
    id: user.id,
    name: user.name ?? "You",
    username: user.username ?? null,
    avatarUrl: dbUser?.avatarUrl ?? null,
  };

  const { pieceSubmittedAt } = getTutorialDates();

  return (
    <ReadPageLayout
      piece={{
        id: TUTORIAL_PIECE.id,
        title: TUTORIAL_PIECE.title,
        subtitle: null,
        currentContent: TUTORIAL_EDITOR_CONTENT,
        coverImage: TUTORIAL_PIECE.coverImage,
        wordCount: TUTORIAL_PIECE.wordCount,
        readLengthMin: 1,
        submittedAt: pieceSubmittedAt,
        author: currentUser,
      }}
      riffId="tutorial-riff"
      clubId={clubId}
      currentUser={currentUser}
      initialComments={getTutorialComments()}
      isAlreadyRead={true}
      startInRiffMode={true}
      disableCommentCompose={true}
      disableReplies={true}
      backHref={`/tutorial/riff?step=read&clubId=${clubId}`}
    />
  );
}
