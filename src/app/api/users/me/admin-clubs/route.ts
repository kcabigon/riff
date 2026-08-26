import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/users/me/admin-clubs - Return clubs user admins that have other members
export async function GET() {
  try {
    const user = await requireAuth();

    const clubs = await prisma.club.findMany({
      where: { adminId: user.id },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
    });

    const blockingClubs = clubs
      .filter((c) => c._count.members > 1)
      .map((c) => ({ id: c.id, name: c.name }));

    return NextResponse.json({ blockingClubs });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching admin clubs:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
