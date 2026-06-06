"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import PieceCard from "@/components/riffs/PieceCard";
import PrimaryButton from "@/components/PrimaryButton";

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
    title: string | null;
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
        {piece.coverImage && (
          <button
            onClick={onCoverAction}
            disabled={isSubmitting}
            aria-label="Remove cover image"
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              border: "2px solid #000000",
              cursor: "pointer",
              padding: "2px 6px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            Remove
          </button>
        )}
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
