"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarStack from "@/components/shared/AvatarStack";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import {
  getRiffDisplayTitle,
  allPiecesSubmitted,
  isPastDeadline,
} from "@/lib/riff-utils";
import RiffCTAButton from "@/components/riffs/RiffCTAButton";
import RevealRiffButton, {
  shouldShowReveal,
} from "@/components/riffs/RevealRiffButton";

interface RiffEventCardProps {
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
  club: {
    name: string;
    bannerImage: string | null;
  };
  isJoined: boolean;
  hasDraft: boolean;
  hasSubmitted: boolean;
  currentUserId: string;
  isAdmin: boolean;
  onJoin?: () => void;
  onReveal?: () => void;
  predictedVolumeNumber?: number;
}

export default function RiffEventCard({
  riff,
  club,
  isJoined,
  hasDraft,
  hasSubmitted,
  currentUserId,
  isAdmin,
  onJoin,
  onReveal,
  predictedVolumeNumber,
}: RiffEventCardProps) {
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

  const myPiece =
    riff.pieces.find((p) => p.piece.authorId === currentUserId)?.piece ?? null;
  const existingPieceId = myPiece?.id ?? null;

  const handleRevealClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReveal?.();
  };

  const deadlineDate = riff.deadline ? new Date(riff.deadline) : null;
  const badgeMonth = deadlineDate
    ?.toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const badgeDay = deadlineDate?.getDate();

  const hasBanner = !!club.bannerImage;
  const textColor = hasBanner ? "#FFFFFF" : "#000000";
  const mutedTextColor = hasBanner ? "rgba(255, 255, 255, 0.75)" : "#808080";
  const avatarBorderColor = hasBanner ? "#FFFFFF" : "#000000";

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      className="riff-event-card"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        border: "2px solid #000000",
        cursor: "pointer",
        overflow: "hidden",
        minHeight: "240px",
        backgroundColor: "#FFFFFF",
        boxShadow: isCardHovered
          ? "8px 8px 0px 0px #01EFFC"
          : "8px 8px 0px 0px #000000",
        transition: "box-shadow 0.1s ease",
      }}
    >
      {/* Background — club banner, or the flat fallback showing through */}
      {club.bannerImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${club.bannerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: isCardHovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.2s ease",
          }}
        />
      )}

      {/* Dark scrim so overlaid content stays legible over the photo */}
      {hasBanner && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Content — overlaid directly on the image */}
      <div
        className="riff-event-card-content"
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "16px",
          padding: "20px 24px",
        }}
      >
        {/* Top row — date badge + riff title/club name */}
        <div
          className="riff-event-card-top"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            minWidth: 0,
          }}
        >
          {deadlineDate && (
            <div
              style={{
                flexShrink: 0,
                backgroundColor: "#FFFFFF",
                border: "2px solid #000000",
                boxShadow: "2px 2px 0px 0px #000000",
                overflow: "hidden",
              }}
            >
              <div style={{ height: "4px", backgroundColor: "#DC2626" }} />
              <div
                style={{
                  padding: "6px 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#808080",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {badgeMonth}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "22px",
                    fontWeight: 400,
                    color: "#000000",
                  }}
                >
                  {badgeDay}
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: 0,
              marginTop: "-3px",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "24px",
                fontWeight: 400,
                lineHeight: "normal",
                color: textColor,
                margin: 0,
              }}
            >
              {getRiffDisplayTitle(riff, predictedVolumeNumber)}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                lineHeight: "normal",
                color: mutedTextColor,
                margin: 0,
              }}
            >
              {club.name}
            </p>
            {!riff.deadline && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: mutedTextColor,
                  margin: 0,
                }}
              >
                No deadline
              </p>
            )}
          </div>
        </div>

        {/* Bottom row — joined by (left), progress + CTA (right) */}
        <div
          className="riff-event-card-footer"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {riff.participants.length > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
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
                  fontSize: "14px",
                  fontWeight: 300,
                  lineHeight: "normal",
                  color: textColor,
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
                  borderColor={avatarBorderColor}
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
                      border: `2px solid ${avatarBorderColor}`,
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
          ) : (
            <div />
          )}

          <div
            className="riff-event-card-right"
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "8px",
            }}
          >
            {riff.status !== "REVEALED" && (
              <div
                className="riff-event-card-progress"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                }}
              >
                {hasSubmitted ? (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="11"
                        stroke={textColor}
                        strokeWidth="2"
                      />
                      <path
                        d="M7 12.5L10.5 16L17 8.5"
                        stroke={textColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "11px",
                        fontWeight: 700,
                        lineHeight: "normal",
                        color: mutedTextColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        margin: 0,
                      }}
                    >
                      Submitted
                    </p>
                  </>
                ) : hasDraft && myPiece ? (
                  <div
                    className="riff-event-card-progress-line"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "2px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "28px",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: textColor,
                        margin: 0,
                      }}
                    >
                      {myPiece.wordCount}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "11px",
                        fontWeight: 700,
                        lineHeight: "normal",
                        color: mutedTextColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        margin: 0,
                      }}
                    >
                      Words written
                    </p>
                  </div>
                ) : (
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "14px",
                      fontWeight: 300,
                      lineHeight: "normal",
                      color: mutedTextColor,
                      margin: 0,
                    }}
                  >
                    Not started
                  </p>
                )}
              </div>
            )}

            <div className="riff-event-card-cta" style={{ flexShrink: 0 }}>
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
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .riff-event-card-progress {
            position: absolute;
            top: 20px;
            right: 24px;
          }
        }
        @media (max-width: 767px) {
          .riff-event-card-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 20px !important;
          }
          .riff-event-card-right {
            align-items: center !important;
          }
          .riff-event-card-progress {
            align-items: center !important;
          }
          .riff-event-card-progress-line {
            flex-direction: row !important;
            align-items: baseline !important;
            gap: 6px !important;
          }
          .riff-event-card-cta {
            width: 100% !important;
          }
          .riff-event-card-cta button {
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
