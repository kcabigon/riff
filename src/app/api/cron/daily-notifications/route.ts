import { NextResponse } from "next/server";
import { runCommentNotifications } from "@/lib/comment-notifications";
import { runEngagementReminders } from "@/lib/engagement-reminders";
import { runClubCadence } from "@/lib/club-cadence";

// Interim stopgap merge to stay within Vercel Hobby's 2-cron-job cap and free
// a slot for upcoming crons (stale-riff cleanup). This is NOT the unified
// digest/registry engine described in NOTIFICATIONS-PRD.md — that's a separate,
// not-started rewrite. This route just runs each job's logic under one
// invocation.
export const maxDuration = 60;

type JobName = "comments" | "engagement" | "cadence";
const ALL_JOBS: JobName[] = ["comments", "engagement", "cadence"];

function settled<T>(r: PromiseSettledResult<T>) {
  return r.status === "fulfilled" ? r.value : { error: String(r.reason) };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);

  // ?only=cadence runs a single job. Local development shares the team's
  // database, so triggering this route by hand would otherwise send the comment
  // digest and engagement reminders to real people — this makes it possible to
  // exercise one job without mailing anyone.
  // An unrecognised value is rejected rather than falling back to every job — a
  // typo'd ?only= would otherwise run the comment digest live.
  const only = url.searchParams.get("only");
  if (only !== null && !ALL_JOBS.includes(only as JobName)) {
    return NextResponse.json(
      {
        error: `Unknown job "${only}". Expected one of: ${ALL_JOBS.join(", ")}`,
      },
      { status: 400 }
    );
  }
  const jobs: JobName[] = only ? [only as JobName] : ALL_JOBS;

  // The cadence sweep and the reminders both decide without acting while dryRun
  // is on, so either can be run against real data to inspect its reasoning
  // without writing or mailing. Scheduled runs act. The comment digest has no
  // such mode, which is the reason to pair dryRun with ?only=.
  const dryRun = url.searchParams.get("dryRun") === "1";

  const results = await Promise.allSettled(
    jobs.map((job) =>
      job === "comments"
        ? runCommentNotifications()
        : job === "engagement"
          ? runEngagementReminders({ dryRun })
          : runClubCadence({ dryRun })
    )
  );

  const body: Record<string, unknown> = {};
  jobs.forEach((job, i) => {
    body[job] = settled(results[i]);
  });

  const failed = results.some((r) => r.status === "rejected");
  if (failed) {
    console.error("[cron/daily-notifications] partial failure", body);
  }

  return NextResponse.json(body, { status: failed ? 500 : 200 });
}
