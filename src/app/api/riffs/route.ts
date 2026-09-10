import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/riffs - Create a new clubless (open) riff
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
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

    // Clubless riffs have no club name to fall back on for display (and no
    // per-club volume sequence like club riffs get), so a real name is
    // required here even though it's optional for club riffs.
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Riff name is required" },
        { status: 400 }
      );
    }

    // Create riff — no club, no admin check. Any authenticated user can
    // start a clubless riff; they become its creator/host.
    const riff = await prisma.riff.create({
      data: {
        clubId: null,
        creatorId: user.id,
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
