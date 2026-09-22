// Club Cadence — UI mockup only. No `Cadence` field exists on the Club model
// yet, so selections are stored in localStorage rather than persisted via API.
// See TODO.md "Club Cadence" item.

export type CadenceValue = "0days" | "7days" | "14days" | "30days" | "90days";

export interface CadenceOption {
  value: CadenceValue;
  label: string;
  description: string;
}

const WEEKLY: CadenceOption = {
  value: "7days",
  label: "Weekly",
  description: "A new riff every week — for fast-moving groups.",
};

const BIWEEKLY: CadenceOption = {
  value: "14days",
  label: "Bi-weekly",
  description: "A new riff every 2 weeks — the default pace.",
};

const MONTHLY: CadenceOption = {
  value: "30days",
  label: "Monthly",
  description: "A new riff once a month — steady and low-pressure.",
};

const QUARTERLY: CadenceOption = {
  value: "90days",
  label: "Quarterly",
  description:
    "A new riff every 3 months — for a club that wants to slow down without fully pausing.",
};

export const PAUSED_CADENCE_OPTION: CadenceOption = {
  value: "0days",
  label: "Paused",
  description: "No automatic riffs until you turn this back on.",
};

// Shown when creating a new club — Quarterly is left out here. A brand-new
// club committing to a riff every 3 months is a good way to get zero
// traction; it's offered later, in settings, as a slow-down option for an
// existing club instead.
export const CREATION_CADENCE_OPTIONS: CadenceOption[] = [
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
];

// Shown in the "Riff cadence" settings modal — the full set, including
// Quarterly (slow down) and Paused (stop), for a club that's already running.
export const CADENCE_OPTIONS: CadenceOption[] = [
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
  QUARTERLY,
];

export const DEFAULT_CADENCE: CadenceValue = "14days";

export function cadenceStorageKey(clubId: string) {
  return `club-cadence-mock:${clubId}`;
}

export function getCadenceLabel(value: CadenceValue): string {
  return (
    [...CADENCE_OPTIONS, PAUSED_CADENCE_OPTION].find((o) => o.value === value)
      ?.label ?? "Bi-weekly"
  );
}
