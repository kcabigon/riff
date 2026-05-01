import type { WhatsNextTrigger } from "@/components/shared/WhatsNextModal";

// Triggers that need global suppression after first show.
// host_created_club and member_joined_club are excluded — they're already
// naturally 1x via the ?welcome= URL param in the onboarding flow.
const GUARDED_TRIGGERS = new Set<WhatsNextTrigger>([
  "host_started_riff",
  "host_submitted",
  "host_revealed",
  "member_joined_riff",
  "member_submitted",
  "member_first_reveal",
]);

function storageKey(trigger: WhatsNextTrigger): string {
  return `whats-next-seen-${trigger}`;
}

/**
 * Returns true if the modal for this trigger should be shown.
 * Unguarded triggers (host_created_club, member_joined_club) always return true.
 */
export function canShowWhatsNext(trigger: WhatsNextTrigger): boolean {
  if (!GUARDED_TRIGGERS.has(trigger)) return true;
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(storageKey(trigger));
}

/**
 * Marks this trigger as seen so it won't show again.
 */
export function markWhatsNextSeen(trigger: WhatsNextTrigger): void {
  if (!GUARDED_TRIGGERS.has(trigger)) return;
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(trigger), "1");
}
