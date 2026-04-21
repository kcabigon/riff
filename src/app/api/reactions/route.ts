import { NextResponse } from "next/server";

// POST /api/reactions — schema migration pending (Reaction model not yet added to DB)
// This route is a placeholder. Wire up Prisma calls once Kyle adds the Reaction model.
export async function POST() {
  return NextResponse.json(
    { error: "Not yet available — schema migration pending" },
    { status: 503 }
  );
}
