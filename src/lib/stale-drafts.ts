// Write page → draft cards freshness without blocking Back.
//
// Back from /write/[pieceId] used to call router.refresh(), which refetched
// the whole destination page before you could see it. Instead, autosave marks
// drafts as stale here, and pages that show draft cards refresh themselves in
// the background after they mount — only when something was actually edited.

const KEY = "riff:drafts-stale";

export function markDraftsStale() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // sessionStorage unavailable (private mode, etc.) — skip
  }
}

export function consumeDraftsStale(): boolean {
  try {
    if (sessionStorage.getItem(KEY) !== "1") return false;
    sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
