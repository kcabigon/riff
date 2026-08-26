import { NextResponse } from "next/server";
import { runEngagementReminders } from "@/lib/engagement-reminders";

export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runEngagementReminders();

  return NextResponse.json(result);
}
