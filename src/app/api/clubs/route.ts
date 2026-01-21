import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/clubs - List all clubs user is a member of
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const clubs = await prisma.club.findMany({
      where: {
        members: {
          some: {
            userId: (user as any).id,
          },
        },
        isArchived: includeArchived ? undefined : false,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        members: {
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
        _count: {
          select: {
            riffs: true,
            shares: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ clubs });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching clubs" },
      { status: 500 }
    );
  }
}

// POST /api/clubs - Create a new club
export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const { name, description } = await req.json();

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Club name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Club name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Create club with creator as ADMIN
    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        adminId: (user as any).id,
        members: {
          create: {
            userId: (user as any).id,
            role: "ADMIN",
          },
        },
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        members: {
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
      },
    });

    return NextResponse.json(
      {
        success: true,
        club,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Club creation error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the club" },
      { status: 500 }
    );
  }
}
