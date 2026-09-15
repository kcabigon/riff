"use client";

import PieceConfirmModal from "./PieceConfirmModal";

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
  };
  riff: {
    id: string;
    clubName: string;
  };
}

export default function SubmitConfirmModal({
  submitDisabled = false,
  riff,
  ...props
}: SubmitConfirmModalProps) {
  return (
    <PieceConfirmModal
      {...props}
      title="Submit your piece"
      actionLabel="Submit"
      doneLabel="Submitted"
      disabled={submitDisabled}
      note={
        <>
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
        </>
      }
    />
  );
}
