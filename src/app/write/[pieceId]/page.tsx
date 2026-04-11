import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import WritePage from "@/components/write/WritePage";

export default async function WritePageRoute({
  params,
}: {
  params: Promise<{ pieceId: string }>;
}) {
  const { pieceId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      currentContent: true,
      coverImage: true,
      authorId: true,
      riffs: {
        include: {
          riff: {
            select: {
              id: true,
              title: true,
              prompt: true,
              deadline: true,
              clubId: true,
              club: {
                select: {
                  name: true,
                  adminId: true,
                  admin: { select: { firstName: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!piece) {
    redirect("/");
  }

  if (piece.authorId !== userId) {
    redirect("/");
  }

  // Determine if user is admin of the club this piece is in (for post-submit modal)
  const firstRiff = piece.riffs[0]?.riff;
  const isAdmin = firstRiff ? firstRiff.club.adminId === userId : false;
  const hostFirstName = firstRiff?.club.admin?.firstName ?? null;

  const serializedPiece = {
    id: piece.id,
    title: piece.title,
    subtitle: piece.subtitle,
    currentContent: piece.currentContent,
    coverImage: piece.coverImage,
    riffs: piece.riffs.map((pr) => ({
      id: pr.riff.id,
      title: pr.riff.title,
      prompt: pr.riff.prompt,
      deadline: pr.riff.deadline ? pr.riff.deadline.toISOString() : null,
      clubId: pr.riff.clubId,
      clubName: pr.riff.club.name,
      submittedAt: pr.submittedAt ? pr.submittedAt.toISOString() : null,
    })),
  };

  return (
    <WritePage
      piece={serializedPiece}
      isAdmin={isAdmin}
      hostFirstName={hostFirstName}
    />
  );
}
