import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// PATCH /api/circles/[id]/prompts/[promptId] - Update prompt (OWNER/ADMIN only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; promptId: string } }
) {
  try {
    const user = await requireAuth();
    const { id: circleId, promptId } = params;
    const { title, description, deadline, visibilityRule } = await req.json();

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
        { error: "Only circle owners and admins can update prompts" },
        { status: 403 }
      );
    }

    // Validate prompt exists and belongs to circle
    const prompt = await prisma.circlePrompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt || prompt.circleId !== circleId) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    // Validate inputs
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt title cannot be empty" },
        { status: 400 }
      );
    }

    if (visibilityRule) {
      const validRules = ["ON_SUBMIT", "ALL_SUBMITTED", "AFTER_DEADLINE"];
      if (!validRules.includes(visibilityRule)) {
        return NextResponse.json(
          { error: "Invalid visibility rule" },
          { status: 400 }
        );
      }
    }

    // Update prompt
    const updatedPrompt = await prisma.circlePrompt.update({
      where: { id: promptId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(visibilityRule !== undefined && { visibilityRule }),
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

    return NextResponse.json({
      success: true,
      prompt: updatedPrompt,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating prompt:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the prompt" },
      { status: 500 }
    );
  }
}

// DELETE /api/circles/[id]/prompts/[promptId] - Delete prompt (OWNER/ADMIN only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; promptId: string } }
) {
  try {
    const user = await requireAuth();
    const { id: circleId, promptId } = params;

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
        { error: "Only circle owners and admins can delete prompts" },
        { status: 403 }
      );
    }

    // Validate prompt exists and belongs to circle
    const prompt = await prisma.circlePrompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt || prompt.circleId !== circleId) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    // Delete prompt (pieces will have promptId set to null due to onDelete: SetNull)
    await prisma.circlePrompt.delete({
      where: { id: promptId },
    });

    return NextResponse.json({
      success: true,
      message: "Prompt deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error deleting prompt:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the prompt" },
      { status: 500 }
    );
  }
}
