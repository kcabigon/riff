export function submittedDaysAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Submitted just now";
  if (minutes < 60) return `Submitted ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Submitted ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Submitted yesterday";
  return `Submitted ${days} days ago`;
}

export function formatSubmittedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
