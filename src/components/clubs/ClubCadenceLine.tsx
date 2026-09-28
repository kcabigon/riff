import { RecurringIcon } from "@/components/shared/icons";
import {
  getCadenceLabel,
  isIntervalCadence,
  type CadenceValue,
} from "@/lib/cadence";

interface ClubCadenceLineProps {
  cadence: CadenceValue;
}

// The club's rhythm, as a subheading under the club name. Used by
// ClubPageLayout's three header branches and JoinClubClient's three, so
// prospective members see it before they join.
//
// Renders nothing for Manual and Paused — neither has a rhythm to state, which
// is what isIntervalCadence already gates on for the cron. Note that means the
// line is absent for every club until a host picks an interval, since Manual is
// the schema default.
//
// White at 16px to match the stats row beneath it: everything in these headers
// sits on a banner photo or the black fallback, and smaller text loses too much
// legibility over an arbitrary image.
export default function ClubCadenceLine({ cadence }: ClubCadenceLineProps) {
  if (!isIntervalCadence(cadence)) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <RecurringIcon color="#FFFFFF" size={14} />
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#FFFFFF",
          margin: 0,
        }}
      >
        Cadence:{" "}
        <span style={{ fontWeight: 700 }}>{getCadenceLabel(cadence)}</span>
      </p>
    </div>
  );
}
