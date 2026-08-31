"use client";

import PieceConfirmModal from "./PieceConfirmModal";

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onCoverAction: () => void;
  publishDisabled?: boolean;
  piece: {
    id: string;
    title: string;
    coverImage: string | null;
  };
}

export default function PublishConfirmModal({
  publishDisabled = false,
  ...props
}: PublishConfirmModalProps) {
  return (
    <PieceConfirmModal
      {...props}
      title="Publish your piece"
      actionLabel="Publish"
      doneLabel="Published"
      disabled={publishDisabled}
      note={
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          This piece will appear on your profile once published. You can edit it
          anytime.
        </p>
      }
    />
  );
}
