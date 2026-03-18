import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// PATCH /api/users/[id] - Update user profile
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Users can only update their own profile
    if ((user as any).id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { firstName, lastName, bio, avatarUrl } = body;

    const data: Record<string, any> = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (bio !== undefined) data.bio = bio;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    // Sync the name field from firstName + lastName
    if (firstName !== undefined || lastName !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { firstName: true, lastName: true },
      });
      const newFirst = firstName !== undefined ? firstName : currentUser?.firstName || "";
      const newLast = lastName !== undefined ? lastName : currentUser?.lastName || "";
      data.name = [newFirst, newLast].filter(Boolean).join(" ") || null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "An error occurred while updating profile" },
      { status: 500 }
    );
  }
}

// GET /api/users/[id] - Get user profile data and stats
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        username: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compute stats: pieceCount and totalWordCount
    const stats = await prisma.piece.aggregate({
      where: { authorId: id },
      _count: { id: true },
      _sum: { wordCount: true },
    });

    return NextResponse.json({
      user,
      stats: {
        pieceCount: stats._count.id,
        totalWordCount: stats._sum.wordCount ?? 0,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user profile" },
      { status: 500 }
    );
  }
}
