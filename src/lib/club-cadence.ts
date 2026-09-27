import { prisma } from "@/lib/prisma";
import {
  getCadenceDays,
  getMaxMissedDeadlines,
  isIntervalCadence,
  type CadenceValue,
} from "@/lib/cadence";

// The club cadence sweep. Runs once daily from /api/cron/daily-notifications
// (sharing that invocation keeps us under Vercel Hobby's two-job cap).
//
// This module decides; it does not yet act. Every branch is resolved and
// reported, and `dryRun` controls whether the writes happen — so the reasoning
// can be inspected against real data without creating riffs or sending mail.
// Worth keeping permanently: local dev shares the team's database, so a live
// sweep emails real people.

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

  return {
    dryRun,
    clubsConsidered: clubs.length,
    decisions,
    counts,
  };
}
