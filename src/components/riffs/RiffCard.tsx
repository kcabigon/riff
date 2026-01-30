"use client";

import { useState } from "react";
import CountdownTimer from "./CountdownTimer";
import AvatarStack from "@/components/shared/AvatarStack";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";

interface RiffCardProps {
  riff: {
    id: string;
    title: string;
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
}

export default function RiffCard({
  riff,
  isJoined,
  hasSubmitted,
  currentUserId,
}: RiffCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const handleAvatarClick = useProfileNavigation();

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

  const handleJoinRiff = async () => {
    console.log("Joining riff:", riff.id);
    // TODO: Call API to join riff
  };

  const handleContinueWriting = () => {
    console.log("Continue writing for riff:", riff.id);
    // TODO: Navigate to editor
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        padding: "32px",
        display: "flex",
        flexDirection: "row",
        gap: "40px",
        alignItems: "center",
        justifyContent: "space-between",
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
            {riff.title}
          </h3>

          {/* Date/Deadline */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: "normal",
              color: "#808080",
              margin: 0,
            }}
          >
            {isJoined && riff.deadline
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

        {/* Countdown Timer (only for joined riffs with deadline) */}
        {isJoined && riff.deadline && (
          <CountdownTimer deadline={new Date(riff.deadline)} />
        )}
      </div>
    </div>
  );
}
