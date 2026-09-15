"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/shared/Modal";
import InvitePieceModal from "@/components/shared/InvitePieceModal";

interface EligiblePiece {
  id: string;
  title: string | null;
}

interface InviteFriendModalProps {
  onClose: () => void;
}

const INITIAL_VISIBLE = 3;

// Entry point from the My Riffs Friends row "+" tile — invites always go
// through a piece, so this picks one first (the tile itself only shows
// once there's an eligible piece — see FriendsRow's canInvite prop). Once a
// piece is picked (or auto-picked, if there's only one), hands off to the
// shared InvitePieceModal — same screen ShareModal opens directly since it
// already knows its piece.
export default function InviteFriendModal({ onClose }: InviteFriendModalProps) {
  const [pieces, setPieces] = useState<EligiblePiece[] | null>(null);
  const [selected, setSelected] = useState<EligiblePiece | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    fetch("/api/pieces?revealed=true")
      .then((res) => res.json())
      .then((data) => {
        const eligible: EligiblePiece[] = data.pieces ?? [];
        setPieces(eligible);
        // Exactly one option — skip the picker, there's nothing to choose.
        if (eligible.length === 1) setSelected(eligible[0]);
      })
      .catch(() => {
        setError("Couldn't load your pieces. Please try again.");
        setPieces([]);
      });
  }, []);

  if (selected) {
    return (
      <InvitePieceModal
        pieceId={selected.id}
        pieceTitle={selected.title}
        onClose={onClose}
        onBack={
          pieces && pieces.length > 1 ? () => setSelected(null) : undefined
        }
      />
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Share a piece to invite friends"
      size="sm"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {pieces === null && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {["60%", "75%", "45%"].map((width) => (
              <div
                key={width}
                style={{
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #000000",
                  boxShadow: "8px 8px 0px 0px #000000",
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    width,
                    height: "18px",
                    backgroundColor: "#E6E6E6",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {error && <p style={errorTextStyle}>{error}</p>}

        {pieces && pieces.length === 0 && !error && (
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
            Nothing to invite with right now — refresh and try again.
          </p>
        )}

        {pieces && pieces.length > 1 && (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                maxHeight: "300px",
                overflowY: "auto",
                padding: "0 8px 8px 0",
              }}
            >
              {pieces.slice(0, visibleCount).map((piece) => (
                <button
                  key={piece.id}
                  onClick={() => setSelected(piece)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "8px 8px 0px 0px #000000";
                  }}
                  style={{
                    display: "flex",
                    width: "100%",
                    textAlign: "left",
                    background: "#FFFFFF",
                    border: "2px solid #000000",
                    boxShadow: "8px 8px 0px 0px #000000",
                    padding: "12px 16px",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "18px",
                      fontWeight: 400,
                      lineHeight: 1.3,
                      color: "#000000",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                  >
                    {piece.title || "Untitled"}
                  </span>
                </button>
              ))}
            </div>

            {visibleCount < pieces.length && (
              <button
                onClick={() => setVisibleCount(pieces.length)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#000000",
                  padding: 0,
                  marginTop: "8px",
                  textDecoration: "underline",
                  alignSelf: "center",
                }}
              >
                Load more ({pieces.length - visibleCount})
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

const errorTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "12px",
  fontWeight: 300,
  color: "#DC2626",
  margin: 0,
};
