export function getRiffDisplayTitle(riff: {
  volumeNumber?: number | null;
  title?: string | null;
  status: string;
}): string {
  if (riff.status === "ACTIVE" || riff.status === "DRAFT") {
    return riff.title || "Active Riff";
  }
  // REVEALED / COMPLETED
  if (!riff.volumeNumber) return riff.title || "Untitled Riff"; // fallback for old data without volumeNumber
  return riff.title
    ? `Volume ${riff.volumeNumber}: ${riff.title}`
    : `Volume ${riff.volumeNumber}`;
}
