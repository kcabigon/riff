import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { isFriendOf } from "@/lib/friends";

// POST /api/pieces/[id]/join — accept a friend invite delivered via a piece.
// Mirrors /api/clubs/[id]/join: possession of the link is the invite, no
// separate token model. Grants full mutual Friends access to the author,
// not just this piece — see src/lib/friends.ts.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;

    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        riffs: {
          where: { submittedAt: { not: null } },
          select: { riff: { select: { status: true } } },
        },
      },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId === user.id) {
      return NextResponse.json(
        { error: "You can't join your own piece" },
        { status: 400 }
      );
    }

    const isRevealed =
      piece.publishedAt !== null ||
      piece.riffs.some(
        (r) => r.riff.status === "REVEALED" || r.riff.status === "COMPLETED"
      );

    if (!isRevealed) {
      return NextResponse.json(
        { error: "This piece isn't available to join yet" },
        { status: 403 }
      );
    }

    // Idempotent — already friends via this or any other source (club,
    // riff, or a prior individual share).
    if (await isFriendOf(user.id, piece.authorId)) {
      return NextResponse.json({ success: true, alreadyFriend: true });
    }

    const nextVersionNumber = (piece.versions[0]?.versionNumber ?? 0) + 1;
    const version = await prisma.pieceVersion.create({
      data: {
        pieceId,
        versionNumber: nextVersionNumber,
        title: piece.title,
        content: piece.currentContent,
        excerpt: piece.currentExcerpt,
      },
    });

    await prisma.share.create({
      data: {
        pieceId,
        versionId: version.id,
        shareType: "INDIVIDUAL",
        sharedWithId: user.id,
        isVisible: true,
      },
    });

    return NextResponse.json({ success: true, alreadyFriend: false });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error joining piece:", error);
    return NextResponse.json(
      { error: "An error occurred while joining this piece" },
      { status: 500 }
    );
  }
}
