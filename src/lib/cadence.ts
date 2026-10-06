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

// Stored as MANUAL, shown as Freestyle: the host starts riffs whenever they
// like. Renamed in the UI only, so the enum and every row keep their value.
const MANUAL: CadenceOption = {
  value: "MANUAL",
  label: "Freestyle",
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

// The settings modal's Automatic tab. The split is the same one
// isIntervalCadence gates on — these start riffs on a schedule, Freestyle and
// Pause (their own tabs) produce none — so what the host sees matches the
// behavior the cron actually implements.
export const CADENCE_INTERVAL_OPTIONS: CadenceOption[] = [
  WEEKLY,
  BIWEEKLY,
  MONTHLY,
  BIMONTHLY,
  QUARTERLY,
];

// Full set, matching the enum.
const CADENCE_OPTIONS: CadenceOption[] = [
  ...CADENCE_INTERVAL_OPTIONS,
  MANUAL,
  PAUSED,
];

export const DEFAULT_CADENCE: CadenceValue = "BIWEEKLY";

// Days until the chosen cadence's next deadline, or null for Manual/Paused
// (no fixed interval to seed one). Used both to give a newly created club's
// first riff a real deadline and to date every auto-created riff after it.
export function getCadenceDays(value: CadenceValue): number | null {
  return CADENCE_OPTIONS.find((o) => o.value === value)?.days ?? null;
}

export function getCadenceLabel(value: CadenceValue): string {
  return CADENCE_OPTIONS.find((o) => o.value === value)?.label ?? "Freestyle";
}

// The label as a state rather than a choice, for the club page's cadence line.
// Only Pause differs: it's an action in the picker ("Pause"), but on the page
// it describes where the club is ("Paused").
export function getCadenceStatusLabel(value: CadenceValue): string {
  return value === "PAUSED" ? "Paused" : getCadenceLabel(value);
}

// True only for the cadences that produce riffs on a schedule. Manual and
// Paused both return false — nothing automatic should ever act on those
// clubs, which is the check the cadence cron will gate on.
export function isIntervalCadence(value: CadenceValue): boolean {
  return getCadenceDays(value) !== null;
}

// Whether the daily sweep reveals this club's riffs on its own. It reveals at
// the deadline for every cadence but Freestyle (MANUAL) — Paused included,
// since pausing stops new riffs without stranding submitted pieces — so only
// Freestyle hosts get a Reveal button.
export function revealsAutomatically(value: CadenceValue): boolean {
  return value !== "MANUAL";
}

// The hour (UTC) the daily sweep is scheduled for — must match the cron in
// vercel.json ("0 13 * * *"). Vercel Hobby only promises a daily cron fires
// somewhere within its scheduled hour, never early, so each run lands between
// 13:00 and 13:59 UTC.
export const SWEEP_HOUR_UTC = 13;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// The scheduled sweep that acts on a riff due at `deadline`: the first 13:00
// UTC at or after it. Since a run never fires early, that run always finds the
// riff due, and the sweep never acts before a deadline.
//
// Shared by the sweep (what's due now) and the countdown (when the action
// happens), so the two can't disagree.
export function sweepRunFor(deadline: Date): Date {
  const time = deadline.getTime();
  const run = Date.UTC(
    deadline.getUTCFullYear(),
    deadline.getUTCMonth(),
    deadline.getUTCDate(),
    SWEEP_HOUR_UTC
  );
  return new Date(run >= time ? run : run + DAY_MS);
}

// How every cadence riff is dated — by club creation and by the sweep alike,
// for new riffs and the grace week: `days` out, on the dot of a scheduled run.
//
// The dot matters. A run lands anywhere in its hour, so a deadline dated from
// the moment one fired (13:00:04, say) is later than the next run that fires a
// few seconds earlier in the hour, and the riff would sit a full day past its
// deadline. Backing off an hour before rounding up keeps a riff the sweep opens
// at exactly `days`, and one opened at any other time (a new club) at most an
// hour short of it.
export function cadenceDeadline(from: Date, days: number): Date {
  return sweepRunFor(new Date(from.getTime() + days * DAY_MS - HOUR_MS));
}

// Whether a riff's one grace week has already been granted, inferred from its
// deadline rather than stored. Every riff on an interval club is dated one
// cadence period out by cadenceDeadline — by the cron and by club creation
// alike, and hosts can't open riffs on an interval club — so a deadline beyond
// that has been extended. The extra day absorbs cadenceDeadline rounding to the
// next run (under a day either way); a granted grace sits a full seven days
// past the line, so the margin is comfortable in both directions.
//
// A host who edits the deadline can consume or reset the grace through this
// inference. Harmless either way — nobody has written — and the alternative is
// a stored flag, which means a migration for a rule this small.
function isGraceGranted(
  createdAt: Date,
  deadline: Date,
  cadenceDays: number
): boolean {
  return deadline.getTime() > createdAt.getTime() + (cadenceDays + 1) * DAY_MS;
}

export type SweepOutcome = "reveal" | "extend" | "pause";

// What the sweep will do to a club's active riff once it's due, or null when
// it leaves the riff alone. The sweep acts on this, and the countdown names it
// ("Revealing soon"), so they share one source.
export function sweepOutcomeFor(
  cadence: CadenceValue,
  riff: { createdAt: Date; deadline: Date; submittedCount: number }
): SweepOutcome | null {
  // Freestyle clubs are host-driven end to end; the cron never touches them.
  if (!revealsAutomatically(cadence)) return null;

  // Work in it — reveal, whatever the cadence. A paused club still reveals:
  // pausing stops new riffs, it doesn't strand pieces people already submitted.
  if (riff.submittedCount > 0) return "reveal";

  // Nothing in it. Paused clubs stop here rather than extending — an extended
  // riff on a paused club is the zombie we're avoiding.
  const cadenceDays = getCadenceDays(cadence);
  if (!cadenceDays) return null;

  // A whole cadence period with nothing written. The club gets one fixed grace
  // week and a warning that says so, then pauses. One week regardless of
  // cadence: it's a last call, and a week reads as a last call whether the
  // club writes weekly or quarterly.
  return isGraceGranted(riff.createdAt, riff.deadline, cadenceDays)
    ? "pause"
    : "extend";
}

// Runtime guard for untrusted input (API request bodies).
export function isCadenceValue(value: unknown): value is CadenceValue {
  return (
    typeof value === "string" && CADENCE_OPTIONS.some((o) => o.value === value)
  );
}
