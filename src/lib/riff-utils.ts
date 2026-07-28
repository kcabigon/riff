export function getRiffDisplayTitle(
  riff: {
    volumeNumber?: number | null;
    title?: string | null;
    status: string;
  },
  predictedVolumeNumber?: number
): string {
  if (riff.status === "ACTIVE" || riff.status === "DRAFT") {
    return (
      riff.title ||
      (predictedVolumeNumber ? `Volume ${predictedVolumeNumber}` : "")
    );
  }
  // REVEALED / COMPLETED
  if (!riff.volumeNumber) return riff.title || "Untitled Riff"; // fallback for old data without volumeNumber
  return riff.title
    ? `Volume ${riff.volumeNumber}: ${riff.title}`
    : `Volume ${riff.volumeNumber}`;
}

// Returns only the pieces that have been submitted (submittedAt is set).
export function getSubmittedPieces<
  T extends { submittedAt: string | Date | null },
>(pieces: T[]): T[] {
  return pieces.filter((p) => p.submittedAt !== null);
}

// Returns true if every participant has submitted a piece.
export function allPiecesSubmitted(
  pieces: { submittedAt: string | Date | null }[],
  participantCount: number
): boolean {
  return (
    participantCount > 0 &&
    getSubmittedPieces(pieces).length >= participantCount
  );
}

// Returns true if the riff deadline has passed.
export function isPastDeadline(deadline: string | Date | null): boolean {
  return deadline ? new Date(deadline).getTime() < Date.now() : false;
}

// Converts a YYYY-MM-DD date string to an ISO timestamp at end-of-day
// in the user's local timezone, so "May 15" expires at 11:59pm local time.
export function toEndOfDay(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

// Formats a date as "Jan 15" (short month + day, no year).
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Formats a date as "January 15" (full month + day, no year).
export function formatDateLong(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

// Returns participants who have submitted a piece.
export function getSubmittedParticipants<T extends { user: { id: string } }>(
  participants: T[],
  pieces: { submittedAt: string | Date | null; piece: { authorId: string } }[]
): T[] {
  return participants.filter((p) =>
    pieces.some(
      (piece) =>
        piece.submittedAt !== null && piece.piece.authorId === p.user.id
    )
  );
}

// Returns participants who have not yet submitted a piece.
export function getWaitingParticipants<T extends { user: { id: string } }>(
  participants: T[],
  pieces: { submittedAt: string | Date | null; piece: { authorId: string } }[]
): T[] {
  return participants.filter(
    (p) =>
      !pieces.some(
        (piece) =>
          piece.submittedAt !== null && piece.piece.authorId === p.user.id
      )
  );
}

// Returns true if the user still has unread submitted pieces in a riff.
export function hasUnreadPieces(
  riffId: string,
  readCounts: Record<string, number>,
  submittedCount: number
): boolean {
  return (readCounts[riffId] || 0) < submittedCount;
}

// Returns true if the user has read all submitted pieces in a riff.
export function isRiffFullyRead(
  riffId: string,
  readCounts: Record<string, number>,
  submittedCount: number
): boolean {
  return submittedCount > 0 && (readCounts[riffId] || 0) >= submittedCount;
}

// Sums word counts across a list of pieces.
export function getTotalWordCount(
  pieces: { piece?: { wordCount?: number | null } | null }[]
): number {
  return pieces.reduce((sum, p) => sum + (p.piece?.wordCount || 0), 0);
}

// Calendar days between today and a future date (0 = later today, 1 =
// tomorrow, etc). Uses UTC date components rather than raw elapsed
// milliseconds so a deadline later *today* correctly returns 0 instead of
// rounding up to "1 day" (which previously showed as "tomorrow").
export function daysUntil(date: Date): number {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const startOfToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const startOfTargetDay = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.round((startOfTargetDay - startOfToday) / DAY_MS);
}

// Whole days elapsed since a past date, rounded down.
export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

// Re-send lookback window for the deadline-approaching reminder, scaled to
// how much time is left — weekly when there's plenty of runway, more
// frequent as the deadline nears.
export function deadlineReminderLookbackDays(daysRemaining: number): number {
  if (daysRemaining > 7) return 7;
  if (daysRemaining >= 3) return 3;
  return 2;
}
