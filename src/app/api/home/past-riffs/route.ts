import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getCompletedRiffsPage } from "@/lib/home-data";

const MAX_LIMIT = 100;

// GET /api/home/past-riffs?cursor=&limit= — pagination backing the home
// page's Past Riffs "View all". Only paginates COMPLETED riffs — see the
// comment on getCompletedRiffsPage for why that's the whole bucket that
// needs it.
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10) || 50,
      MAX_LIMIT
    );

    const page = await getCompletedRiffsPage(user.id, { cursor, limit });
    return NextResponse.json(page);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching home past-riffs page:", error);
    return NextResponse.json(
      { error: "Failed to fetch past riffs" },
      { status: 500 }
    );
  }
}
