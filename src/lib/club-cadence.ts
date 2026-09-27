import { prisma } from "@/lib/prisma";
import {
  getCadenceDays,
  getMaxMissedDeadlines,
  isIntervalCadence,
  type CadenceValue,
} from "@/lib/cadence";
import { revealRiff } from "@/lib/reveal-riff";

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

// One action per club per tick, in priority order. A club is only ever in one
// of these states, so the sweep never has to sequence two writes for the same
// club — which is why creation is deferred to the tick *after* a reveal rather
// than chained behind it.
export type CadenceAction =
  | { kind: "reveal"; riffId: string; submittedCount: number }
  | { kind: "extend"; riffId: string; newDeadline: Date; missed: number }
  | { kind: "pause"; riffId: string; missed: number }
  | { kind: "create"; deadline: Date }
  | { kind: "skip"; reason: string };

export interface ClubDecision {
  clubId: string;
  clubName: string;
  cadence: CadenceValue;
  action: CadenceAction;
}

// How many deadlines this riff has passed with nothing submitted. Every
// extension moves the deadline by exactly one cadence period, so elapsed
// periods since creation is the same number — no stored counter needed, and it
// doesn't matter whether the host or the cron moved the deadline.
function missedDeadlines(
  createdAt: Date,
  cadenceDays: number,
  now: Date
): number {
  const elapsedDays = (now.getTime() - createdAt.getTime()) / 86_400_000;
  return Math.floor(elapsedDays / cadenceDays);
}

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
    lastRevealedAt: Date | null;
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

    const missed = missedDeadlines(activeRiff.createdAt, cadenceDays, now);
    const limit = getMaxMissedDeadlines(club.cadence);

    if (limit !== null && missed >= limit) {
      return {
        ...base,
        action: { kind: "pause", riffId: activeRiff.id, missed },
      };
    }

    return {
      ...base,
      action: {
        kind: "extend",
        riffId: activeRiff.id,
        newDeadline: addDays(activeRiff.deadline, cadenceDays),
        missed,
      },
    };
  }

  // No active riff. Paused clubs stay empty until the host picks a cadence.
  if (club.cadence === "PAUSED" || !cadenceDays) {
    return { ...base, action: { kind: "skip", reason: "paused" } };
  }

  // Creation waits a full tick after a reveal, so a club gets 24 hours with
  // just the pieces before the next riff's empty cards appear. Without this the
  // reveal and the next opening would land in the same second.
  if (club.lastRevealedAt) {
    const hoursSinceReveal =
      (now.getTime() - club.lastRevealedAt.getTime()) / 3_600_000;
    if (hoursSinceReveal < 20) {
      return {
        ...base,
        action: { kind: "skip", reason: "revealed within the last tick" },
      };
    }
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
      riffs: {
        where: { status: { in: ["ACTIVE", "REVEALED", "COMPLETED"] } },
        select: {
          id: true,
          status: true,
          createdAt: true,
          deadline: true,
          updatedAt: true,
          pieces: {
            where: { submittedAt: { not: null } },
            select: { id: true },
          },
        },
      },
    },
  });

  return clubs.map((club) => {
    const active = club.riffs.find((r) => r.status === "ACTIVE") ?? null;
    // Reveal time isn't stored, so updatedAt on the newest revealed riff is the
    // closest proxy — it's written by the same update that sets the status.
    const revealed = club.riffs
      .filter((r) => r.status === "REVEALED" || r.status === "COMPLETED")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

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
            submittedCount: active.pieces.length,
          }
        : null,
      lastRevealedAt: revealed?.updatedAt ?? null,
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

// Carries out one decision. Notifications for reveal come free — revealRiff
// handles them, and a null actorId means nobody is excluded and nothing is
// attributed to a person who didn't act.
//
// Extend, pause, and create write correctly but do not notify yet. Their copy
// needs writing from scratch rather than borrowed: the existing riff-created and
// deadline-changed emails both name a host as the actor, which would tell a club
// that someone started or rescheduled a riff they had nothing to do with. That
// lands next, along with the paused email.
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
      return;

    case "create":
      // title and prompt stay null on purpose: "Volume N" is derived at render
      // from the count of revealed riffs, so nothing stale is stored, and a
      // prompt is the host's to add afterwards.
      await prisma.riff.create({
        data: {
          clubId: decision.clubId,
          creatorId: adminId,
          status: "ACTIVE",
          deadline: action.deadline,
        },
      });
      return;

    case "skip":
      return;
  }
}

// Decides for every club and reports. Actions are not applied yet — the reveal,
// extend, pause, and create writes land next, once the decisions look right
// against real data.
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
