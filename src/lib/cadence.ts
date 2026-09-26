// Club Cadence — how often a club gets a new riff. The creation-time picker
// seeds the club's first riff deadline; the persisted `Club.cadence` field
// drives every riff after that.
//
// MANUAL is a real, permanent mode, not a transitional state: the host
// creates and reveals riffs themselves, exactly as clubs worked before
// cadence existed. It's the schema default, so every club that predates this
// feature keeps its current behavior until a host opts into an interval.
// PAUSED is the same "no automatic riffs" behavior, framed as temporary.
//
// Values mirror the ClubCadence Prisma enum.

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
  // Only set on the interval options (Weekly..Quarterly) — Manual/Paused
  // have no fixed duration, so there's nothing to seed a deadline with.
  days?: number;
}

const WEEKLY: CadenceOption = {
  value: "WEEKLY",
  label: "Weekly",
  description: "7 day riffs",
  days: 7,
};

const BIWEEKLY: CadenceOption = {
  value: "BIWEEKLY",
  label: "Bi-weekly",
  description: "14 day riffs",
  days: 14,
};

const MONTHLY: CadenceOption = {
  value: "MONTHLY",
  label: "Monthly",
  description: "30 day riffs",
  days: 30,
};

const BIMONTHLY: CadenceOption = {
  value: "BIMONTHLY",
  label: "Bi-monthly",
  description: "60 day riffs",
  days: 60,
};

const QUARTERLY: CadenceOption = {
  value: "QUARTERLY",
  label: "Quarterly",
  description: "90 day riffs",
  days: 90,
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
// Bimonthly, Quarterly, Paused, and Manual are reserved for a future
// settings UI (currently disabled — see the module comment above); none of
// them make sense as a first choice for a club that hasn't written anything
// yet anyway.
export const CREATION_CADENCE_OPTIONS: CadenceOption[] = [
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
];

// The settings modal shows these as two labeled groups rather than one list.
// The split is the same one isIntervalCadence gates on — "Automatic" riffs
// start on a schedule, "Other" produces none — so the grouping the host sees
// matches the behavior the cron actually implements.
export const CADENCE_INTERVAL_OPTIONS: CadenceOption[] = [
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
  BIMONTHLY,
  QUARTERLY,
];

export const CADENCE_OTHER_OPTIONS: CadenceOption[] = [MANUAL, PAUSED];

// Full set, matching the enum.
const CADENCE_OPTIONS: CadenceOption[] = [
  ...CADENCE_INTERVAL_OPTIONS,
  ...CADENCE_OTHER_OPTIONS,
];

export const DEFAULT_CADENCE: CadenceValue = "BIWEEKLY";

// Days until the chosen cadence's next deadline, or null for Manual/Paused
// (no fixed interval to seed one). Used both to give a newly created club's
// first riff a real deadline and to date every auto-created riff after it.
export function getCadenceDays(value: CadenceValue): number | null {
  return CADENCE_OPTIONS.find((o) => o.value === value)?.days ?? null;
}

export function getCadenceLabel(value: CadenceValue): string {
  return CADENCE_OPTIONS.find((o) => o.value === value)?.label ?? "Manual";
}

// True only for the cadences that produce riffs on a schedule. Manual and
// Paused both return false — nothing automatic should ever act on those
// clubs, which is the check the cadence cron will gate on.
export function isIntervalCadence(value: CadenceValue): boolean {
  return getCadenceDays(value) !== null;
}

// Runtime guard for untrusted input (API request bodies).
export function isCadenceValue(value: unknown): value is CadenceValue {
  return (
    typeof value === "string" && CADENCE_OPTIONS.some((o) => o.value === value)
  );
}
