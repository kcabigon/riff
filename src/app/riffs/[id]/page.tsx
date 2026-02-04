import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import RiffPageLayout from "@/components/riffs/RiffPageLayout";

export default async function RiffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  // Fetch riff with full data
  const riff = await prisma.riff.findUnique({
    where: { id },
    include: {
      club: {
        select: { id: true, name: true },
      },
      creator: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      pieces: {
        include: {
          piece: {
            select: {
              id: true,
              title: true,
              authorId: true,
              wordCount: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!riff) {
    redirect("/");
  }

  // Verify user is a club member
  const member = await prisma.clubMember.findFirst({
    where: {
      clubId: riff.clubId,
      userId,
    },
  });

  if (!member) {
    redirect("/");
  }

  const isJoined = riff.participants.some((p) => p.user.id === userId);
  const hasSubmitted = riff.pieces.some(
    (p) => p.piece.authorId === userId
  );

  // Serialize dates to strings for client component boundary (Prisma returns Date objects)
  const serializedRiff = {
    ...riff,
    createdAt: riff.createdAt.toISOString(),
    deadline: riff.deadline ? riff.deadline.toISOString() : null,
  };

  return (
    <RiffPageLayout
      riff={serializedRiff}
      currentUserId={userId}
      isJoined={isJoined}
      hasSubmitted={hasSubmitted}
    />
  );
}
