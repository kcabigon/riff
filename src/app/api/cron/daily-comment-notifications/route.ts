import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCommentNotificationEmail } from "@/lib/resend";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const comments = await prisma.comment.findMany({
    where: { createdAt: { gte: since } },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      piece: {
        select: {
          id: true,
          title: true,
          authorId: true,
          author: {
            select: { email: true, firstName: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by piece, skipping self-comments
  const groups = new Map<
    string,
    {
      recipientEmail: string;
      recipientName: string;
      pieceId: string;
      pieceTitle: string;
      commenterNames: string[];
      commentCount: number;
    }
  >();

  for (const comment of comments) {
    if (comment.authorId === comment.piece.authorId) continue;

    const existing = groups.get(comment.pieceId);
    const commenterName =
      comment.author.firstName && comment.author.lastName
        ? `${comment.author.firstName} ${comment.author.lastName}`
        : comment.author.firstName || "Someone";

    if (existing) {
      if (!existing.commenterNames.includes(commenterName)) {
        existing.commenterNames.push(commenterName);
      }
      existing.commentCount++;
    } else {
      groups.set(comment.pieceId, {
        recipientEmail: comment.piece.author.email,
        recipientName:
          comment.piece.author.firstName ||
          comment.piece.author.email.split("@")[0],
        pieceId: comment.pieceId,
        pieceTitle: comment.piece.title || "Untitled",
        commenterNames: [commenterName],
        commentCount: 1,
      });
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://letsriff.app";
  let emailsSent = 0;

  for (const group of groups.values()) {
    await sendCommentNotificationEmail({
      email: group.recipientEmail,
      recipientName: group.recipientName,
      pieceTitle: group.pieceTitle,
      commentCount: group.commentCount,
      commenterNames: group.commenterNames,
      pieceUrl: `${baseUrl}/read/${group.pieceId}`,
    });
    emailsSent++;
  }

  return NextResponse.json({ emailsSent, piecesWithComments: groups.size });
}
