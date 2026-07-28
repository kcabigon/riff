import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { getBaseUrl } from "@/lib/env";
import {
  batchNotificationsEnabled,
  sendDeadlineApproachingEmail,
  sendRememberToWriteEmail,
  sendJoinRiffNudgeEmail,
} from "@/lib/resend";
import {
  daysUntil,
  daysSince,
  deadlineReminderLookbackDays,
} from "@/lib/riff-utils";

// Shared fetch reused across all three checks below — one riff scan per cron
// run instead of three. Only ACTIVE riffs are ever eligible for a nudge.
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
          name: true,
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
          joinedAt: true,
          user: { select: { id: true, email: true } },
        },
      },
      pieces: {
        select: { submittedAt: true, piece: { select: { authorId: true } } },
      },
    },
  });
}

type ActiveRiff = Awaited<ReturnType<typeof fetchActiveRiffs>>[number];

// Notification rows are used purely as an internal send-log here: created with
// isRead: true so they can never surface in the bell/panel (both the list and
// unread-count endpoints hard-filter on isRead: false). This reuses existing,
// already-unused NotificationType values instead of adding new schema.
async function logSend(
  type: NotificationType,
  riffId: string,
  recipientId: string
) {
  await prisma.notification.create({
    data: { type, riffId, recipientId, isRead: true },
  });
}

interface SendHistoryEntry {
  count: number;
  lastSentAt: Date;
}

// Builds a `${riffId}:${recipientId}` -> { count, lastSentAt } map for a given
// notification type, in one query, so eligibility/variant-cycling checks
// don't hit the DB per-recipient inside the riff loop. Fetches full history
// (no time bound) since `count` needs every prior send, not just recent ones.
async function fetchSendHistory(
  type: NotificationType,
  riffIds: string[]
): Promise<Map<string, SendHistoryEntry>> {
  if (riffIds.length === 0) return new Map();
  const rows = await prisma.notification.findMany({
    where: { type, riffId: { in: riffIds } },
    select: { riffId: true, recipientId: true, createdAt: true },
  });
  const map = new Map<string, SendHistoryEntry>();
  for (const row of rows) {
    if (!row.riffId) continue;
    const key = `${row.riffId}:${row.recipientId}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { count: 1, lastSentAt: row.createdAt });
    } else {
      existing.count++;
      if (row.createdAt > existing.lastSentAt)
        existing.lastSentAt = row.createdAt;
    }
  }
  return map;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runDeadlineApproachingCheck(
  riffs: ActiveRiff[]
): Promise<number> {
  const now = new Date();
  const withDeadline = riffs.filter((r) => r.deadline && r.deadline > now);
  if (withDeadline.length === 0) return 0;

  // Widest possible lookback is 7 days, but fetch full history — the map is
  // shared eligibility-check machinery, even though this check doesn't need
  // the count (variant is chosen by urgency tier, not send number).
  const history = await fetchSendHistory(
    NotificationType.RIFF_DEADLINE_APPROACHING,
    withDeadline.map((r) => r.id)
  );

  const baseUrl = getBaseUrl();
  let sent = 0;

  for (const riff of withDeadline) {
    const deadline = riff.deadline as Date;
    const daysRemaining = daysUntil(deadline);
    const cutoff = new Date(
      now.getTime() - deadlineReminderLookbackDays(daysRemaining) * DAY_MS
    );

    const submittedAuthorIds = new Set(
      riff.pieces
        .filter((p) => p.submittedAt !== null)
        .map((p) => p.piece.authorId)
    );
    const waiting = riff.participants.filter(
      (p) => !submittedAuthorIds.has(p.userId)
    );
    if (waiting.length === 0) continue;

    const eligible = waiting.filter((p) => {
      const lastSent = history.get(`${riff.id}:${p.userId}`)?.lastSentAt;
      return !lastSent || lastSent < cutoff;
    });
    if (eligible.length === 0) continue;

    const enabled = await batchNotificationsEnabled(
      eligible.map((p) => p.user.email)
    );
    const riffTitle = riff.title || riff.club.name;

    for (const p of eligible.filter((p) => enabled.has(p.user.email))) {
      await sendDeadlineApproachingEmail({
        email: p.user.email,
        riffTitle,
        clubName: riff.club.name,
        riffUrl: `${baseUrl}/riffs/${riff.id}`,
        deadline,
        daysRemaining,
      });
      await logSend(
        NotificationType.RIFF_DEADLINE_APPROACHING,
        riff.id,
        p.userId
      );
      sent++;
    }
  }

  return sent;
}

export async function runRememberToWriteCheck(
  riffs: ActiveRiff[]
): Promise<number> {
  const now = new Date();
  const active = riffs.filter((r) => !r.deadline || r.deadline > now);
  if (active.length === 0) return 0;

  const history = await fetchSendHistory(
    NotificationType.RIFF_STARTED,
    active.map((r) => r.id)
  );

  const cutoff = new Date(now.getTime() - 7 * DAY_MS);
  const baseUrl = getBaseUrl();
  let sent = 0;

  for (const riff of active) {
    const authorsWithPiece = new Set(riff.pieces.map((p) => p.piece.authorId));
    const neverStarted = riff.participants.filter(
      (p) => !authorsWithPiece.has(p.userId) && daysSince(p.joinedAt) >= 3
    );
    if (neverStarted.length === 0) continue;

    const eligible = neverStarted.filter((p) => {
      const lastSent = history.get(`${riff.id}:${p.userId}`)?.lastSentAt;
      return !lastSent || lastSent < cutoff;
    });
    if (eligible.length === 0) continue;

    const enabled = await batchNotificationsEnabled(
      eligible.map((p) => p.user.email)
    );
    const riffTitle = riff.title || riff.club.name;

    for (const p of eligible.filter((p) => enabled.has(p.user.email))) {
      const variantIndex = history.get(`${riff.id}:${p.userId}`)?.count ?? 0;
      await sendRememberToWriteEmail({
        email: p.user.email,
        riffTitle,
        clubName: riff.club.name,
        riffUrl: `${baseUrl}/riffs/${riff.id}`,
        variantIndex,
      });
      await logSend(NotificationType.RIFF_STARTED, riff.id, p.userId);
      sent++;
    }
  }

  return sent;
}

export async function runJoinRiffNudgeCheck(
  riffs: ActiveRiff[]
): Promise<number> {
  const now = new Date();
  const active = riffs.filter(
    (r) => (!r.deadline || r.deadline > now) && daysSince(r.createdAt) >= 3
  );
  if (active.length === 0) return 0;

  const history = await fetchSendHistory(
    NotificationType.RIFF_INVITATION,
    active.map((r) => r.id)
  );

  const cutoff = new Date(now.getTime() - 7 * DAY_MS);
  const baseUrl = getBaseUrl();
  let sent = 0;

  for (const riff of active) {
    const participantIds = new Set(riff.participants.map((p) => p.userId));
    const nonMembers = riff.club.members.filter(
      (m) => !participantIds.has(m.userId)
    );
    if (nonMembers.length === 0) continue;

    const eligible = nonMembers.filter((m) => {
      const lastSent = history.get(`${riff.id}:${m.userId}`)?.lastSentAt;
      return !lastSent || lastSent < cutoff;
    });
    if (eligible.length === 0) continue;

    const enabled = await batchNotificationsEnabled(
      eligible.map((m) => m.user.email)
    );
    const riffTitle = riff.title || riff.club.name;

    for (const m of eligible.filter((m) => enabled.has(m.user.email))) {
      const variantIndex = history.get(`${riff.id}:${m.userId}`)?.count ?? 0;
      await sendJoinRiffNudgeEmail({
        email: m.user.email,
        riffTitle,
        clubName: riff.club.name,
        riffUrl: `${baseUrl}/riffs/${riff.id}`,
        variantIndex,
      });
      await logSend(NotificationType.RIFF_INVITATION, riff.id, m.userId);
      sent++;
    }
  }

  return sent;
}

export async function runEngagementReminders() {
  const riffs = await fetchActiveRiffs();
  const [deadlineApproaching, rememberToWrite, joinRiffNudge] =
    await Promise.all([
      runDeadlineApproachingCheck(riffs),
      runRememberToWriteCheck(riffs),
      runJoinRiffNudgeCheck(riffs),
    ]);
  return { deadlineApproaching, rememberToWrite, joinRiffNudge };
}
