"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { LeaderboardUser } from "@/app/api/leaderboard/route";

const COLORS = ["#00FF66", "#01EFFC", "#EECF01", "#FF6B35"];

const TIME_FILTERS = [
  { label: "All Time", days: null },
  { label: "90 Days", days: 90 },
  { label: "60 Days", days: 60 },
  { label: "30 Days", days: 30 },
  { label: "Last Week", days: 7 },
] as const;

type TimeFilter = (typeof TIME_FILTERS)[number];

function getDateRange(days: number | null): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (days === null) {
    const start = new Date("2025-01-01");
    return { start, end };
  }
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getDaysBetween(start: Date, end: Date): string[] {
  const days: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  return 3;
}

function colorWithOpacity(hex: string, intensity: number): string {
  if (intensity === 0) return "#1a1a1a";
  const opacities = [0.3, 0.6, 1.0];
  const opacity = opacities[intensity - 1];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function filterCommits(
  commitsByDay: Record<string, number>,
  days: number | null
): Record<string, number> {
  if (days === null) return commitsByDay;
  const { start } = getDateRange(days);
  const startStr = start.toISOString().split("T")[0];
  const filtered: Record<string, number> = {};
  for (const [date, count] of Object.entries(commitsByDay)) {
    if (date >= startStr) {
      filtered[date] = count;
    }
  }
  return filtered;
}

function filterWeeklyData(
  data: Record<string, number>,
  days: number | null
): Record<string, number> {
  if (days === null) return data;
  const { start } = getDateRange(days);
  const startStr = start.toISOString().split("T")[0];
  const filtered: Record<string, number> = {};
  for (const [date, count] of Object.entries(data)) {
    if (date >= startStr) {
      filtered[date] = count;
    }
  }
  return filtered;
}

function totalFromFiltered(filtered: Record<string, number>): number {
  return Object.values(filtered).reduce((sum, n) => sum + n, 0);
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

// Get all unique week dates across all users, sorted
function getWeekDates(
  users: {
    filteredAdditions: Record<string, number>;
    filteredDeletions: Record<string, number>;
  }[]
): string[] {
  const dates = new Set<string>();
  for (const user of users) {
    for (const d of Object.keys(user.filteredAdditions)) dates.add(d);
    for (const d of Object.keys(user.filteredDeletions)) dates.add(d);
  }
  return Array.from(dates).sort();
}

interface HeatmapProps {
  commitsByDay: Record<string, number>;
  color: string;
  days: string[];
}

function Heatmap({ commitsByDay, color, days }: HeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [days]);

  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        gap: "3px",
        overflowX: "auto",
        paddingBottom: "4px",
      }}
    >
      {weeks.map((week) => (
        <div
          key={week[0]}
          style={{ display: "flex", flexDirection: "column", gap: "3px" }}
        >
          {week.map((day) => {
            const count = commitsByDay[day] || 0;
            const intensity = getIntensity(count);
            return (
              <div
                key={day}
                title={`${day}: ${count} commit${count !== 1 ? "s" : ""}`}
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "2px",
                  backgroundColor: colorWithOpacity(color, intensity),
                  cursor: "default",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface WeeklyChartProps {
  additionsByWeek: Record<string, number>;
  deletionsByWeek: Record<string, number>;
  weekDates: string[];
}

function WeeklyChart({
  additionsByWeek,
  deletionsByWeek,
  weekDates,
}: WeeklyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [weekDates]);

  if (weekDates.length === 0) return null;

  // Find max value for scaling
  const maxVal = Math.max(
    1,
    ...weekDates.map((d) => additionsByWeek[d] || 0),
    ...weekDates.map((d) => deletionsByWeek[d] || 0)
  );

  const barWidth = 20;
  const maxBarHeight = 40;

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        overflowX: "auto",
        paddingBottom: "4px",
      }}
    >
      {weekDates.map((date) => {
        const additions = additionsByWeek[date] || 0;
        const deletions = deletionsByWeek[date] || 0;
        const addHeight = Math.max(1, (additions / maxVal) * maxBarHeight);
        const delHeight = Math.max(1, (deletions / maxVal) * maxBarHeight);

        return (
          <div
            key={date}
            title={`Week of ${date}: +${additions.toLocaleString()} / -${deletions.toLocaleString()}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1px",
              flexShrink: 0,
            }}
          >
            {/* Additions bar (green, grows up) */}
            <div
              style={{
                width: `${barWidth}px`,
                height: `${additions > 0 ? addHeight : 0}px`,
                backgroundColor: additions > 0 ? "#00FF66" : "transparent",
                borderRadius: "2px 2px 0 0",
                opacity: additions > 0 ? 0.8 : 0,
              }}
            />
            {/* Deletions bar (red, grows down) */}
            <div
              style={{
                width: `${barWidth}px`,
                height: `${deletions > 0 ? delHeight : 0}px`,
                backgroundColor: deletions > 0 ? "#FF4444" : "transparent",
                borderRadius: "0 0 2px 2px",
                opacity: deletions > 0 ? 0.8 : 0,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  color: string;
}

function StatBox({ label, value, color }: StatBoxProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "120px",
        backgroundColor: "#141414",
        border: "2px solid #222222",
        borderRadius: "12px",
        padding: "20px 16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          marginTop: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

interface LeaderboardPageProps {
  users: LeaderboardUser[];
}

export default function LeaderboardPage({ users }: LeaderboardPageProps) {
  const [activeFilter, setActiveFilter] = useState<TimeFilter>(TIME_FILTERS[0]);

  const rankedUsers = useMemo(() => {
    return users
      .map((user, i) => {
        const filtered = filterCommits(user.commitsByDay, activeFilter.days);
        const total = totalFromFiltered(filtered);
        const filteredAdditions = filterWeeklyData(
          user.additionsByWeek,
          activeFilter.days
        );
        const filteredDeletions = filterWeeklyData(
          user.deletionsByWeek,
          activeFilter.days
        );
        const totalAdds = totalFromFiltered(filteredAdditions);
        const totalDels = totalFromFiltered(filteredDeletions);
        return {
          ...user,
          filteredCommits: filtered,
          filteredTotal: total,
          filteredAdditions,
          filteredDeletions,
          filteredTotalAdditions: totalAdds,
          filteredTotalDeletions: totalDels,
          filteredNet: totalAdds - totalDels,
          color: COLORS[i % COLORS.length],
        };
      })
      .sort((a, b) => b.filteredTotal - a.filteredTotal);
  }, [users, activeFilter]);

  const { start, end } = getDateRange(activeFilter.days);
  const days = getDaysBetween(start, end);
  const weekDates = getWeekDates(rankedUsers);

  // Top-line totals
  const totals = useMemo(() => {
    let commits = 0;
    let additions = 0;
    let deletions = 0;
    for (const u of rankedUsers) {
      commits += u.filteredTotal;
      additions += u.filteredTotalAdditions;
      deletions += u.filteredTotalDeletions;
    }
    return { commits, additions, deletions, net: additions - deletions };
  }, [rankedUsers]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d0d0d",
        color: "#ffffff",
        fontFamily: "var(--font-dm-sans)",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: 700,
              margin: "0 0 8px 0",
              letterSpacing: "-1px",
            }}
          >
            Commit Leaderboard
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#808080",
              margin: 0,
              fontWeight: 300,
            }}
          >
            Who&apos;s been putting in work on Riff?
          </p>
        </div>

        {/* Top-line stats */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "32px",
            flexWrap: "wrap",
          }}
        >
          <StatBox
            label="Commits"
            value={formatNumber(totals.commits)}
            color="#FFFFFF"
          />
          <StatBox
            label="Lines Added"
            value={formatNumber(totals.additions)}
            color="#00FF66"
          />
          <StatBox
            label="Lines Removed"
            value={formatNumber(totals.deletions)}
            color="#FF4444"
          />
          <StatBox
            label="Net Lines"
            value={formatNumber(totals.net)}
            color="#01EFFC"
          />
        </div>

        {/* Time filter pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}
        >
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border:
                  activeFilter.label === filter.label
                    ? "2px solid #ffffff"
                    : "2px solid #333333",
                backgroundColor:
                  activeFilter.label === filter.label
                    ? "#ffffff"
                    : "transparent",
                color:
                  activeFilter.label === filter.label ? "#000000" : "#808080",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: activeFilter.label === filter.label ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Ranked cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {rankedUsers.map((user, rank) => (
            <div
              key={user.email}
              style={{
                backgroundColor: "#141414",
                border:
                  rank === 0 ? `2px solid ${user.color}` : "2px solid #222222",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: rank === 0 ? `0 0 24px ${user.color}33` : "none",
              }}
            >
              {/* User info row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {/* Rank */}
                <div
                  style={{
                    fontSize: rank === 0 ? "32px" : "24px",
                    fontWeight: 700,
                    color: user.color,
                    minWidth: "40px",
                    textAlign: "center",
                  }}
                >
                  {rank === 0 ? "👑" : `#${rank + 1}`}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: `3px solid ${user.color}`,
                    flexShrink: 0,
                  }}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: user.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#000",
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name + username */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                    }}
                  >
                    {user.name}
                  </div>
                  {user.githubUsername && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#808080",
                        fontWeight: 300,
                      }}
                    >
                      @{user.githubUsername}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: user.color,
                    }}
                  >
                    {user.filteredTotal}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#808080",
                      fontWeight: 300,
                    }}
                  >
                    commit{user.filteredTotal !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Lines stats row */}
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: 400,
                }}
              >
                <div>
                  <span style={{ color: "#00FF66" }}>
                    +{user.filteredTotalAdditions.toLocaleString()}
                  </span>
                  <span style={{ color: "#555" }}> added</span>
                </div>
                <div>
                  <span style={{ color: "#FF4444" }}>
                    -{user.filteredTotalDeletions.toLocaleString()}
                  </span>
                  <span style={{ color: "#555" }}> removed</span>
                </div>
                <div>
                  <span style={{ color: "#01EFFC" }}>
                    {user.filteredNet >= 0 ? "+" : ""}
                    {user.filteredNet.toLocaleString()}
                  </span>
                  <span style={{ color: "#555" }}> net</span>
                </div>
              </div>

              {/* Weekly activity chart */}
              {weekDates.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#555",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Weekly lines
                  </div>
                  <WeeklyChart
                    additionsByWeek={user.filteredAdditions}
                    deletionsByWeek={user.filteredDeletions}
                    weekDates={weekDates}
                  />
                </div>
              )}

              {/* Commit heatmap */}
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#555",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Commit activity
                </div>
                <Heatmap
                  commitsByDay={user.filteredCommits}
                  color={user.color}
                  days={days}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "48px",
            color: "#333333",
            fontSize: "12px",
            fontWeight: 300,
          }}
        >
          Commits to develop · Updated every 5 minutes
        </div>
      </div>

      {/* Internal badge */}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: 12,
          zIndex: 9999,
          backgroundColor: "#EECF01",
          color: "#000000",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "11px",
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: "12px",
          border: "1.5px solid #000000",
          boxShadow: "2px 2px 0px #000000",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        INTERNAL
      </div>
    </div>
  );
}
