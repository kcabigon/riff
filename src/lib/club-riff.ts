import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Opening a club riff that is live immediately, in one transaction.
//
// Extracted because a new club's first riff used to be created from the browser
// as two sequential requests — POST a DRAFT, then PATCH it to ACTIVE — which
// could not be made atomic. It was retried twice and otherwise only logged, so
// a network blip or a closed tab left a club with no riff at all, which is
// exactly the empty page the flow exists to prevent.
//
// The two-request shape was not arbitrary: the PATCH to ACTIVE is what joins
// the creator as a participant, so composing the endpoints got that for free.
// Keeping the pair in one function keeps it, and lets the club POST run the
// whole thing inside its own transaction.
export async function createActiveClubRiff(
  {
    clubId,
    creatorId,
    deadline,
    title = null,
    prompt = null,
  }: {
    clubId: string;
    creatorId: string;
    deadline: Date;
    title?: string | null;
    prompt?: string | null;
  },
  // Pass the caller's transaction client to make the riff part of a larger
  // atomic unit; defaults to opening its own.
  tx: Prisma.TransactionClient = prisma
): Promise<{ id: string }> {
  const riff = await tx.riff.create({
    data: { clubId, creatorId, title, prompt, deadline, status: "ACTIVE" },
    select: { id: true },
  });

  // Mirrors the DRAFT -> ACTIVE transition in PATCH /api/riffs/[id], which
  // auto-joins whoever activates the riff. Deliberately preserved rather than
  // dropped here: whether a host should be auto-joined at all is a separate
  // question from where the riff gets created, and changing both at once would
  // make either hard to reason about.
  await tx.riffParticipant.create({
    data: { riffId: riff.id, userId: creatorId },
  });

  return riff;
}

// `days` after `from`. How every cadence riff is dated — by club creation and
// by the cadence sweep alike — and how the sweep sizes its grace week.
//
// A new club's first riff used to be dated in the browser as end-of-day in the
// host's own timezone, which no server can know. The time of day doesn't
// matter: the sweep, and the countdown with it, act on the first daily run
// after the deadline (see sweepRunFor).
export function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

// The volume number an active riff will get when it's revealed — the same
// count the club page uses to call an untitled riff "Volume N" before then, and
// the same one revealRiff assigns.
export async function predictVolumeNumber(clubId: string): Promise<number> {
  const revealed = await prisma.riff.count({
    where: { clubId, status: { in: ["REVEALED", "COMPLETED"] } },
  });
  return revealed + 1;
}
