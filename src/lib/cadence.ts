// Club Cadence — the creation-time picker (Weekly/Bi-weekly/Monthly) is real:
// it seeds a new club's first riff with a real deadline. Editing cadence
// after creation is not wired up yet (the "Riff cadence" 3-dot item is
// disabled) since that needs a persisted `Cadence` field on Club, which
// doesn't exist yet. See TODO.md "Club Cadence" item.
//
// Value names match the confirmed ClubCadence Prisma enum in the schema
// proposal handed to Kyle, so wiring up editing later is additive, not a
// value remapping.

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

// Full set, matching the confirmed enum — used only as getCadenceDays'
// lookup table. Editing cadence isn't reachable in the UI yet, so only the
// three CREATION_CADENCE_OPTIONS values above are ever actually looked up
// today; the rest just keep this table complete for when that lands.
const CADENCE_OPTIONS: CadenceOption[] = [
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
  BIMONTHLY,
  QUARTERLY,
  MANUAL,
  PAUSED,
];

export const DEFAULT_CADENCE: CadenceValue = "BIWEEKLY";

// Days until the chosen cadence's first deadline, or null for Manual/Paused
// (no fixed interval to seed one). Used to give a newly created club's first
// riff a real deadline at club-creation time.
export function getCadenceDays(value: CadenceValue): number | null {
  return CADENCE_OPTIONS.find((o) => o.value === value)?.days ?? null;
}
