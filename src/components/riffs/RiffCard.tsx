"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "./CountdownTimer";
import AvatarStack from "@/components/shared/AvatarStack";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import { getRiffDisplayTitle } from "@/lib/riff-utils";
import RiffCTAButton from "@/components/riffs/RiffCTAButton";

interface RiffCardProps {
  riff: {
    id: string;
    title: string | null;
    volumeNumber?: number | null;
    status: string;
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
      submittedAt?: Date | string | null;
      piece: {
        id: string;
        authorId: string;
        title: string;
        wordCount: number;
      };
    }>;
  };
  isJoined: boolean;
  hasDraft: boolean;
  hasSubmitted: boolean;
  currentUserId: string;
  isAdmin: boolean;
  onJoin?: () => void;
  onReveal?: () => void;
}

export default function RiffCard({
  riff,
  isJoined,
  hasDraft,
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

  // Deadline detection
  const isPastDeadline = riff.deadline
    ? new Date(riff.deadline).getTime() < Date.now()
    : false;

  const allPiecesSubmitted =
    riff.participants.length > 0 &&
    riff.pieces.filter((p) => p.submittedAt).length >= riff.participants.length;

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

  const handleCardClick = () => {
    router.push(`/riffs/${riff.id}`);
  };

  const existingPieceId =
    riff.pieces.find((p) => p.piece.authorId === currentUserId)?.piece.id ??
    null;

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
        boxShadow: isCardHovered
          ? "8px 8px 0px 0px #01EFFC"
          : "8px 8px 0px 0px #000000",
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
            {getRiffDisplayTitle(riff)}
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

        {/* Participants */}
        {riff.participants.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "8px",
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
              Joined by
            </p>
            <AvatarStack
              users={riff.participants.slice(0, 5).map((p) => p.user)}
              size={32}
              onAvatarClick={handleAvatarClick}
            />
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
        {(isPastDeadline || allPiecesSubmitted) && isAdmin ? (
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
            Reveal riff
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
          <RiffCTAButton
            riffId={riff.id}
            isJoined={isJoined}
            hasDraft={hasDraft}
            hasSubmitted={hasSubmitted}
            existingPieceId={existingPieceId}
            onJoin={onJoin}
            stopPropagation
          />
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
