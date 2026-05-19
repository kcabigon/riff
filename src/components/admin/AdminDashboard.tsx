"use client";

import Link from "next/link";
import StatCard from "./StatCard";
import RiffStatusBar from "./RiffStatusBar";

interface AdminDashboardProps {
  overview: {
    users: number;
    onboarded: number;
    clubs: number;
    riffs: number;
    pieces: number;
    comments: number;
    totalWords: number;
  };
  riffsByStatus: {
    draft: number;
    active: number;
    revealed: number;
    completed: number;
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    joined: string;
    onboarded: boolean;
  }>;
  topClubs: Array<{
    id: string;
    name: string;
    members: number;
    riffs: number;
  }>;
  recentPieces: Array<{
    id: string;
    title: string;
    wordCount: number;
    created: string;
    author: string;
  }>;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminDashboard({
  overview,
  riffsByStatus,
  recentUsers,
  topClubs,
  recentPieces,
}: AdminDashboardProps) {
  const conversionRate =
    overview.users > 0
      ? Math.round((overview.onboarded / overview.users) * 100)
      : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid #000000",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "24px",
              fontWeight: 700,
              color: "#000000",
              textDecoration: "none",
            }}
          >
            riff
          </Link>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 700,
              color: "#FFFFFF",
              backgroundColor: "#000000",
              padding: "4px 12px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Admin
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: "#808080",
          }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 64px",
          display: "flex",
          flexDirection: "column",
          gap: "48px",
        }}
      >
        {/* Overview Stats Grid */}
        <section>
          <h1
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "32px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 24px 0",
            }}
          >
            Overview
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <StatCard
              label="Users"
              value={overview.users}
              accent="#00FF66"
              detail={`${overview.onboarded} onboarded (${conversionRate}%)`}
            />
            <StatCard label="Clubs" value={overview.clubs} accent="#01EFFC" />
            <StatCard label="Riffs" value={overview.riffs} accent="#EECF01" />
            <StatCard
              label="Pieces"
              value={overview.pieces}
              accent="#FF6B35"
            />
            <StatCard
              label="Comments"
              value={overview.comments}
              accent="#C01582"
            />
            <StatCard
              label="Words Written"
              value={overview.totalWords}
              accent="#955CB5"
              format
            />
          </div>
        </section>

        {/* Riff Pipeline */}
        <section>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "24px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 24px 0",
            }}
          >
            Riff Pipeline
          </h2>
          <RiffStatusBar
            statuses={riffsByStatus}
            total={overview.riffs}
          />
        </section>

        {/* Two-column layout: Top Clubs + Recent Pieces */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "32px",
          }}
        >
          {/* Top Clubs */}
          <section>
            <h2
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "24px",
                fontWeight: 400,
                color: "#000000",
                margin: "0 0 24px 0",
              }}
            >
              Top Clubs
            </h2>
            <div
              style={{
                border: "2px solid #000000",
                overflow: "hidden",
              }}
            >
              {topClubs.map((club, i) => (
                <div
                  key={club.id}
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom:
                      i < topClubs.length - 1
                        ? "1px solid #E6E6E6"
                        : undefined,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px",
                      fontWeight: 300,
                      color: "#000000",
                    }}
                  >
                    {club.name}
                  </span>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#000000",
                        backgroundColor: "#01EFFC",
                        padding: "2px 8px",
                      }}
                    >
                      {club.members} members
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#000000",
                        backgroundColor: "#EECF01",
                        padding: "2px 8px",
                      }}
                    >
                      {club.riffs} riffs
                    </span>
                  </div>
                </div>
              ))}
              {topClubs.length === 0 && (
                <div
                  style={{
                    padding: "24px 20px",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#808080",
                    textAlign: "center",
                  }}
                >
                  No clubs yet
                </div>
              )}
            </div>
          </section>

          {/* Recent Pieces */}
          <section>
            <h2
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "24px",
                fontWeight: 400,
                color: "#000000",
                margin: "0 0 24px 0",
              }}
            >
              Recent Pieces
            </h2>
            <div
              style={{
                border: "2px solid #000000",
                overflow: "hidden",
              }}
            >
              {recentPieces.map((piece, i) => (
                <div
                  key={piece.id}
                  style={{
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    borderBottom:
                      i < recentPieces.length - 1
                        ? "1px solid #E6E6E6"
                        : undefined,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "14px",
                        fontWeight: 300,
                        color: "#000000",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {piece.title || "Untitled"}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "12px",
                        fontWeight: 300,
                        color: "#808080",
                        margin: 0,
                      }}
                    >
                      {piece.author} &middot; {piece.wordCount.toLocaleString()}{" "}
                      words &middot; {timeAgo(piece.created)}
                    </p>
                  </div>
                </div>
              ))}
              {recentPieces.length === 0 && (
                <div
                  style={{
                    padding: "24px 20px",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#808080",
                    textAlign: "center",
                  }}
                >
                  No pieces yet
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Recent Users */}
        <section>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "24px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 24px 0",
            }}
          >
            Recent Users
          </h2>
          <div
            style={{
              border: "2px solid #000000",
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 120px 100px",
                padding: "12px 20px",
                backgroundColor: "#000000",
              }}
            >
              {["Name", "Email", "Joined", "Status"].map((col) => (
                <span
                  key={col}
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {col}
                </span>
              ))}
            </div>
            {/* Table rows */}
            {recentUsers.map((user, i) => (
              <div
                key={user.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px 100px",
                  padding: "12px 20px",
                  borderBottom:
                    i < recentUsers.length - 1
                      ? "1px solid #E6E6E6"
                      : undefined,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#000000",
                  }}
                >
                  {user.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#808080",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#808080",
                  }}
                >
                  {timeAgo(user.joined)}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: user.onboarded ? "#000000" : "#808080",
                    backgroundColor: user.onboarded ? "#00FF66" : "#E6E6E6",
                    padding: "2px 8px",
                    textAlign: "center",
                  }}
                >
                  {user.onboarded ? "Active" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
