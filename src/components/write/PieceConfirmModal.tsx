"use client";

import { useState, type ReactNode } from "react";
import Modal from "@/components/shared/Modal";
import PieceCard from "@/components/riffs/PieceCard";
import PrimaryButton from "@/components/PrimaryButton";
import DestructiveButton from "@/components/DestructiveButton";

const badgeWrapperStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "12px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 10,
};

const badgeButtonStyle: React.CSSProperties = {
  height: "auto",
  padding: "2px 6px",
  fontSize: "11px",
};

interface PieceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onCoverAction: () => void;
  title: string;
  actionLabel: string;
  doneLabel: string;
  disabled?: boolean;
  piece: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  note: ReactNode;
}

// Shared by SubmitConfirmModal and PublishConfirmModal — same PieceCard
// preview + cover badge + confirm footer, just different title/labels/note.
export default function PieceConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onCoverAction,
  title,
  actionLabel,
  doneLabel,
  disabled = false,
  piece,
  note,
}: PieceConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const footer = (
    <PrimaryButton
      onClick={handleConfirm}
      loading={isConfirming}
      disabled={disabled}
    >
      {disabled ? doneLabel : actionLabel}
    </PrimaryButton>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={footer}
    >
      {/* PieceCard preview with remove-cover X overlay */}
      <div
        style={{
          position: "relative",
          width: "260px",
          margin: "0 auto 24px",
        }}
      >
        <PieceCard
          piece={{
            id: piece.id,
            title: piece.title || "Untitled",
            coverImage: piece.coverImage,
          }}
          isRead={true}
          onClick={() => {}}
        />
        <div style={badgeWrapperStyle}>
          {piece.coverImage ? (
            <DestructiveButton
              onClick={onCoverAction}
              disabled={isConfirming}
              aria-label="Remove cover image"
              style={badgeButtonStyle}
            >
              Remove
            </DestructiveButton>
          ) : (
            <PrimaryButton
              size="sm"
              onClick={onCoverAction}
              disabled={isConfirming}
              aria-label="Add cover image"
              style={badgeButtonStyle}
            >
              Add cover
            </PrimaryButton>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#FFFFFF",
            padding: "4px 8px",
            textAlign: "center",
          }}
        >
          {note}
        </div>
      </div>
    </Modal>
  );
}
