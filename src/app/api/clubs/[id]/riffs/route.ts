import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/clubs/[id]/riffs - List all riffs in a club
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // Filter by status (DRAFT, ACTIVE, COMPLETED)

    // Check if user is a club member
    const member = await prisma.clubMember.findFirst({
      where: {
        clubId,
        userId: (user as any).id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this club" },
        { status: 403 }
      );
    }

    const riffs = await prisma.riff.findMany({
      where: {
        clubId,
        ...(status && { status: status as any }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        pieces: {
          include: {
            piece: {
              select: {
                id: true,
                title: true,
                authorId: true,
                currentContent: true,
                wordCount: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
        _count: {
          select: {
            pieces: true,
            participants: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ riffs });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching riffs:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching riffs" },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[id]/riffs - Create a new riff in a club
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;
    const { title, prompt, deadline } = await req.json();

    // Validate input
    if (!deadline) {
      return NextResponse.json(
        { error: "Deadline is required" },
        { status: 400 }
      );
    }

    if (title && title.length > 200) {
      return NextResponse.json(
        { error: "Riff title must be 200 characters or less" },
        { status: 400 }
      );
    }

    // Check if user is the club admin
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { adminId: true },
    });

    if (!club || club.adminId !== (user as any).id) {
      return NextResponse.json(
        { error: "Only the club admin can create a riff" },
        { status: 403 }
      );
    }

    // Create riff
    const riff = await prisma.riff.create({
      data: {
        clubId,
        creatorId: (user as any).id,
        title: title?.trim() || null,
        prompt: prompt?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        status: "DRAFT", // Starts in DRAFT status
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        riff,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Riff creation error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the riff" },
      { status: 500 }
    );
  }
}
