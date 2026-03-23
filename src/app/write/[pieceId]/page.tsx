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

  const userId = (session.user as any).id;

  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: {
      id: true,
      title: true,
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
                select: { name: true },
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

  const serializedPiece = {
    id: piece.id,
    title: piece.title,
    currentContent: piece.currentContent,
    coverImage: piece.coverImage,
    riffs: piece.riffs.map((pr) => ({
      id: pr.riff.id,
      title: pr.riff.title,
      prompt: pr.riff.prompt,
      deadline: pr.riff.deadline ? pr.riff.deadline.toISOString() : null,
      clubId: pr.riff.clubId,
      clubName: pr.riff.club.name,
    })),
  };

  return <WritePage piece={serializedPiece} />;
}
