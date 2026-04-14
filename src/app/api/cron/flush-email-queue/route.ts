import { NextResponse } from "next/server";
import { flushCommentEmailQueue } from "@/lib/email-queue";

export async function GET(req: Request) {
  // Verify Vercel Cron secret (Vercel sends this automatically)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await flushCommentEmailQueue();

    return NextResponse.json({
      ok: true,
      emailsSent: result.emailsSent,
      queueItemsProcessed: result.queueItemsProcessed,
    });
  } catch (error) {
    console.error("Error flushing email queue:", error);
    return NextResponse.json(
      { error: "Failed to flush email queue" },
      { status: 500 }
    );
  }
}
