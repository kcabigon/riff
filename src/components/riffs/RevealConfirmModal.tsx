"use client";

import Modal from "@/components/shared/Modal";
import AvatarStack from "@/components/shared/AvatarStack";
import PrimaryButton from "@/components/PrimaryButton";

interface RevealConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRevealing: boolean;
  riffTitle: string | null;
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reveal pieces?" size="sm">
      {/* Summary */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          margin: "0 0 20px",
          lineHeight: 1.5,
        }}
      >
        <span style={{ fontWeight: 700 }}>{submittedCount}</span> of{" "}
        <span style={{ fontWeight: 700 }}>{totalParticipants}</span> members
        have submitted to &ldquo;{riffTitle || "Untitled"}&rdquo;.
      </p>

      {/* Waiting users */}
      {waitingUsers.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              margin: "0 0 8px",
            }}
          >
            Still writing:
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AvatarStack
              users={waitingUsers.map((u) => ({ ...u, username: null }))}
              size={32}
            />
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
              }}
            >
              {waitingUsers.map((u) => u.name || "Unknown").join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Warning */}
      {waitingUsers.length > 0 && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#DC2626",
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          Members who haven&apos;t submitted won&apos;t be included.
        </p>
      )}

      {/* Confirm */}
      <PrimaryButton onClick={onConfirm} loading={isRevealing}>
        {isRevealing ? "Revealing..." : "Reveal pieces"}
      </PrimaryButton>
    </Modal>
  );
}
