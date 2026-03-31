"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "./CountdownTimer";
import PieceCard from "./PieceCard";
import RevealConfirmModal from "./RevealConfirmModal";
import EditRiffModal from "./EditRiffModal";
import DeleteRiffConfirmModal from "./DeleteRiffConfirmModal";
import BackButton from "@/components/BackButton";
import RevealCelebration from "./RevealCelebration";
import { getRiffDisplayTitle } from "@/lib/riff-utils";
import RiffCTAButton from "@/components/riffs/RiffCTAButton";
import ProgressCard from "@/components/riffs/ProgressCard";

interface RiffPageLayoutProps {
  riff: {
    id: string;
    title: string | null;
    volumeNumber?: number | null;
    prompt: string | null;
    deadline: string | null;
    status: string;
    createdAt: string;
    clubId: string;
    club: { id: string; name: string };
    creator: {
      id: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
    participants: Array<{
      user: {
        id: string;
        name: string | null;
        username: string | null;
        avatarUrl: string | null;
      };
    }>;
    pieces: Array<{
      submittedAt: string | null;
      piece: {
        id: string;
        title: string;
        authorId: string;
        wordCount: number;
        coverImage?: string | null;
        currentContent?: string | null;
        updatedAt?: string;
        commentCount?: number;
        author?: {
          id: string;
          name: string | null;
          avatarUrl: string | null;
        };
      };
    }>;
  };
  currentUserId: string;
  isAdmin: boolean;
  isJoined: boolean;
  hasDraft: boolean;
  hasSubmitted: boolean;
  readPieceIds?: string[];
  onReveal?: () => void;
}

export default function RiffPageLayout({
  riff,
  currentUserId,
  isAdmin,
  isJoined: initialIsJoined,
  hasDraft,
  hasSubmitted,
  readPieceIds = [],
  onReveal,
}: RiffPageLayoutProps) {
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [isRevealButtonHovered, setIsRevealButtonHovered] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();
  // Deadline detection
  const isPastDeadline = riff.deadline
    ? new Date(riff.deadline).getTime() < Date.now()
    : false;

  const canRevealNoDeadline =
    !riff.deadline && isAdmin && riff.pieces.length > 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const submittedUsers = riff.participants.filter((p) =>
    riff.pieces.some(
      (piece) =>
        piece.submittedAt !== null && piece.piece.authorId === p.user.id
    )
  );

  const waitingUsers = riff.participants.filter(
    (p) =>
      !riff.pieces.some(
        (piece) =>
          piece.submittedAt !== null && piece.piece.authorId === p.user.id
      )
  );

  const handleRevealClick = () => {
    if (onReveal) {
      onReveal();
    } else {
      setIsRevealModalOpen(true);
    }
  };

  const handleRevealConfirm = async () => {
    setIsRevealing(true);
    try {
      const res = await fetch(`/api/riffs/${riff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVEALED" }),
      });
      if (res.ok) {
        setIsRevealModalOpen(false);
        setShowCelebration(true);
      }
    } catch (err) {
      console.error("Error revealing riff:", err);
    } finally {
      setIsRevealing(false);
    }
  };

  const existingPieceMatch = riff.pieces.find(
    (p) => p.piece.authorId === currentUserId
  );
  const existingPieceId = existingPieceMatch?.piece.id ?? null;
  const existingPiece = existingPieceMatch
    ? {
        id: existingPieceMatch.piece.id,
        title: existingPieceMatch.piece.title,
        wordCount: existingPieceMatch.piece.wordCount,
      }
    : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Back navigation */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "24px 24px 0",
        }}
      >
        <BackButton href={`/clubs/${riff.clubId}`} />
      </div>

      {/* Main content */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        {/* Riff header */}
        <div
          className="riff-page-header"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          {/* Left — title, dates, prompt, participants */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Title & dates */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#000000",
                  margin: 0,
                }}
              >
                {getRiffDisplayTitle(riff)}
              </h1>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: isPastDeadline ? "#FF4444" : "#808080",
                    margin: 0,
                  }}
                >
                  {isPastDeadline
                    ? "Deadline passed"
                    : riff.deadline
                      ? `${formatDate(riff.createdAt)} - ${formatDate(riff.deadline)}`
                      : formatDate(riff.createdAt)}
                </p>
                {isAdmin &&
                  (riff.status === "ACTIVE" || riff.status === "DRAFT") && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      aria-label="Edit riff"
                      style={{
                        background: "transparent",
                        border: "2px solid transparent",
                        cursor: "pointer",
                        padding: "4px 6px",
                        color: "#808080",
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        transition:
                          "background-color 0.15s ease, box-shadow 0.1s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#01EFFC";
                        e.currentTarget.style.borderColor = "#000000";
                        e.currentTarget.style.color = "#000000";
                        e.currentTarget.style.boxShadow =
                          "3px 3px 0px 0px #000000";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.color = "#808080";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <svg
                        width="12"
                        height="3"
                        viewBox="0 0 12 3"
                        fill="currentColor"
                      >
                        <circle cx="1.5" cy="1.5" r="1.5" />
                        <circle cx="6" cy="1.5" r="1.5" />
                        <circle cx="10.5" cy="1.5" r="1.5" />
                      </svg>
                    </button>
                  )}
              </div>
            </div>

            {/* Delete — DRAFT only, admin only */}
            {isAdmin && riff.status === "DRAFT" && (
              <div>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  style={{
                    background: "none",
                    border: "1px solid #E6E6E6",
                    padding: "6px 16px",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "13px",
                    fontWeight: 300,
                    color: "#808080",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#FF4444";
                    e.currentTarget.style.color = "#FF4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E6E6E6";
                    e.currentTarget.style.color = "#808080";
                  }}
                >
                  Delete
                </button>
              </div>
            )}

            {/* Prompt */}
            {riff.prompt && (
              <div
                style={{
                  borderLeft: "2px solid #000000",
                  paddingLeft: "16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: "#000000",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {riff.prompt}
                </p>
              </div>
            )}
          </div>

          {/* Right — CTA button + countdown */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              minWidth: "200px",
            }}
          >
            {(isPastDeadline || canRevealNoDeadline) &&
            isAdmin &&
            riff.status === "ACTIVE" ? (
              <button
                onClick={handleRevealClick}
                onMouseEnter={() => setIsRevealButtonHovered(true)}
                onMouseLeave={() => setIsRevealButtonHovered(false)}
                style={{
                  backgroundColor: isRevealButtonHovered
                    ? "#00FF66"
                    : "#FFFFFF",
                  border: "2px solid #000000",
                  boxShadow: isRevealButtonHovered
                    ? "8px 8px 0px 0px #000000"
                    : "8px 8px 0px 0px #01EFFC",
                  padding: "12px 48px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  cursor: "pointer",
                  transition: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Reveal pieces
              </button>
            ) : isPastDeadline && !isAdmin && riff.status === "ACTIVE" ? (
              <button
                disabled
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #000000",
                  boxShadow: "8px 8px 0px 0px #808080",
                  padding: "12px 48px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#808080",
                  cursor: "not-allowed",
                  transition: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Waiting for the host to reveal
              </button>
            ) : riff.status !== "REVEALED" ? (
              <RiffCTAButton
                riffId={riff.id}
                isJoined={isJoined}
                hasDraft={hasDraft}
                hasSubmitted={hasSubmitted}
                existingPieceId={existingPieceId}
                existingPiece={existingPiece}
                onJoin={() => setIsJoined(true)}
              />
            ) : null}

            {isJoined && riff.deadline && !isPastDeadline && (
              <CountdownTimer deadline={new Date(riff.deadline)} />
            )}
            {isPastDeadline && riff.deadline && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#FF4444",
                  margin: 0,
                }}
              >
                Time&apos;s up!
              </p>
            )}
          </div>
        </div>

        {/* Pieces gallery for REVEALED riffs */}
        {riff.status === "REVEALED" && riff.pieces.length > 0 && (
          <div style={{ marginTop: "48px" }}>
            {/* Stats header */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: 700 }}>{riff.pieces.length}</span>{" "}
                {riff.pieces.length === 1 ? "piece" : "pieces"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: 700 }}>
                  {riff.pieces
                    .reduce((sum, p) => sum + (p.piece.wordCount || 0), 0)
                    .toLocaleString()}
                </span>{" "}
                words
              </p>
            </div>

            {/* Pieces grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px",
              }}
            >
              {riff.pieces.map((pieceRiff) => (
                <PieceCard
                  key={pieceRiff.piece.id}
                  piece={{
                    id: pieceRiff.piece.id,
                    title: pieceRiff.piece.title,
                    coverImage: pieceRiff.piece.coverImage,
                    currentContent: pieceRiff.piece.currentContent || "",
                    wordCount: pieceRiff.piece.wordCount,
                    commentCount: pieceRiff.piece.commentCount,
                    author: pieceRiff.piece.author || {
                      id: pieceRiff.piece.authorId,
                      name: null,
                      avatarUrl: null,
                    },
                  }}
                  isRead={readPieceIds.includes(pieceRiff.piece.id)}
                  onClick={() =>
                    router.push(`/read/${pieceRiff.piece.id}?riff=${riff.id}`)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Progress view for non-revealed riffs */}
        {riff.status !== "REVEALED" &&
          riff.participants.length > 0 &&
          (() => {
            // Build a map from authorId → piece data for quick lookup
            const pieceByAuthor = Object.fromEntries(
              riff.pieces.map((pr) => [
                pr.piece.authorId,
                {
                  id: pr.piece.id,
                  title: pr.piece.title,
                  wordCount: pr.piece.wordCount,
                  updatedAt: pr.piece.updatedAt ?? new Date().toISOString(),
                  submittedAt: pr.submittedAt,
                  coverImage: pr.piece.coverImage,
                },
              ])
            );

            // Sort: submitted (0) → in-progress (1) → not-started (2)
            const sorted = [...riff.participants].sort((a, b) => {
              const pa = pieceByAuthor[a.user.id];
              const pb = pieceByAuthor[b.user.id];
              const tierA = !pa ? 2 : pa.submittedAt ? 0 : 1;
              const tierB = !pb ? 2 : pb.submittedAt ? 0 : 1;
              if (tierA !== tierB) return tierA - tierB;
              // Within submitted: most recent first
              if (tierA === 0)
                return (
                  new Date(pb.submittedAt!).getTime() -
                  new Date(pa.submittedAt!).getTime()
                );
              // Within in-progress: most recently active first
              if (tierA === 1)
                return (
                  new Date(pb.updatedAt).getTime() -
                  new Date(pa.updatedAt).getTime()
                );
              return 0; // not-started: keep join order
            });

            return (
              <div style={{ marginTop: "48px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {sorted.map((p) => (
                    <ProgressCard
                      key={p.user.id}
                      user={p.user}
                      piece={pieceByAuthor[p.user.id] ?? null}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
      </div>

      {/* Reveal Confirm Modal (for riff detail page) */}
      <RevealConfirmModal
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
        onConfirm={handleRevealConfirm}
        isRevealing={isRevealing}
        riffTitle={getRiffDisplayTitle(riff)}
        waitingUsers={riff.participants
          .filter(
            (p) =>
              !riff.pieces.some(
                (piece) =>
                  piece.submittedAt !== null &&
                  piece.piece.authorId === p.user.id
              )
          )
          .map((p) => ({
            id: p.user.id,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
          }))}
        submittedCount={
          riff.participants.filter((p) =>
            riff.pieces.some(
              (piece) =>
                piece.submittedAt !== null && piece.piece.authorId === p.user.id
            )
          ).length
        }
        totalParticipants={riff.participants.length}
      />

      {/* Reveal Celebration */}
      {showCelebration && (
        <RevealCelebration
          pieceCount={riff.pieces.length}
          onDismiss={() => {
            setShowCelebration(false);
            router.refresh();
          }}
        />
      )}

      {/* Edit Riff Modal */}
      {isEditModalOpen && (
        <EditRiffModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
          riff={{
            id: riff.id,
            title: riff.title,
            prompt: riff.prompt,
            deadline: riff.deadline,
          }}
        />
      )}

      {/* Delete Riff Modal */}
      {isDeleteModalOpen && (
        <DeleteRiffConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={() => {
            setIsDeleteModalOpen(false);
            router.push(`/clubs/${riff.clubId}`);
          }}
          riffId={riff.id}
          riffTitle={getRiffDisplayTitle(riff)}
        />
      )}

      <style>{`
        @media (max-width: 767px) {
          .riff-page-header {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .riff-page-header > div:last-child {
            width: 100% !important;
            min-width: 0 !important;
          }
          .riff-page-header > div:last-child button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
