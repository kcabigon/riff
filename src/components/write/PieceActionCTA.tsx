"use client";

import CTAButton from "@/components/CTAButton";

interface PieceActionCTAProps {
  isDone: boolean;
  label: string;
  isMobile: boolean;
  onOpenModal: () => void;
}

// Shared by the Submit and Publish CTAs in WritePage — a grey "Cover" button
// once done, otherwise a green-shadowed CTA that opens the confirm modal.
export default function PieceActionCTA({
  isDone,
  label,
  isMobile,
  onOpenModal,
}: PieceActionCTAProps) {
  if (isDone) {
    return (
      <button
        onClick={onOpenModal}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#F5F5F5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#FFFFFF";
        }}
        style={{
          padding: isMobile ? "6px 10px" : "8px 16px",
          fontSize: isMobile ? "11px" : "12px",
          fontFamily: "var(--font-dm-sans)",
          fontWeight: 300,
          color: "#000000",
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: "none",
          cursor: "pointer",
        }}
      >
        Cover
      </button>
    );
  }

  return (
    <CTAButton
      onClick={onOpenModal}
      style={{
        padding: isMobile ? "8px 24px" : "10px 32px",
        fontSize: "12px",
        boxShadow: "4px 4px 0px 0px #00FF66",
      }}
    >
      {label}
    </CTAButton>
  );
}
