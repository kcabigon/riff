"use client";

import Image from "next/image";
import Modal from "@/components/shared/Modal";
import CTAButton from "@/components/CTAButton";
import { TUTORIAL_PIECE } from "@/lib/tutorial";

interface TutorialCoverImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function TutorialCoverImageModal({
  isOpen,
  onClose,
  onSave,
}: TutorialCoverImageModalProps) {
  const footer = (
    <CTAButton onClick={onSave} accentColor="#955CB5" style={{ width: "100%" }}>
      Use this image
    </CTAButton>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cover image"
      size="md"
      footer={footer}
    >
      <div
        style={{
          position: "relative",
          width: "260px",
          aspectRatio: "4 / 5",
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        <Image
          src={TUTORIAL_PIECE.coverImage}
          alt="Cover image"
          fill
          sizes="260px"
          style={{ objectFit: "cover" }}
        />
      </div>
    </Modal>
  );
}
