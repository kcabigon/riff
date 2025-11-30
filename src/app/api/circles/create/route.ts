import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const { name, description } = await req.json();

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Circle name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Circle name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Create circle with creator as OWNER
    const circle = await prisma.circle.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: (user as any).id,
        members: {
          create: {
            userId: (user as any).id,
            role: "OWNER",
          },
        },
      },
      include: {
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
        circle,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Circle creation error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the circle" },
      { status: 500 }
    );
  }
}
