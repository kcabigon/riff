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
  // Convert hex to rgba
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

function totalFromFiltered(filtered: Record<string, number>): number {
  return Object.values(filtered).reduce((sum, n) => sum + n, 0);
}

interface HeatmapProps {
  commitsByDay: Record<string, number>;
  color: string;
  days: string[];
}

function Heatmap({ commitsByDay, color, days }: HeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to the right (most recent) on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [days]);

  // Group days into weeks (columns of 7)
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
      {weeks.map((week, wi) => (
        <div
          key={wi}
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
        return {
          ...user,
          filteredCommits: filtered,
          filteredTotal: total,
          color: COLORS[i % COLORS.length],
        };
      })
      .sort((a, b) => b.filteredTotal - a.filteredTotal);
  }, [users, activeFilter]);

  const { start, end } = getDateRange(activeFilter.days);
  const days = getDaysBetween(start, end);

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
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
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

                {/* Commit count */}
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

              {/* Heatmap */}
              <Heatmap
                commitsByDay={user.filteredCommits}
                color={user.color}
                days={days}
              />
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
