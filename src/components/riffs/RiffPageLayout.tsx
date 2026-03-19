"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarStack from "@/components/shared/AvatarStack";
import CountdownTimer from "./CountdownTimer";
import PieceCard from "./PieceCard";
import RevealConfirmModal from "./RevealConfirmModal";
import EditRiffModal from "./EditRiffModal";
import DeleteRiffConfirmModal from "./DeleteRiffConfirmModal";
import BackButton from "@/components/BackButton";
import RevealCelebration from "./RevealCelebration";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import { useDraftCreation } from "@/hooks/useDraftCreation";

interface RiffPageLayoutProps {
  riff: {
    id: string;
    title: string;
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
      piece: {
        id: string;
        title: string;
        authorId: string;
        wordCount: number;
        coverImage?: string | null;
        currentContent?: string;
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
  hasSubmitted: boolean;
  readPieceIds?: string[];
  onReveal?: () => void;
}

export default function RiffPageLayout({
  riff,
  currentUserId,
  isAdmin,
  isJoined: initialIsJoined,
  hasSubmitted,
  readPieceIds = [],
  onReveal,
}: RiffPageLayoutProps) {
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();
  const handleAvatarClick = useProfileNavigation();
  const { createDraft } = useDraftCreation();

  // Deadline detection
  const isPastDeadline = riff.deadline
    ? new Date(riff.deadline).getTime() < Date.now()
    : false;

  const canRevealNoDeadline = !riff.deadline && isAdmin && riff.pieces.length > 0;

  const handleJoinRiff = async () => {
    try {
      const res = await fetch(`/api/riffs/${riff.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setIsJoined(true);
      }
    } catch (err) {
      console.error("Error joining riff:", err);
    }
  };

  const handleContinueWriting = () => {
    const existingPiece = riff.pieces.find(
      (p) => p.piece.authorId === currentUserId
    );
    if (existingPiece) {
      router.push(`/write/${existingPiece.piece.id}`);
    } else {
      createDraft(riff.id);
    }
  };

  const handleButtonClick = () => {
    if (!isJoined) {
      handleJoinRiff();
    } else {
      handleContinueWriting();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const submittedUsers = riff.participants.filter((p) =>
    riff.pieces.some((piece) => piece.piece.authorId === p.user.id)
  );

  const waitingUsers = riff.participants.filter(
    (p) => !riff.pieces.some((piece) => piece.piece.authorId === p.user.id)
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

  const buttonLabel = isJoined
    ? hasSubmitted
      ? "View submission"
      : "Continue writing"
    : "Join riff";

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
        <BackButton
          href={`/clubs/${riff.clubId}`}
          label={`Back to ${riff.club.name}`}
        />
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
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#000000",
                  margin: 0,
                }}
              >
                {riff.title}
              </h1>
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
            </div>

            {/* Admin actions */}
            {isAdmin && (riff.status === "ACTIVE" || riff.status === "DRAFT") && (
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setIsEditModalOpen(true)}
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
                    e.currentTarget.style.borderColor = "#000000";
                    e.currentTarget.style.color = "#000000";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E6E6E6";
                    e.currentTarget.style.color = "#808080";
                  }}
                >
                  Edit
                </button>
                {riff.status === "DRAFT" && (
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
                )}
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

            {/* Participants */}
            {riff.participants.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {submittedUsers.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      height: "32px",
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
                      Submitted
                    </p>
                    <AvatarStack
                      users={submittedUsers.slice(0, 5).map((p) => p.user)}
                      size={32}
                      showBorder={false}
                      onAvatarClick={handleAvatarClick}
                    />
                  </div>
                )}
                {waitingUsers.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      height: "32px",
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
                      Waiting for
                    </p>
                    <AvatarStack
                      users={waitingUsers.slice(0, 5).map((p) => p.user)}
                      size={32}
                      showBorder={false}
                      onAvatarClick={handleAvatarClick}
                    />
                  </div>
                )}
                {!isJoined && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      height: "32px",
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
                      Joined by
                    </p>
                    <AvatarStack
                      users={riff.participants.slice(0, 5).map((p) => p.user)}
                      size={32}
                      showBorder={false}
                      onAvatarClick={handleAvatarClick}
                    />
                  </div>
                )}
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
            {(isPastDeadline || canRevealNoDeadline) && isAdmin && riff.status === "ACTIVE" ? (
              <button
                onClick={handleRevealClick}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                style={{
                  backgroundColor: isButtonHovered ? "#00FF66" : "#FFFFFF",
                  border: "2px solid #000000",
                  boxShadow: isButtonHovered
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
              <button
                onClick={handleButtonClick}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                style={{
                  backgroundColor: isButtonHovered ? "#00FF66" : "#FFFFFF",
                  border: "2px solid #000000",
                  boxShadow: isButtonHovered
                    ? "8px 8px 0px 0px #000000"
                    : isJoined
                      ? "8px 8px 0px 0px #00FF66"
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
                {buttonLabel}
              </button>
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
                    router.push(
                      `/read/${pieceRiff.piece.id}?riff=${riff.id}`
                    )
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for non-revealed riffs */}
        {riff.status !== "REVEALED" && (
          <div
            style={{
              marginTop: "48px",
              padding: "40px",
              backgroundColor: "#F9F9F9",
              border: "2px dashed #E6E6E6",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#959595",
                margin: 0,
              }}
            >
              More riff details coming soon.
            </p>
          </div>
        )}
      </div>

      {/* Reveal Confirm Modal (for riff detail page) */}
      <RevealConfirmModal
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
        onConfirm={handleRevealConfirm}
        isRevealing={isRevealing}
        riffTitle={riff.title}
        waitingUsers={riff.participants
          .filter(
            (p) =>
              !riff.pieces.some(
                (piece) => piece.piece.authorId === p.user.id
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
              (piece) => piece.piece.authorId === p.user.id
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
          riffTitle={riff.title}
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
