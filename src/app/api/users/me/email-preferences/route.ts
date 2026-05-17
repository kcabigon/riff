import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/users/me/email-preferences
export async function GET() {
  try {
    const user = await requireAuth();

    const prefs = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        emailNotifications: true,
        emailMarketing: true,
      },
    });

    if (!prefs) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(prefs);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching email preferences:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/users/me/email-preferences
export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const data: { emailNotifications?: boolean; emailMarketing?: boolean } = {};
    if (typeof body.emailNotifications === "boolean") {
      data.emailNotifications = body.emailNotifications;
    }
    if (typeof body.emailMarketing === "boolean") {
      data.emailMarketing = body.emailMarketing;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    await prisma.user.update({ where: { id: user.id }, data });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating email preferences:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
