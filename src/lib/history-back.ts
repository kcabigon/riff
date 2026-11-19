// Reads the browser's real history entry behind the current page, so a Back
// control can use history (instant, restores scroll) only when it knows where
// that lands. Uses the Navigation API; returns null when it's unavailable, when
// there's no earlier entry (a link opened fresh), or when the earlier entry is
// another site — callers then navigate to their usual destination instead.

// Minimal shape; TypeScript's DOM lib doesn't ship Navigation API types yet.
interface NavigationEntryLike {
  url: string | null;
}
interface NavigationLike {
  currentEntry: { index: number } | null;
  entries(): NavigationEntryLike[];
}

export function previousHistoryPathname(): string | null {
  if (typeof window === "undefined") return null;
  const nav = (window as Window & { navigation?: NavigationLike }).navigation;
  const index = nav?.currentEntry?.index;
  if (!nav || index === undefined || index < 1) return null;

  const url = nav.entries()[index - 1]?.url;
  if (!url) return null;
  const parsed = new URL(url);
  return parsed.origin === window.location.origin ? parsed.pathname : null;
}

// True when going back through history is known to land on a page whose
// pathname matches one of these patterns.
export function canGoBackTo(patterns: RegExp[]): boolean {
  const previous = previousHistoryPathname();
  return (
    previous !== null && patterns.some((pattern) => pattern.test(previous))
  );
}
