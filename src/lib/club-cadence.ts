import { prisma } from "@/lib/prisma";
import {
  getCadenceDays,
  isIntervalCadence,
  type CadenceValue,
} from "@/lib/cadence";
import { revealRiff } from "@/lib/reveal-riff";
import { notifyUsers } from "@/lib/notifications";
import {
  batchNotificationsEnabled,
  sendClubPausedEmail,
  sendRiffCreatedEmail,
  sendRiffGracePeriodEmail,
} from "@/lib/resend";
import { getBaseUrl } from "@/lib/env";
import { NotificationType } from "@prisma/client";

// The club cadence sweep. Runs once daily from /api/cron/daily-notifications
// (sharing that invocation keeps us under Vercel Hobby's two-job cap).
//
// Deciding and acting are separate on purpose: decideForClub works out what
// should happen with no reads or writes, and applyDecision carries it out. That
// makes every branch drivable with synthetic input, and it makes the dry-run
// report exactly what a live run would do rather than an approximation of it.
//
// `dryRun` defaults to true. Worth keeping permanently — local development
// shares the team's database, so a live sweep creates real riffs and mails real
// people.

// One action per club per tick, in priority order. A club is only ever in one of
// these states, so the sweep never has to sequence two writes for the same club.
//
// That alone is what defers a new riff to the tick after a reveal: revealing is
// the club's whole action for that run, so the next tick is the first time it
// sees a club with no active riff. No extra cooldown is needed, and an earlier
// one here was a no-op for exactly this reason.
export type CadenceAction =
  | { kind: "reveal"; riffId: string; submittedCount: number }
  | { kind: "extend"; riffId: string; newDeadline: Date }
  | { kind: "pause"; riffId: string }
  | { kind: "create"; deadline: Date }
  | { kind: "skip"; reason: string };

export interface ClubDecision {
  clubId: string;
  clubName: string;
  cadence: CadenceValue;
  action: CadenceAction;
}

// The single grace period a quiet riff gets before its club is paused. Flat
// across every cadence on purpose — see decideForClub.
export const PAUSE_GRACE_DAYS = 7;

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

// Decides what should happen to one club. Pure — no reads, no writes — so the
// branch table is testable and the dry-run report is exactly what would run.
export function decideForClub(
  club: {
    id: string;
    name: string;
    cadence: CadenceValue;
    activeRiff: {
      id: string;
      createdAt: Date;
      deadline: Date | null;
      submittedCount: number;
    } | null;
  },
  now: Date
): ClubDecision {
  const base = { clubId: club.id, clubName: club.name, cadence: club.cadence };
  const cadenceDays = getCadenceDays(club.cadence);

  // Manual clubs are host-driven end to end; the cron never touches them.
  if (!isIntervalCadence(club.cadence) && club.cadence !== "PAUSED") {
    return { ...base, action: { kind: "skip", reason: "manual cadence" } };
  }

  const { activeRiff } = club;

  if (activeRiff) {
    if (!activeRiff.deadline) {
      return {
        ...base,
        action: { kind: "skip", reason: "active riff has no deadline" },
      };
    }
    if (activeRiff.deadline > now) {
      return {
        ...base,
        action: { kind: "skip", reason: "deadline not reached" },
      };
    }

    // Deadline passed with work in it — reveal, whatever the cadence. A paused
    // club still reveals: pausing stops new riffs, it doesn't strand pieces
    // people already submitted.
    if (activeRiff.submittedCount > 0) {
      return {
        ...base,
        action: {
          kind: "reveal",
          riffId: activeRiff.id,
          submittedCount: activeRiff.submittedCount,
        },
      };
    }

    // Deadline passed with nothing in it. Paused clubs stop here rather than
    // extending — an extended riff on a paused club is the zombie we're
    // avoiding.
    if (club.cadence === "PAUSED" || !cadenceDays) {
      return {
        ...base,
        action: { kind: "skip", reason: "paused, empty riff left as-is" },
      };
    }

    // A whole cadence period with nothing written. The club gets one fixed
    // grace week and a warning that says so, then pauses. One week regardless
    // of cadence: it's a last call, and a week reads as a last call whether the
    // club writes weekly or quarterly.
    //
    // Whether that week has already been granted is derived from the deadline
    // rather than stored. Every riff on an interval club is dated exactly one
    // cadence period out — by the cron and by club creation alike, and hosts
    // can't open riffs on an interval club — so a deadline beyond that has been
    // extended. The extra day absorbs the millisecond skew between createdAt
    // (written by the database) and the deadline (computed just before the
    // insert); a granted grace sits a full seven days past the line, so the
    // margin is comfortable in both directions.
    //
    // A host who edits the deadline can consume or reset the grace through this
    // inference. Harmless either way — nobody has written — and the alternative
    // is a stored flag, which means a migration for a rule this small.
    const graceGranted =
      activeRiff.deadline > addDays(activeRiff.createdAt, cadenceDays + 1);

    if (graceGranted) {
      return { ...base, action: { kind: "pause", riffId: activeRiff.id } };
    }

    return {
      ...base,
      action: {
        kind: "extend",
        riffId: activeRiff.id,
        // Seven days from now, not from the old deadline — if the cron misses a
        // stretch of days, "you have a week" should still mean a week.
        newDeadline: addDays(now, PAUSE_GRACE_DAYS),
      },
    };
  }

  // No active riff. Paused clubs stay empty until the host picks a cadence.
  if (club.cadence === "PAUSED" || !cadenceDays) {
    return { ...base, action: { kind: "skip", reason: "paused" } };
  }

  return {
    ...base,
    action: { kind: "create", deadline: addDays(now, cadenceDays) },
  };
}

// Loads every club the sweep could act on, with just the fields decideForClub
// needs. Clubs on MANUAL are excluded here rather than decided and skipped —
// they can never produce an action, so there's no reason to fetch them.
export async function loadSweepClubs() {
  const clubs = await prisma.club.findMany({
    where: {
      isArchived: false,
      cadence: { not: "MANUAL" },
    },
    select: {
      id: true,
      name: true,
      cadence: true,
      // The admin owns cron-created riffs' creatorId, which is non-nullable —
      // a database requirement only. It is never surfaced as "so-and-so started
      // this riff", because they didn't.
      adminId: true,
      // Only the active riff. This used to take REVEALED and COMPLETED ones too,
      // to find the most recent reveal for a cooldown that no longer exists —
      // which meant every tick loaded every volume a club had ever revealed,
      // along with each one's submitted-piece rows. That cost grew with the
      // club's whole history and nothing read it.
      riffs: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          createdAt: true,
          deadline: true,
          // Counted in the database rather than fetched and measured here: the
          // decision only needs whether anything was submitted, not which.
          _count: {
            select: { pieces: { where: { submittedAt: { not: null } } } },
          },
        },
      },
    },
  });

  return clubs.map((club) => {
    // At most one, by how riffs are opened — indexing is enough now that the
    // query returns nothing else.
    const active = club.riffs[0] ?? null;

    return {
      id: club.id,
      name: club.name,
      cadence: club.cadence as CadenceValue,
      adminId: club.adminId,
      activeRiff: active
        ? {
            id: active.id,
            createdAt: active.createdAt,
            deadline: active.deadline,
            submittedCount: active._count.pieces,
          }
        : null,
    };
  });
}

export interface CadenceSweepResult {
  dryRun: boolean;
  clubsConsidered: number;
  decisions: ClubDecision[];
  counts: Record<CadenceAction["kind"], number>;
  applied: number;
  errors: Array<{ clubId: string; kind: string; error: string }>;
}

// Notifications for reveal come free — revealRiff handles them, and a null
// actorId means nobody is excluded and nothing is attributed to a person who
// didn't act. The other three announce themselves below.
//
// All of them are wrapped so a mail failure can never undo a write that already
// happened — the riff exists, or the club is paused, whatever Resend did.
async function notifySafely(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[cadence] ${label} notification failed:`, err);
  }
}

// A cron-opened riff is announced without an actor. Its creatorId is the club
// admin because the column is non-nullable, and saying they started it would be
// a lie — so the copy is club-voiced instead (see getRiffCreatedEmailTemplate).
async function notifyRiffOpened(decision: ClubDecision, riffId: string) {
  await notifySafely("riff opened", async () => {
    // One member fetch, used for both the in-app rows and the emails.
    const members = await prisma.clubMember.findMany({
      where: { clubId: decision.clubId },
      select: { userId: true, user: { select: { email: true } } },
    });

    await notifyUsers(
      members.map((m) => m.userId),
      NotificationType.RIFF_CREATED,
      null,
      { clubId: decision.clubId, riffId }
    );

    const enabled = await batchNotificationsEnabled(
      members.map((m) => m.user.email)
    );
    const riffUrl = `${getBaseUrl()}/clubs/${decision.clubId}`;
    const sends = await Promise.allSettled(
      members
        .filter((m) => enabled.has(m.user.email))
        .map((m) =>
          sendRiffCreatedEmail({
            email: m.user.email,
            clubName: decision.clubName,
            riffUrl,
          })
        )
    );
    console.info(
      `[cadence] riff opened ${riffId}: ${sends.filter((r) => r.status === "fulfilled").length}/${members.length} emailed`
    );
  });
}

// The grace week goes to the whole club, not just the host — they're the ones
// who would have to write. The in-app line reuses RIFF_DEADLINE_CHANGED, which
// says only that the deadline moved; the warning itself lives in the email,
// since there's no enum value for it and adding one means a migration.
async function notifyGracePeriod(
  decision: ClubDecision,
  riffId: string,
  newDeadline: Date
) {
  await notifySafely("grace period", async () => {
    const members = await prisma.clubMember.findMany({
      where: { clubId: decision.clubId },
      select: { userId: true, user: { select: { email: true } } },
    });

    await notifyUsers(
      members.map((m) => m.userId),
      NotificationType.RIFF_DEADLINE_CHANGED,
      null,
      { clubId: decision.clubId, riffId }
    );

    const enabled = await batchNotificationsEnabled(
      members.map((m) => m.user.email)
    );
    const riffUrl = `${getBaseUrl()}/clubs/${decision.clubId}`;
    const sends = await Promise.allSettled(
      members
        .filter((m) => enabled.has(m.user.email))
        .map((m) =>
          sendRiffGracePeriodEmail({
            email: m.user.email,
            newDeadline,
            riffUrl,
            clubName: decision.clubName,
          })
        )
    );
    console.info(
      `[cadence] grace week ${riffId}: ${sends.filter((r) => r.status === "fulfilled").length}/${members.length} emailed`
    );
  });
}

// Only the host hears about a pause — it's their club and their decision to
// reverse. The copy names the deleted riff too; they didn't ask for that.
async function notifyClubPaused(decision: ClubDecision, adminId: string) {
  await notifySafely("club paused", async () => {
    const cadenceDays = getCadenceDays(decision.cadence) ?? 0;
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { email: true, emailNotifications: true },
    });
    if (!admin?.emailNotifications) return;

    // Volume is only assigned at reveal, so an empty riff has none — the label
    // has to describe it rather than number it.
    await sendClubPausedEmail({
      email: admin.email,
      clubName: decision.clubName,
      clubUrl: `${getBaseUrl()}/clubs/${decision.clubId}`,
      // One full cadence period of silence, plus the grace week.
      daysQuiet: cadenceDays + PAUSE_GRACE_DAYS,
      volumeLabel: "the riff nobody wrote in",
    });
  });
}

async function applyDecision(
  decision: ClubDecision,
  adminId: string
): Promise<void> {
  const { action } = decision;

  switch (action.kind) {
    case "reveal":
      await revealRiff(action.riffId, { actorId: null });
      return;

    case "extend":
      await prisma.riff.update({
        where: { id: action.riffId },
        data: { deadline: action.newDeadline },
      });
      await notifyGracePeriod(decision, action.riffId, action.newDeadline);
      return;

    case "pause":
      // One transaction: a club left paused with its empty riff still active,
      // or a deleted riff on a club still claiming a cadence, are both states
      // the sweep would then have to reason about. Nothing is lost — zero
      // submissions is what got us here, and PieceRiff cascades so attached
      // drafts survive as standalone drafts.
      await prisma.$transaction([
        prisma.riff.delete({ where: { id: action.riffId } }),
        prisma.club.update({
          where: { id: decision.clubId },
          data: { cadence: "PAUSED" },
        }),
      ]);
      await notifyClubPaused(decision, adminId);
      return;

    case "create": {
      // title and prompt stay null on purpose: "Volume N" is derived at render
      // from the count of revealed riffs, so nothing stale is stored, and a
      // prompt is the host's to add afterwards.
      const created = await prisma.riff.create({
        data: {
          clubId: decision.clubId,
          creatorId: adminId,
          status: "ACTIVE",
          deadline: action.deadline,
        },
        select: { id: true },
      });
      await notifyRiffOpened(decision, created.id);
      return;
    }

    case "skip":
      return;
  }
}

// Decides for every club, then applies unless this is a dry run. Clubs are
// handled one at a time rather than in parallel: the sweep is tiny, and a failure
// on one club must not take down the rest of the tick.
export async function runClubCadence({
  dryRun = true,
  now = new Date(),
}: { dryRun?: boolean; now?: Date } = {}): Promise<CadenceSweepResult> {
  const clubs = await loadSweepClubs();
  const decisions = clubs.map((club) => decideForClub(club, now));

  const counts = decisions.reduce(
    (acc, d) => {
      acc[d.action.kind] += 1;
      return acc;
    },
    { reveal: 0, extend: 0, pause: 0, create: 0, skip: 0 } as Record<
      CadenceAction["kind"],
      number
    >
  );

  const errors: CadenceSweepResult["errors"] = [];
  let applied = 0;

  if (!dryRun) {
    // Sequential, and each club isolated: one club's failure must not stop the
    // sweep for the rest, and there's no reason to hammer the database in
    // parallel for a job with all day to finish.
    for (let i = 0; i < clubs.length; i++) {
      const decision = decisions[i];
      if (decision.action.kind === "skip") continue;
      try {
        await applyDecision(decision, clubs[i].adminId);
        applied += 1;
      } catch (err) {
        errors.push({
          clubId: decision.clubId,
          kind: decision.action.kind,
          error: String(err),
        });
        console.error(
          `[cadence] ${decision.action.kind} failed for club ${decision.clubId}:`,
          err
        );
      }
    }
  }

  return {
    dryRun,
    clubsConsidered: clubs.length,
    decisions,
    counts,
    applied,
    errors,
  };
}
