// Club Cadence — UI mockup only. No `Cadence` field exists on the Club model
// yet, so selections are stored in localStorage rather than persisted via API.
// See TODO.md "Club Cadence" item.
//
// Value names match the confirmed ClubCadence Prisma enum in the schema
// proposal handed to Kyle, so promoting this file to the real API is a
// storage-layer swap (localStorage -> fetch), not a value remapping.

export type CadenceValue =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "PAUSED"
  | "MANUAL";

export interface CadenceOption {
  value: CadenceValue;
  label: string;
  description: string;
}

const WEEKLY: CadenceOption = {
  value: "WEEKLY",
  label: "Weekly",
  description: "7 day riffs",
};

const BIWEEKLY: CadenceOption = {
  value: "BIWEEKLY",
  label: "Bi-weekly",
  description: "14 day riffs",
};

const MONTHLY: CadenceOption = {
  value: "MONTHLY",
  label: "Monthly",
  description: "30 day riffs",
};

const BIMONTHLY: CadenceOption = {
  value: "BIMONTHLY",
  label: "Bi-monthly",
  description: "60 day riffs",
};

const QUARTERLY: CadenceOption = {
  value: "QUARTERLY",
  label: "Quarterly",
  description: "90 day riffs",
};

const PAUSED: CadenceOption = {
  value: "PAUSED",
  label: "Pause",
  description: "Take a break",
};

const MANUAL: CadenceOption = {
  value: "MANUAL",
  label: "Manual",
  description: "Create your own riffs",
};

// Shown when creating a new club — kept to the three most common paces.
// Bimonthly, Quarterly, Paused, and Manual are settings-only: none of them
// make sense as a first choice for a club that hasn't written anything yet.
export const CREATION_CADENCE_OPTIONS: CadenceOption[] = [
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
];

// Interval-based options, ordered short to long.
export const CADENCE_INTERVAL_OPTIONS: CadenceOption[] = [
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
  BIMONTHLY,
  QUARTERLY,
];

// Not really a cadence at all — no automatic interval. Broken out as their
// own "Other" group in the settings modal rather than mixed in with the
// intervals above. Manual first — it's the more likely pick of the two
// (Paused is a full stop, Manual just means "I'll drive").
export const CADENCE_OTHER_OPTIONS: CadenceOption[] = [MANUAL, PAUSED];

// Full flat set — for lookups (getCadenceLabel) and anywhere grouping
// doesn't matter. Shown in the "Riff cadence" settings modal (grouped).
export const CADENCE_OPTIONS: CadenceOption[] = [
  ...CADENCE_INTERVAL_OPTIONS,
  ...CADENCE_OTHER_OPTIONS,
];

export const DEFAULT_CADENCE: CadenceValue = "BIWEEKLY";

export function cadenceStorageKey(clubId: string) {
  return `club-cadence-mock:${clubId}`;
}

export function getCadenceLabel(value: CadenceValue): string {
  return CADENCE_OPTIONS.find((o) => o.value === value)?.label ?? "Bi-weekly";
}
