"use client";

import Modal from "@/components/shared/Modal";
import ShareLinkOptions from "@/components/shared/ShareLinkOptions";

interface InvitePieceModalProps {
  pieceId: string;
  pieceTitle: string | null;
  onClose: () => void;
  /** Present only when reached from a picker (InviteFriendModal with >1
   * eligible piece) — lets the user go back to that list instead of just
   * closing outright. */
  onBack?: () => void;
}

// The "invite a specific friend via this piece" screen — shared between
// InviteFriendModal (My Riffs "+" tile, piece already picked) and ShareModal
// (already scoped to one piece, no picker needed at all).
export default function InvitePieceModal({
  pieceId,
  pieceTitle,
  onClose,
  onBack,
}: InvitePieceModalProps) {
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pieces/${pieceId}/join`
      : `/pieces/${pieceId}/join`;

  return (
    <Modal isOpen onClose={onClose} title={pieceTitle || "Untitled"} size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Share this piece to add Friends. Once they accept, they can read and
          comment on this piece, and all your other pieces by default.
        </p>
        <ShareLinkOptions url={joinUrl} shareText="Let's riff!" />
        {onBack && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={onBack}
              style={{
                backgroundColor: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                padding: "4px 12px",
                textDecoration: "underline",
              }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
