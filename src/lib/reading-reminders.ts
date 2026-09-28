import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { getBaseUrl } from "@/lib/env";
import { batchRemindersEnabled, sendReadingReminderEmail } from "@/lib/resend";

// Reading reminders: a nudge to read a revealed riff's pieces, for anyone who
// hasn't. Reading is half of what a club is for, and it's the half that
// doesn't need you to have written — so this goes to every member, writers
// and non-writers alike, not just the people who submitted.
//
// Two nudges per riff at most, like the writing reminders: a few days after
// the reveal, and once more before the riff goes stale. Each lists only what
// that person hasn't read yet (never their own piece), and nobody is nudged
// once they've read everything.
//
// `dryRun` defaults to true, like the other daily jobs: local development runs
// against the shared database, so a live run mails real people.

const DAY_MS = 24 * 60 * 60 * 1000;

// Days after the reveal each nudge goes out.
export const READING_NUDGE_DAYS = [5, 10] as const;
// Past this, a riff is old news — no nudge, even one a missed cron run owes.
// A few days past the last nudge, so a missed run can still catch up.
export const READING_WINDOW_DAYS = 14;

// Send log, in the same style as the writing reminders: notification rows
// written with isRead: true so they never reach the bell. PIECES_VISIBLE is a
// legacy value nothing else writes, and one that happens to describe the
// moment, so no migration was needed. Keyed by riff and recipient.
const READING_LOG = NotificationType.PIECES_VISIBLE;

// How many nudges `now` has passed for a riff revealed at `revealedAt`. Pure,
// so the schedule can be checked with synthetic dates. Paired with the send
// count, a missed cron day catches up on the next run instead of being lost.
export function readingNudgesReached(revealedAt: Date, now: Date): number {
  const days = (now.getTime() - revealedAt.getTime()) / DAY_MS;
  if (days < 0 || days > READING_WINDOW_DAYS) return 0;
  return READING_NUDGE_DAYS.filter((d) => days >= d).length;
}

export interface ReadingReminderResult {
  dryRun: boolean;
  riffsConsidered: number;
  sent: number;
  // Dry-run only: `riff | unread count | nudge n/reached`. No emails or names.
  plan?: string[];
}

export async function runReadingReminders({
  dryRun = true,
  now = new Date(),
}: { dryRun?: boolean; now?: Date } = {}): Promise<ReadingReminderResult> {
  const result: ReadingReminderResult = {
    dryRun,
    riffsConsidered: 0,
    sent: 0,
    ...(dryRun && { plan: [] }),
  };

  // updatedAt moves at reveal, so any riff revealed inside the window has been
  // touched inside it too — a cheap superset, narrowed by the real reveal time.
  const windowStart = new Date(now.getTime() - READING_WINDOW_DAYS * DAY_MS);
  const riffs = await prisma.riff.findMany({
    where: {
      status: { in: ["REVEALED", "COMPLETED"] },
      updatedAt: { gte: windowStart },
    },
    select: {
      id: true,
      title: true,
      volumeNumber: true,
      club: {
        select: {
          name: true,
          members: {
            select: { userId: true, user: { select: { email: true } } },
          },
        },
      },
      participants: {
        select: { userId: true, user: { select: { email: true } } },
      },
      pieces: {
        where: { submittedAt: { not: null } },
        orderBy: { submittedAt: "asc" },
        select: {
          piece: {
            select: {
              id: true,
              title: true,
              readLengthMin: true,
              authorId: true,
              author: { select: { name: true, firstName: true } },
            },
          },
        },
      },
    },
  });
  if (riffs.length === 0) return result;

  // There's no stored reveal time, but revealing writes a bell notification
  // to the club (or the riff's participants) in the same moment, so the
  // earliest of those is when it happened.
  const reveals = await prisma.notification.groupBy({
    by: ["riffId"],
    where: {
      type: NotificationType.RIFF_COMPLETED,
      riffId: { in: riffs.map((r) => r.id) },
    },
    _min: { createdAt: true },
  });
  const revealedAt = new Map(
    reveals
      .filter((r) => r.riffId && r._min.createdAt)
      .map((r) => [r.riffId as string, r._min.createdAt as Date])
  );

  const due = riffs
    .map((riff) => {
      const at = revealedAt.get(riff.id);
      return { riff, reached: at ? readingNudgesReached(at, now) : 0 };
    })
    .filter((d) => d.reached > 0 && d.riff.pieces.length > 0);
  result.riffsConsidered = due.length;
  if (due.length === 0) return result;

  const riffIds = due.map((d) => d.riff.id);
  const [reads, sends] = await Promise.all([
    prisma.pieceRead.findMany({
      where: { riffId: { in: riffIds } },
      select: { riffId: true, userId: true, pieceId: true },
    }),
    prisma.notification.groupBy({
      by: ["riffId", "recipientId"],
      where: { type: READING_LOG, riffId: { in: riffIds } },
      _count: { _all: true },
    }),
  ]);
  const readSet = new Set(
    reads.map((r) => `${r.riffId}:${r.userId}:${r.pieceId}`)
  );
  const sendCount = new Map(
    sends.map((s) => [`${s.riffId}:${s.recipientId}`, s._count._all])
  );

  // Work out who's owed a nudge everywhere first, then resolve the Reminders
  // opt-out for all of them in one query.
  const work = due.map(({ riff, reached }) => {
    const audience = riff.club
      ? riff.club.members.map((m) => ({
          userId: m.userId,
          email: m.user.email,
        }))
      : riff.participants.map((p) => ({
          userId: p.userId,
          email: p.user.email,
        }));
    const owed = audience
      .map((person) => ({
        ...person,
        unread: riff.pieces
          .map((p) => p.piece)
          .filter(
            (piece) =>
              piece.authorId !== person.userId &&
              !readSet.has(`${riff.id}:${person.userId}:${piece.id}`)
          ),
      }))
      .filter(
        (person) =>
          person.unread.length > 0 &&
          (sendCount.get(`${riff.id}:${person.userId}`) ?? 0) < reached
      );
    return { riff, reached, owed };
  });

  const enabled = await batchRemindersEnabled([
    ...new Set(work.flatMap((w) => w.owed.map((p) => p.email))),
  ]);
  const baseUrl = getBaseUrl();

  for (const { riff, reached, owed } of work) {
    const riffName = riff.volumeNumber
      ? riff.title
        ? `Volume ${riff.volumeNumber} · ${riff.title}`
        : `Volume ${riff.volumeNumber}`
      : riff.title || "Your riff";
    const logs: Array<{ riffId: string; recipientId: string }> = [];

    for (const person of owed.filter((p) => enabled.has(p.email))) {
      const nudge = (sendCount.get(`${riff.id}:${person.userId}`) ?? 0) + 1;
      if (dryRun) {
        result.plan?.push(
          `${riffName} | ${person.unread.length} unread | nudge ${nudge}/${reached}`
        );
        result.sent++;
        continue;
      }

      const delivered = await sendReadingReminderEmail({
        email: person.email,
        clubName: riff.club?.name ?? null,
        riffName,
        // A missed first run catches up as the second nudge's copy, the same
        // way the writing reminder's halfway note gives way to its last call.
        nudge: reached >= 2 ? "second" : "first",
        pieces: person.unread.map((piece) => ({
          title: piece.title,
          authorName: piece.author.name || piece.author.firstName || "Someone",
          readLengthMin: piece.readLengthMin,
        })),
        // Straight into the first thing they haven't read.
        readUrl: `${baseUrl}/read/${person.unread[0].id}?riff=${riff.id}`,
      });
      if (!delivered) continue;
      logs.push({ riffId: riff.id, recipientId: person.userId });
      result.sent++;
    }

    if (logs.length > 0) {
      await prisma.notification.createMany({
        data: logs.map((l) => ({ ...l, type: READING_LOG, isRead: true })),
      });
    }
  }

  return result;
}
