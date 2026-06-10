"use client";

import Modal from "@/components/shared/Modal";
import PieceCard from "@/components/riffs/PieceCard";
import CTAButton from "@/components/CTAButton";
import { TUTORIAL_PIECE } from "@/lib/tutorial";

interface TutorialSubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TutorialSubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: TutorialSubmitConfirmModalProps) {
  const footer = (
    <CTAButton
      onClick={onConfirm}
      accentColor="#955CB5"
      style={{ width: "100%" }}
    >
      Submit
    </CTAButton>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit your piece"
      size="md"
      footer={footer}
    >
      {/* PieceCard preview */}
      <div style={{ width: "260px", margin: "0 auto 24px" }}>
        <PieceCard
          piece={{
            id: TUTORIAL_PIECE.id,
            title: TUTORIAL_PIECE.title,
            coverImage: TUTORIAL_PIECE.coverImage,
            currentContent: "",
          }}
          isRead={true}
          onClick={() => {}}
        />
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
            Learn to riff
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
