import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { getFriends } from "@/lib/friends";
import { getBaseUrl } from "@/lib/env";
import { sendPieceSharedEmail, batchNotificationsEnabled } from "@/lib/resend";

// POST /api/pieces/[id]/send — email specific existing friends about a
// piece they already have Friends-tier access to. No access change, no
// in-app notification — just a heads-up, same as the Share modal's
// "Send to friends" action.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;
    const { friendIds } = await req.json();

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return NextResponse.json(
        { error: "Pick at least one friend" },
        { status: 400 }
      );
    }

    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      select: {
        title: true,
        authorId: true,
        author: { select: { firstName: true, name: true, username: true } },
      },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json(
        { error: "Only the author can do this" },
        { status: 403 }
      );
    }

    // Don't trust the client list — only actual friends.
    const friends = await getFriends(user.id);
    const requestedIds = new Set(friendIds);
    const verifiedIds = friends
      .filter((f) => requestedIds.has(f.id))
      .map((f) => f.id);

    if (verifiedIds.length === 0) {
      return NextResponse.json(
        { error: "None of those are your friends" },
        { status: 400 }
      );
    }

    const recipients = await prisma.user.findMany({
      where: { id: { in: verifiedIds } },
      select: { email: true },
    });
    const emails = recipients.map((r) => r.email);
    const optedInEmails = await batchNotificationsEnabled(emails);

    const actorName =
      piece.author.firstName ||
      piece.author.name ||
      piece.author.username ||
      "Someone";
    const pieceTitle = piece.title || "Untitled";
    const pieceUrl = `${getBaseUrl()}/read/${pieceId}`;

    await Promise.all(
      [...optedInEmails].map((email) =>
        sendPieceSharedEmail({ email, actorName, pieceTitle, pieceUrl })
      )
    );

    return NextResponse.json({ success: true, sentCount: optedInEmails.size });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error sending piece:", error);
    return NextResponse.json(
      { error: "An error occurred while sending" },
      { status: 500 }
    );
  }
}
