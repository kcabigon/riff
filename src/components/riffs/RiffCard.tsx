"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "./CountdownTimer";
import AvatarStack from "@/components/shared/AvatarStack";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import { useDraftCreation } from "@/hooks/useDraftCreation";

interface RiffCardProps {
  riff: {
    id: string;
    title: string | null;
    prompt?: string | null;
    deadline?: Date | null;
    createdAt: Date;
    participants: Array<{
      user: {
        id: string;
        username: string | null;
        name: string | null;
        avatarUrl: string | null;
      };
    }>;
    pieces: Array<{
      piece: {
        id: string;
        authorId: string;
      };
    }>;
  };
  isJoined: boolean;
  hasSubmitted: boolean;
  currentUserId: string;
  isAdmin: boolean;
  onJoin?: () => void;
  onReveal?: () => void;
}

export default function RiffCard({
  riff,
  isJoined,
  hasSubmitted,
  currentUserId,
  isAdmin,
  onJoin,
  onReveal,
}: RiffCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const router = useRouter();
  const handleAvatarClick = useProfileNavigation();
  const { createDraft, isCreating } = useDraftCreation();

  // Deadline detection
  const isPastDeadline = riff.deadline
    ? new Date(riff.deadline).getTime() < Date.now()
    : false;

  // Host can reveal riffs with no deadline if at least 1 piece submitted
  const canRevealNoDeadline =
    !riff.deadline && isAdmin && riff.pieces.length > 0;

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get date range for joined riff
  const getDateRange = () => {
    if (!riff.deadline) return null;
    return `${formatDate(riff.createdAt)} - ${formatDate(riff.deadline)}`;
  };

  // Get submitted and waiting participants
  const submittedUsers = riff.participants.filter((p) =>
    riff.pieces.some((piece) => piece.piece.authorId === p.user.id)
  );

  const waitingUsers = riff.participants.filter(
    (p) => !riff.pieces.some((piece) => piece.piece.authorId === p.user.id)
  );

  const handleCardClick = () => {
    router.push(`/riffs/${riff.id}`);
  };

  const handleJoinRiff = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/riffs/${riff.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok && onJoin) {
        onJoin();
      }
    } catch (err) {
      console.error("Error joining riff:", err);
    }
  };

  const handleContinueWriting = (e: React.MouseEvent) => {
    e.stopPropagation();
    const existingPiece = riff.pieces.find(
      (p) => p.piece.authorId === currentUserId
    );
    if (existingPiece) {
      router.push(`/write/${existingPiece.piece.id}`);
    } else {
      createDraft(riff.id);
    }
  };

  const handleRevealClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReveal?.();
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      className="riff-card"
      style={{
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        padding: "32px",
        display: "flex",
        gap: "40px",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        boxShadow: isCardHovered ? "4px 4px 0px 0px #000000" : "none",
        transition: "box-shadow 0.1s ease",
      }}
    >
      {/* Left Section - Riff Metadata */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          flex: 1,
        }}
      >
        {/* Riff Name & Date */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {/* Title */}
          <h3
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: "normal",
              color: "#000000",
              margin: 0,
            }}
          >
            {riff.title || "Untitled"}
          </h3>

          {/* Date/Deadline */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: "normal",
              color: isPastDeadline ? "#FF4444" : "#808080",
              margin: 0,
            }}
          >
            {isPastDeadline
              ? "Deadline passed"
              : isJoined && riff.deadline
                ? getDateRange()
                : riff.deadline
                  ? `Deadline: ${formatDate(riff.deadline)}`
                  : "No deadline"}
          </p>
        </div>

        {/* Not Joined: Participants Section */}
        {!isJoined && riff.participants.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                lineHeight: 1.6,
                color: "#000000",
                marginBottom: "12px",
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

        {/* Joined: Progress Section */}
        {isJoined && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {/* Submitted Row */}
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
                    lineHeight: "normal",
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

            {/* Waiting For Row */}
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
                    lineHeight: "normal",
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
          </div>
        )}
      </div>

      {/* Right Section - Call-to-Action */}
      <div
        className="riff-card-cta"
        style={{
          minWidth: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
        }}
      >
        {/* Button */}
        {(isPastDeadline || canRevealNoDeadline) && isAdmin ? (
          <button
            onClick={handleRevealClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              backgroundColor: isHovered ? "#00FF66" : "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: isHovered
                ? "8px 8px 0px 0px #000000"
                : "8px 8px 0px 0px #01EFFC",
              padding: "12px 48px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: "normal",
              color: "#000000",
              cursor: "pointer",
              transition: "none",
              whiteSpace: "nowrap",
            }}
          >
            Reveal pieces
          </button>
        ) : isPastDeadline && !isAdmin ? (
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
              lineHeight: "normal",
              color: "#808080",
              cursor: "not-allowed",
              transition: "none",
              whiteSpace: "nowrap",
            }}
          >
            Waiting for the host to reveal
          </button>
        ) : (
          <button
            onClick={isJoined ? handleContinueWriting : handleJoinRiff}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              backgroundColor: isHovered ? "#00FF66" : "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: isHovered
                ? "8px 8px 0px 0px #000000"
                : isJoined
                  ? "8px 8px 0px 0px #00FF66"
                  : "8px 8px 0px 0px #01EFFC",
              padding: "12px 48px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: "normal",
              color: "#000000",
              cursor: "pointer",
              transition: "none",
              whiteSpace: "nowrap",
            }}
          >
            {isJoined
              ? hasSubmitted
                ? "View submission"
                : "Continue writing"
              : "Join riff"}
          </button>
        )}

        {/* Countdown Timer or Time's up */}
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

      <style>{`
        @media (max-width: 767px) {
          .riff-card {
            flex-direction: column !important;
            gap: 24px !important;
            padding: 24px !important;
          }
          .riff-card-cta {
            min-width: 0 !important;
            width: 100% !important;
          }
          .riff-card-cta button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
