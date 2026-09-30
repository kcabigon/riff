import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { getBaseUrl } from "@/lib/env";
import {
  batchRemindersEnabled,
  buildRiffReminderEmail,
  deliverMany,
  type OutgoingEmail,
} from "@/lib/resend";
import { getRiffDisplayTitle } from "@/lib/riff-utils";

// Riff reminders. One stream, two sends per riff, whatever the cadence.
//
// This used to be three independent checks — deadline-approaching, remember-to-
// write, join-riff-nudge — each re-sending on its own weekly-ish clock. Their
// audiences overlapped and their windows were fixed, so total volume scaled with
// how long a riff stayed open: a bimonthly riff earned about twenty-six emails
// across its cycle, most of them saying the same thing. Auto-riffs made that the
// normal case rather than the exception.
//
// Now the schedule is proportional. Every riff gets a nudge at its halfway point
// and a final call the day before it closes, so a weekly riff and a quarterly
// riff both cost two emails. It's one template, told per person whether they've
// started (see buildRiffReminderEmail).

const DAY_MS = 24 * 60 * 60 * 1000;

// Shared fetch — one riff scan per cron run. Only ACTIVE riffs are eligible.
async function fetchActiveRiffs() {
  return prisma.riff.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      deadline: true,
      createdAt: true,
      club: {
        select: {
          id: true,
          name: true,
          // Revealed volumes, to name an untitled riff "Volume N" the way the
          // club page does.
          _count: {
            select: {
              riffs: { where: { status: { in: ["REVEALED", "COMPLETED"] } } },
            },
          },
          members: {
            select: {
              userId: true,
              user: { select: { id: true, email: true } },
            },
          },
        },
      },
      participants: {
        select: {
          userId: true,
          user: { select: { id: true, email: true } },
        },
      },
      // wordCount separates "has something going" from "attached an empty draft
      // and walked away" — the two want different copy. The id and title point
      // the button at the draft and name it.
      pieces: {
        select: {
          submittedAt: true,
          piece: {
            select: { id: true, authorId: true, title: true, wordCount: true },
          },
        },
      },
    },
  });
}

type ActiveRiff = Awaited<ReturnType<typeof fetchActiveRiffs>>[number];

// All riffs here are ACTIVE (pre-reveal) by construction, from
// fetchActiveRiffs — a club riff's home while it's being written is the
// club page, not the standalone one.
function riffPath(riff: ActiveRiff): string {
  return riff.club ? `/clubs/${riff.club.id}` : `/riffs/${riff.id}`;
}

// How many of this riff's two reminder milestones `now` has passed. Paired with
// the send count it drives everything: send only while count < reached, so each
// milestone fires exactly once and a missed cron day catches up on the next run
// instead of being lost.
//
// Deliberately pure, so the schedule can be checked against synthetic riffs
// rather than inferred from what did or didn't arrive in someone's inbox.
export function milestonesReached(
  createdAt: Date,
  deadline: Date | null,
  now: Date
): number {
  // Both milestones are positions within a deadline, so a riff without one has
  // none to reach. Only a clubless riff edited to drop its deadline gets here —
  // every creation path requires one, and a club riff can't have it cleared.
  if (!deadline) return 0;

  // Past the deadline the cadence sweep owns this riff — it is about to be
  // revealed, given its grace week, or cleared, and a reminder would contradict
  // whichever happens. The grace week re-opens the window but does not re-arm
  // these milestones; the grace email carries the warning instead.
  if (now >= deadline) return 0;

  const halfway = new Date(
    createdAt.getTime() + (deadline.getTime() - createdAt.getTime()) / 2
  );
  const finalCall = new Date(deadline.getTime() - DAY_MS);

  // On a riff shorter than two days these two can coincide or invert, which
  // reports 2 from the start. That costs nothing: only one reminder per person
  // is sent per run, and such a riff has no second run before its deadline — so
  // it resolves to a single nudge without needing a case of its own.
  if (now >= finalCall) return 2;
  if (now >= halfway) return 1;
  return 0;
}

// Notification rows are used purely as an internal send-log here: created with
// isRead: true so they can never surface in the bell/panel (both the list and
// unread-count endpoints hard-filter on isRead: false). This reuses an existing,
// otherwise-unused NotificationType value instead of adding new schema.
//
// One type for the whole stream, where there used to be three. That is what
// makes "at most two per riff" enforceable — three separate logs could each
// independently decide a person was due.
const REMINDER_LOG = NotificationType.RIFF_DEADLINE_APPROACHING;

async function logSends(
  entries: Array<{ riffId: string; recipientId: string }>
) {
  await prisma.notification.createMany({
    data: entries.map((e) => ({ ...e, type: REMINDER_LOG, isRead: true })),
  });
}

// `${riffId}:${recipientId}` -> how many reminders that person has had for that
// riff, in one query, so the per-recipient checks inside the riff loop don't
// each hit the database.
async function fetchSendCounts(
  riffIds: string[]
): Promise<Map<string, number>> {
  if (riffIds.length === 0) return new Map();
  const rows = await prisma.notification.groupBy({
    by: ["riffId", "recipientId"],
    where: { type: REMINDER_LOG, riffId: { in: riffIds } },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.riffId) continue;
    map.set(`${row.riffId}:${row.recipientId}`, row._count._all);
  }
  return map;
}

export interface ReminderRunResult {
  dryRun: boolean;
  sent: number;
  // Split by button, so a run can be read at a glance.
  continueWriting: number;
  startWriting: number;
  // Dry-run only: one line per intended email, `riff | button | milestone`.
  // Emails, deliberately, are not included — the shape of a run is what needs
  // checking, not who is behind on their writing.
  plan?: string[];
}

// dryRun decides everything and reports it without sending or logging. Same
// reasoning as the cadence sweep: local development runs against the team's
// database, so the only safe way to inspect this against real riffs is a mode
// that cannot mail anyone.
//
// It defaults to true, matching runClubCadence. The two used to disagree, which
// meant calling one of them with no arguments to "see what it would do" was safe
// and the other mailed an entire club. Scheduled runs pass false explicitly.
export async function runRiffReminders(
  riffs: ActiveRiff[],
  { now = new Date(), dryRun = true }: { now?: Date; dryRun?: boolean } = {}
): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    dryRun,
    sent: 0,
    continueWriting: 0,
    startWriting: 0,
    ...(dryRun && { plan: [] }),
  };

  const due = riffs
    .map((riff) => ({
      riff,
      reached: milestonesReached(riff.createdAt, riff.deadline, now),
    }))
    .filter((r) => r.reached > 0);
  if (due.length === 0) return result;

  const counts = await fetchSendCounts(due.map((r) => r.riff.id));
  const baseUrl = getBaseUrl();

  // Work out who is owed a reminder for every riff first, then resolve the
  // Reminders opt-out for all of them in one query. This used to run that query
  // inside the riff loop, which meant one round trip per riff for a preference
  // that could be fetched once.
  const work = due
    .map(({ riff, reached }) => {
      const submitted = new Set(
        riff.pieces
          .filter((p) => p.submittedAt !== null)
          .map((p) => p.piece.authorId)
      );

      // Club riffs reach the whole membership; a clubless riff has no
      // membership to draw on, so its participants are the whole audience.
      const audience = riff.club
        ? riff.club.members.map((m) => ({
            userId: m.userId,
            email: m.user.email,
          }))
        : riff.participants.map((p) => ({
            userId: p.userId,
            email: p.user.email,
          }));

      return {
        riff,
        reached,
        eligible: audience.filter(
          (a) =>
            !submitted.has(a.userId) &&
            (counts.get(`${riff.id}:${a.userId}`) ?? 0) < reached
        ),
      };
    })
    .filter((w) => w.eligible.length > 0);
  if (work.length === 0) return result;

  const enabled = await batchRemindersEnabled([
    ...new Set(work.flatMap((w) => w.eligible.map((a) => a.email))),
  ]);

  // Every reminder is built first and sent together, then logged — only the
  // ones that went out, since a logged failure would burn one of that
  // person's two reminders for the riff's whole lifetime.
  const outgoing: Array<{
    message: OutgoingEmail;
    log: { riffId: string; recipientId: string };
    bucket: "continueWriting" | "startWriting";
  }> = [];

  for (const { riff, reached, eligible } of work) {
    // milestonesReached returns 0 without a deadline, so every riff here has one.
    const deadline = riff.deadline as Date;
    const riffName = riff.club
      ? getRiffDisplayTitle(
          { title: riff.title, status: "ACTIVE" },
          riff.club._count.riffs + 1
        )
      : riff.title || "Your riff";
    const riffUrl = `${baseUrl}${riffPath(riff)}`;
    // A missed halfway run catches up as the final call rather than sending a
    // stale "halfway" a day before the deadline.
    const milestone = reached >= 2 ? "final" : "halfway";
    for (const person of eligible.filter((a) => enabled.has(a.email))) {
      const priorSends = counts.get(`${riff.id}:${person.userId}`) ?? 0;
      const own = riff.pieces.find(
        (p) => p.piece.authorId === person.userId && p.submittedAt === null
      )?.piece;
      const draft = own
        ? {
            url: `${baseUrl}/write/${own.id}`,
            title: own.title,
            wordCount: own.wordCount,
          }
        : null;
      const bucket = draft ? "continueWriting" : "startWriting";

      if (dryRun) {
        result.plan?.push(
          `${riffName} | ${bucket} | ${milestone} (${priorSends + 1}/${reached})`
        );
        result[bucket]++;
        result.sent++;
        continue;
      }

      outgoing.push({
        message: {
          to: person.email,
          email: buildRiffReminderEmail({
            clubName: riff.club?.name ?? null,
            riffName,
            riffUrl,
            deadline,
            milestone,
            draft,
          }),
        },
        log: { riffId: riff.id, recipientId: person.userId },
        bucket,
      });
    }
  }

  if (outgoing.length === 0) return result;
  const delivered = await deliverMany(
    outgoing.map((o) => o.message),
    "riffReminder"
  );
  const sentOut = outgoing.filter((_, i) => delivered[i]);
  for (const { bucket } of sentOut) {
    result[bucket]++;
    result.sent++;
  }
  // One insert for the whole run, straight after the send, so the gap in
  // which a crash could leave a send unlogged (and repeated tomorrow) is as
  // small as it can be.
  if (sentOut.length > 0) await logSends(sentOut.map((o) => o.log));

  return result;
}

export async function runEngagementReminders({
  dryRun = true,
}: { dryRun?: boolean } = {}) {
  const riffs = await fetchActiveRiffs();
  return runRiffReminders(riffs, { dryRun });
}
