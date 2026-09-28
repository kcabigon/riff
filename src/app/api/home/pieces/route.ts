import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getPiecesPage } from "@/lib/home-data";

const MAX_LIMIT = 100;

// GET /api/home/pieces?kind=draft|submitted&cursor=&limit= — pagination
// backing the home page's Drafts/Pieces "View all". Same select and
// serialization as the initial home page load (src/lib/home-data.ts), so
// a fetched page is indistinguishable from what shipped on page 1.
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind");
    if (kind !== "draft" && kind !== "submitted") {
      return NextResponse.json(
        { error: "kind must be 'draft' or 'submitted'" },
        { status: 400 }
      );
    }
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10) || 50,
      MAX_LIMIT
    );

    const page = await getPiecesPage(user.id, kind, { cursor, limit });
    return NextResponse.json(page);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching home pieces page:", error);
    return NextResponse.json(
      { error: "Failed to fetch pieces" },
      { status: 500 }
    );
  }
}
