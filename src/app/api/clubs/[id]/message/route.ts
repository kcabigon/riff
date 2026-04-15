import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { sendHostMessageEmail } from "@/lib/resend";

// POST /api/clubs/[id]/message — Send a host message to club members
// TODO: Requires schema migration — HostMessage model + HOST_MESSAGE NotificationType enum value.
// Until then this endpoint sends emails only (no in-app notifications).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;
    const { subject, body, audienceType, recipientIds } = await req.json();

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    if (subject.length > 80) {
      return NextResponse.json(
        { error: "Subject must be 80 characters or less" },
        { status: 400 }
      );
    }

    if (body.length > 500) {
      return NextResponse.json(
        { error: "Message body must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Verify the sender is the club admin
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, adminId: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    if (club.adminId !== user.id) {
      return NextResponse.json(
        { error: "Only the club host can send messages" },
        { status: 403 }
      );
    }

    // Resolve recipients
    const memberFilter =
      audienceType === "specific" && Array.isArray(recipientIds)
        ? { clubId, userId: { in: recipientIds as string[], not: user.id } }
        : { clubId, userId: { not: user.id } };

    const members = await prisma.clubMember.findMany({
      where: memberFilter,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 }
      );
    }

    // Send emails (non-blocking fan-out)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const clubUrl = `${appUrl}/clubs/${clubId}`;
    const hostName = user.name || "Your host";

    Promise.allSettled(
      members.map((m) =>
        sendHostMessageEmail({
          email: m.user.email,
          hostName,
          clubName: club.name,
          subject: subject.trim(),
          body: body.trim(),
          clubUrl,
        })
      )
    ).catch(() => {});

    // TODO: Once Kyle adds HostMessage model + HOST_MESSAGE enum, persist the message
    // and create Notification rows via createNotification() for each recipient.

    return NextResponse.json({ success: true, recipientCount: members.length });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error sending host message:", error);
    return NextResponse.json(
      { error: "An error occurred while sending the message" },
      { status: 500 }
    );
  }
}
