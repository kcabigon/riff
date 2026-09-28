import type { CSSProperties } from "react";

interface ClubStatsRowProps {
  stats: {
    riffCount: number;
    pieceCount: number;
    wordCount: number;
  };
}

// Always white: every header this appears in sits on a banner photo or the
// black fallback, so there's no light-background variant to account for.
const itemStyle: CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  color: "#FFFFFF",
  margin: 0,
};

// The club header's stat line, shared by ClubPageLayout's three header
// branches (mobile-no-banner, desktop banner overlay, mobile-with-banner) and
// JoinClubClient's three. Those six copies were identical, which is what the
// "KEEP IN SYNC WITH" comments in both files were warning about.
//
// The ThreeDotButton that sits beside this row on the club page stays outside
// it — that's the only reason the public join page can share the component.
export default function ClubStatsRow({ stats }: ClubStatsRowProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 12px",
        alignItems: "start",
      }}
    >
      <p style={itemStyle}>
        <span style={{ fontWeight: 700 }}>{stats.riffCount}</span> riffs
      </p>
      <p style={itemStyle}>
        <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span> pieces
      </p>
      <p style={itemStyle}>
        <span style={{ fontWeight: 700 }}>
          {/* Locale pinned, not the runtime default: this renders on the
              server and again on the client, and a browser locale that groups
              differently ("8.200" vs "8,200") is a hydration mismatch. */}
          {stats.wordCount.toLocaleString("en-US")}
        </span>{" "}
        words
      </p>
    </div>
  );
}
