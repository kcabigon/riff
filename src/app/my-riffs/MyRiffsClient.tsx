"use client";

import { useState } from "react";
import NavBar from "@/components/clubs/NavBar";
import RiffCard from "@/components/riffs/RiffCard";
import ReadyToRevealCard from "@/components/riffs/ReadyToRevealCard";
import CompletedRiffCard from "@/components/riffs/CompletedRiffCard";
import {
  getSubmittedPieces,
  hasUnreadPieces,
  isRiffFullyRead,
} from "@/lib/riff-utils";

interface RiffPiece {
  submittedAt: string | null;
  piece: {
    id: string;
    title: string;
    authorId: string;
    coverImage?: string | null;
    wordCount: number;
  };
}

interface Riff {
  id: string;
  title: string | null;
  volumeNumber?: number | null;
  status: string;
  prompt?: string | null;
  deadline: string | null;
  createdAt: string;
  club: { id: string; name: string };
  participants: Array<{
    user: {
      id: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
  }>;
  pieces: RiffPiece[];
}

interface MyRiffsClientProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  userClubs: Array<{ id: string; name: string }>;
  currentClub: { id: string; name: string } | null;
  riffs: Riff[];
  currentUserId: string;
  readCounts: Record<string, number>;
  predictedVolumeByClub: Record<string, number>;
}

export default function MyRiffsClient({
  user,
  userClubs,
  currentClub,
  riffs,
  currentUserId,
  readCounts,
  predictedVolumeByClub,
}: MyRiffsClientProps) {
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

  const otherSubmittedCount = (riff: Riff) =>
    getSubmittedPieces(riff.pieces).filter(
      (p) => p.piece.authorId !== currentUserId
    ).length;

  const isFullyReadForUser = (riff: Riff) => {
    const others = otherSubmittedCount(riff);
    if (others === 0) return getSubmittedPieces(riff.pieces).length > 0;
    return isRiffFullyRead(riff.id, readCounts, others);
  };

  const hasUnreadForUser = (riff: Riff) =>
    hasUnreadPieces(riff.id, readCounts, otherSubmittedCount(riff));

  const writingRiffs = riffs.filter((r) => r.status === "ACTIVE");
  const readingRiffs = riffs.filter(
    (r) => r.status === "REVEALED" && hasUnreadForUser(r)
  );
  const pastRiffs = riffs.filter(
    (r) =>
      r.status === "COMPLETED" ||
      (r.status === "REVEALED" && isFullyReadForUser(r))
  );

  // Group past riffs by club, preserving insertion order (clubs appear in order of first past riff)
  const pastByClub: Record<string, { clubName: string; riffs: Riff[] }> = {};
  for (const riff of pastRiffs) {
    if (!pastByClub[riff.club.id]) {
      pastByClub[riff.club.id] = { clubName: riff.club.name, riffs: [] };
    }
    pastByClub[riff.club.id].riffs.push(riff);
  }
  for (const clubId in pastByClub) {
    pastByClub[clubId].riffs.sort((a, b) => {
      if (a.volumeNumber != null && b.volumeNumber != null) {
        return b.volumeNumber - a.volumeNumber;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  const tabs = [
    { key: "current" as const, label: "Current" },
    { key: "past" as const, label: "Past" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      <NavBar
        user={user}
        clubs={userClubs}
        currentClub={currentClub}
        showClubDropdown={false}
      />

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "32px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 24px 0",
          }}
        >
          My Riffs
        </h1>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #E6E6E6",
            marginBottom: "32px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: activeTab === tab.key ? 500 : 300,
                color: activeTab === tab.key ? "#000000" : "#808080",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "2px solid #000000"
                    : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Current Tab */}
        {activeTab === "current" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "48px" }}
          >
            {/* Writing */}
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "24px",
                  fontWeight: 400,
                  color: "#000000",
                  margin: "0 0 16px 0",
                }}
              >
                Writing
              </h2>
              {writingRiffs.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {writingRiffs.map((riff) => {
                    const hasSubmitted = riff.pieces.some(
                      (p) =>
                        p.piece.authorId === currentUserId &&
                        p.submittedAt !== null
                    );
                    const hasDraft = riff.pieces.some(
                      (p) => p.piece.authorId === currentUserId
                    );
                    return (
                      <div key={riff.id}>
                        <RiffCard
                          riff={{
                            id: riff.id,
                            title: riff.title,
                            volumeNumber: riff.volumeNumber,
                            status: riff.status,
                            prompt: riff.prompt,
                            deadline: riff.deadline
                              ? new Date(riff.deadline)
                              : null,
                            createdAt: new Date(riff.createdAt),
                            participants: riff.participants,
                            pieces: riff.pieces,
                          }}
                          isJoined={true}
                          hasDraft={hasDraft}
                          hasSubmitted={hasSubmitted}
                          currentUserId={currentUserId}
                          isAdmin={false}
                          predictedVolumeNumber={
                            predictedVolumeByClub[riff.club.id]
                          }
                        />
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "12px",
                            fontWeight: 300,
                            color: "#808080",
                            margin: "8px 0 0 0",
                          }}
                        >
                          {riff.club.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: "#808080",
                    margin: 0,
                  }}
                >
                  No active riffs right now.
                </p>
              )}
            </div>

            {/* Reading — only rendered when there are unread revealed riffs */}
            {readingRiffs.length > 0 && (
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "#000000",
                    margin: "0 0 16px 0",
                  }}
                >
                  Reading
                </h2>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px",
                  }}
                >
                  {readingRiffs.map((riff) => (
                    <ReadyToRevealCard
                      key={riff.id}
                      riff={riff}
                      readCount={readCounts[riff.id] || 0}
                      totalPieces={otherSubmittedCount(riff)}
                      clubName={riff.club.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Past Tab */}
        {activeTab === "past" && (
          <div>
            {Object.keys(pastByClub).length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "48px",
                }}
              >
                {Object.values(pastByClub).map(
                  ({ clubName, riffs: clubRiffs }) => (
                    <div key={clubName}>
                      <h2
                        style={{
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: "24px",
                          fontWeight: 400,
                          color: "#000000",
                          margin: "0 0 16px 0",
                        }}
                      >
                        {clubName}
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "40px",
                          overflowX: "auto",
                          paddingBottom: "16px",
                        }}
                      >
                        {clubRiffs.map((riff) => (
                          <CompletedRiffCard
                            key={riff.id}
                            riff={{
                              id: riff.id,
                              title: riff.title,
                              volumeNumber: riff.volumeNumber,
                              status: riff.status,
                              createdAt: new Date(riff.createdAt),
                              deadline: riff.deadline
                                ? new Date(riff.deadline)
                                : null,
                            }}
                            clubName={clubName}
                            pieces={getSubmittedPieces(riff.pieces).map(
                              (p) => ({
                                id: p.piece.id,
                                title: p.piece.title,
                                coverImage: p.piece.coverImage,
                                wordCount: p.piece.wordCount,
                              })
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                }}
              >
                Your completed riffs will appear here.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
