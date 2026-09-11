import { NextResponse } from "next/server";
import { runCommentNotifications } from "@/lib/comment-notifications";
import { runEngagementReminders } from "@/lib/engagement-reminders";

// Interim stopgap merge to stay within Vercel Hobby's 2-cron-job cap and free
// a slot for upcoming crons (auto-monthly riff creation, stale-riff cleanup).
// This is NOT the unified digest/registry engine described in
// NOTIFICATIONS-PRD.md — that's a separate, not-started rewrite. This route
// just runs the two existing jobs' unchanged logic under one invocation.
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [commentResult, engagementResult] = await Promise.allSettled([
    runCommentNotifications(),
    runEngagementReminders(),
  ]);

  const commentNotifications =
    commentResult.status === "fulfilled"
      ? commentResult.value
      : { error: String(commentResult.reason) };
  const engagementReminders =
    engagementResult.status === "fulfilled"
      ? engagementResult.value
      : { error: String(engagementResult.reason) };

  const failed = [commentResult, engagementResult].some(
    (r) => r.status === "rejected"
  );
  if (failed) {
    console.error("[cron/daily-notifications] partial failure", {
      commentNotifications,
      engagementReminders,
    });
  }

  return NextResponse.json(
    { commentNotifications, engagementReminders },
    { status: failed ? 500 : 200 }
  );
}
