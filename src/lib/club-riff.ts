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

// Days-from-now deadline, matching how the cadence sweep dates every riff it
// opens (see addDays in lib/club-cadence). The browser used to compute this as
// end-of-day in the host's own timezone, which no server can know; the
// difference doesn't surface, because daysUntil buckets by UTC date and the
// sweep only ever compares the deadline against its own fixed daily tick.
export function deadlineFromCadence(cadenceDays: number, from = new Date()) {
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + cadenceDays);
  return deadline;
}
