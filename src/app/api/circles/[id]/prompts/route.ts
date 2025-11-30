import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/circles/[id]/prompts - List circle prompts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const circleId = params.id;

    // Check if user is a member
    const membership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this circle" },
        { status: 403 }
      );
    }

    const prompts = await prisma.circlePrompt.findMany({
      where: { circleId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: {
            pieces: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ prompts });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching prompts" },
      { status: 500 }
    );
  }
}

// POST /api/circles/[id]/prompts - Create prompt (OWNER/ADMIN only)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const circleId = params.id;
    const { title, description, isFreeform, deadline, visibilityRule } =
      await req.json();

    // Validate input
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt title is required" },
        { status: 400 }
      );
    }

    // Check if user is OWNER or ADMIN
    const membership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Only circle owners and admins can create prompts" },
        { status: 403 }
      );
    }

    // Validate visibility rule
    const validRules = ["ON_SUBMIT", "ALL_SUBMITTED", "AFTER_DEADLINE"];
    if (visibilityRule && !validRules.includes(visibilityRule)) {
      return NextResponse.json(
        { error: "Invalid visibility rule" },
        { status: 400 }
      );
    }

    // Create prompt
    const prompt = await prisma.circlePrompt.create({
      data: {
        circleId,
        title: title.trim(),
        description: description?.trim() || null,
        isFreeform: isFreeform || false,
        deadline: deadline ? new Date(deadline) : null,
        visibilityRule: visibilityRule || "ON_SUBMIT",
        createdById: (user as any).id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        prompt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error creating prompt:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the prompt" },
      { status: 500 }
    );
  }
}
