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
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <PrimaryButton
        onClick={handleConfirm}
        loading={isSubmitting}
        disabled={submitDisabled}
      >
        Submit
      </PrimaryButton>
      <button
        onClick={onCoverAction}
        disabled={isSubmitting}
        style={{
          background: "none",
          border: "none",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          cursor: "pointer",
          padding: "4px",
          textDecoration: "underline",
        }}
      >
        {piece.coverImage ? "Remove cover image" : "Add cover image"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit your piece"
      size="sm"
      footer={footer}
    >
      {/* PieceCard preview */}
      <div style={{ width: "180px", margin: "0 auto 24px" }}>
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
      </div>

      {/* Riff context */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#FFFFFF",
            padding: "2px 8px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 700,
              color: "#000000",
              margin: 0,
              textAlign: "center",
            }}
          >
            {riff.title ? `"${riff.title}"` : "Active Riff"} · {riff.clubName}
          </p>
        </div>
      </div>

      {/* Reveal note */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#FFFFFF",
            padding: "2px 8px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
              textAlign: "center",
            }}
          >
            Club members won&apos;t see your piece until the host reveals the
            riff.
          </p>
        </div>
      </div>
    </Modal>
  );
}
