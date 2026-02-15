"use client";

import { useState } from "react";
import AvatarStack from "@/components/shared/AvatarStack";

interface RevealConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRevealing: boolean;
  riffTitle: string;
  waitingUsers: Array<{
    id: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
  submittedCount: number;
  totalParticipants: number;
}

export default function RevealConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isRevealing,
  riffTitle,
  waitingUsers,
  submittedCount,
  totalParticipants,
}: RevealConfirmModalProps) {
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: "8px 8px 0px 0px #000000",
          padding: "40px",
          width: "480px",
          maxWidth: "90vw",
          zIndex: 101,
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "24px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 24px 0",
          }}
        >
          Reveal pieces?
        </h2>

        {/* Summary */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            margin: "0 0 20px 0",
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 700 }}>{submittedCount}</span> of{" "}
          <span style={{ fontWeight: 700 }}>{totalParticipants}</span> members
          have submitted to &ldquo;{riffTitle}&rdquo;.
        </p>

        {/* Waiting users */}
        {waitingUsers.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#808080",
                margin: "0 0 8px 0",
              }}
            >
              Still writing:
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <AvatarStack
                users={waitingUsers.map((u) => ({
                  ...u,
                  username: null,
                }))}
                size={32}
                showBorder={false}
              />
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
                {waitingUsers
                  .map((u) => u.name || "Unknown")
                  .join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Warning */}
        {waitingUsers.length > 0 && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#FF4444",
              margin: "0 0 24px 0",
              lineHeight: 1.5,
            }}
          >
            Members who haven&apos;t submitted won&apos;t be included.
          </p>
        )}

        {/* Confirm button */}
        <button
          onClick={onConfirm}
          disabled={isRevealing}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          style={{
            backgroundColor: isRevealing
              ? "#E6E6E6"
              : isButtonHovered
                ? "#00FF66"
                : "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: isRevealing
              ? "none"
              : isButtonHovered
                ? "8px 8px 0px 0px #000000"
                : "8px 8px 0px 0px #01EFFC",
            padding: "12px 48px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            cursor: isRevealing ? "not-allowed" : "pointer",
            transition: "none",
            width: "100%",
            marginBottom: "16px",
          }}
        >
          {isRevealing ? "Revealing..." : "Reveal pieces"}
        </button>

        {/* Cancel */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#808080",
              padding: "4px",
              textDecoration: "underline",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
