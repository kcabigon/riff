import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { getCadenceDays, isCadenceValue } from "@/lib/cadence";
import { addDays, createActiveClubRiff } from "@/lib/club-riff";

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
            userId: user.id,
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

    const { name, description, bannerImage, cadence } = await req.json();

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Club name is required" },
        { status: 400 }
      );
    }

    if (cadence !== undefined && !isCadenceValue(cadence)) {
      return NextResponse.json({ error: "Invalid cadence" }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Club name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Create club with creator as ADMIN, plus its first riff when the chosen
    // cadence implies one. Both in a single transaction: a new club must never
    // land its host on an empty page, and that guarantee only holds if the riff
    // can't fail separately from the club. This used to be a second request
    // fired from the browser after this one returned.
    const club = await prisma.$transaction(async (tx) => {
      const created = await tx.club.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          bannerImage: bannerImage || null,
          // Omitted falls back to the schema default (MANUAL), which is what
          // any caller that predates the cadence picker should get.
          ...(cadence !== undefined && { cadence }),
          adminId: user.id,
          members: {
            create: {
              userId: user.id,
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

      // Null for Manual and Paused, which produce no riffs — and the creation
      // picker only offers interval cadences today, so this is the normal path.
      const cadenceDays = getCadenceDays(created.cadence);
      if (cadenceDays) {
        await createActiveClubRiff(
          {
            clubId: created.id,
            creatorId: user.id,
            // Dated one period out, like every riff the cadence sweep opens.
            deadline: addDays(new Date(), cadenceDays),
          },
          tx
        );
      }

      return created;
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
