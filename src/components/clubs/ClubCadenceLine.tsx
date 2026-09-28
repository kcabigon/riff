import { RecurringIcon } from "@/components/shared/icons";
import {
  getCadenceStatusLabel,
  isIntervalCadence,
  type CadenceValue,
} from "@/lib/cadence";

interface ClubCadenceLineProps {
  cadence: CadenceValue;
  // Show Paused and Freestyle too, not just the rhythms. The club page does,
  // so members can see why no riff is coming; the join page doesn't, since a
  // prospective member only needs to know the rhythm if there is one.
  showUnscheduled?: boolean;
  // Host and co-host only: opens the cadence settings. Adds a chevron so the
  // line reads as something to tap.
  onClick?: () => void;
}

// The club's rhythm, as a subheading under the club name. Used by
// ClubPageLayout's three header branches and JoinClubClient's three, so
// prospective members see it before they join.
//
// White at 16px to match the stats row beneath it: everything in these headers
// sits on a banner photo or the black fallback, and smaller text loses too much
// legibility over an arbitrary image.
export default function ClubCadenceLine({
  cadence,
  showUnscheduled = false,
  onClick,
}: ClubCadenceLineProps) {
  if (!showUnscheduled && !isIntervalCadence(cadence)) return null;

  const content = (
    <>
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
        <span style={{ fontWeight: 700 }}>
          {getCadenceStatusLabel(cadence)}
          {onClick && " ›"}
        </span>
      </p>
    </>
  );

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as const;

  if (!onClick) return <div style={rowStyle}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Riff cadence: ${getCadenceStatusLabel(cadence)}. Change it`}
      style={{
        ...rowStyle,
        alignSelf: "flex-start",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {content}
    </button>
  );
}
