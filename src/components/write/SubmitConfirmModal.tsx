"use client";

import { useState } from "react";
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

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onCoverAction: () => void;
  submitDisabled?: boolean;
  piece: {
    id: string;
    title: string;
    coverImage: string | null;
    currentContent: string;
  };
  riff: {
    id: string;
    clubName: string;
  };
}

export default function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onCoverAction,
  submitDisabled = false,
  piece,
  riff,
}: SubmitConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <PrimaryButton
      onClick={handleConfirm}
      loading={isSubmitting}
      disabled={submitDisabled}
    >
      {submitDisabled ? "Submitted" : "Submit"}
    </PrimaryButton>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit your piece"
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
            currentContent: piece.currentContent,
          }}
          isRead={true}
          onClick={() => {}}
        />
        <div style={badgeWrapperStyle}>
          {piece.coverImage ? (
            <DestructiveButton
              onClick={onCoverAction}
              disabled={isSubmitting}
              aria-label="Remove cover image"
              style={badgeButtonStyle}
            >
              Remove
            </DestructiveButton>
          ) : (
            <PrimaryButton
              size="sm"
              onClick={onCoverAction}
              disabled={isSubmitting}
              aria-label="Add cover image"
              style={badgeButtonStyle}
            >
              Add cover
            </PrimaryButton>
          )}
        </div>
      </div>

      {/* Riff context + reveal note */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#FFFFFF",
            padding: "4px 8px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 700,
              color: "#000000",
              margin: "0 0 4px",
            }}
          >
            {riff.clubName}
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
            }}
          >
            Club members can&apos;t read your piece until the riff reveal. You
            can edit your piece or cover image anytime.
          </p>
        </div>
      </div>
    </Modal>
  );
}
