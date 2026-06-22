"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "./CountdownTimer";
import AvatarStack from "@/components/shared/AvatarStack";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import {
  getRiffDisplayTitle,
  allPiecesSubmitted,
  isPastDeadline,
  formatDateLong,
} from "@/lib/riff-utils";
import RiffCTAButton from "@/components/riffs/RiffCTAButton";
import RevealRiffButton, {
  shouldShowReveal,
} from "@/components/riffs/RevealRiffButton";

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
      submittedAt: Date | string | null;
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
  predictedVolumeNumber?: number;
  clubName?: string;
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
  predictedVolumeNumber,
  clubName,
}: RiffCardProps) {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const router = useRouter();
  const handleAvatarClick = useProfileNavigation();
  const deadlinePassed = isPastDeadline(riff.deadline ?? null);
  const piecesAllSubmitted = allPiecesSubmitted(
    riff.pieces,
    riff.participants.length
  );

  const handleCardClick = () => {
    router.push(`/riffs/${riff.id}`);
  };

  const MAX_AVATARS = 10;
  const overflowCount = Math.max(0, riff.participants.length - MAX_AVATARS);

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
          {/* Club badge */}
          {clubName && (
            <span
              style={{
                display: "inline-block",
                alignSelf: "flex-start",
                backgroundColor: "#EECF01",
                color: "#000000",
                border: "2px solid #000000",
                padding: "2px 6px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                marginBottom: "4px",
              }}
            >
              {clubName}
            </span>
          )}
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
            {getRiffDisplayTitle(riff, predictedVolumeNumber)}
          </h3>

          {/* Date/Deadline */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: "normal",
              color: deadlinePassed ? "#DC2626" : "#808080",
              margin: 0,
            }}
          >
            {deadlinePassed
              ? "Deadline passed"
              : riff.deadline
                ? `Deadline: ${formatDateLong(riff.deadline)}`
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
              className={
                riff.participants.length > 5
                  ? "riff-joined-by-mobile-hidden"
                  : ""
              }
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
            <div style={{ display: "flex", alignItems: "center" }}>
              <AvatarStack
                users={riff.participants
                  .slice(0, MAX_AVATARS)
                  .map((p) => p.user)}
                size={32}
                onAvatarClick={handleAvatarClick}
                style={overflowCount > 0 ? { paddingRight: 0 } : undefined}
              />
              {overflowCount > 0 && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 64,
                    backgroundColor: "#E6E6E6",
                    border: "2px solid #000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "-4px",
                    zIndex: MAX_AVATARS,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#000000",
                      lineHeight: 1,
                    }}
                  >
                    +{overflowCount}
                  </span>
                </div>
              )}
            </div>
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
        {shouldShowReveal({
          deadlinePassed,
          isJoined,
          hasSubmitted,
          piecesAllSubmitted,
          isAdmin,
          status: riff.status,
        }) ? (
          <RevealRiffButton onClick={handleRevealClick} />
        ) : riff.status !== "REVEALED" ? (
          <RiffCTAButton
            riffId={riff.id}
            isJoined={isJoined}
            hasDraft={hasDraft}
            hasSubmitted={hasSubmitted}
            existingPieceId={existingPieceId}
            onJoin={onJoin}
            stopPropagation
          />
        ) : null}

        {/* Countdown Timer or Time's up */}
        {isJoined &&
          riff.deadline &&
          !deadlinePassed &&
          riff.status !== "REVEALED" && (
            <CountdownTimer deadline={new Date(riff.deadline)} />
          )}
        {deadlinePassed && riff.deadline && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 700,
              color: "#DC2626",
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
          .riff-joined-by-mobile-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
