"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/shared/Modal";
import ShareLinkOptions from "@/components/shared/ShareLinkOptions";

interface EligiblePiece {
  id: string;
  title: string | null;
}

interface InviteFriendModalProps {
  onClose: () => void;
}

const INITIAL_VISIBLE = 3;

// Entry point from the My Riffs Friends row "+" tile — invites always go
// through a piece (see ShareModal's "Invite a friend" for the same flow
// triggered from a specific piece's 3-dot menu), so this picks one first.
// Loading/list styling mirrors DraftChoiceModal's piece picker. No preview
// text — unlike drafts, a revealed piece always has a real title, which is
// enough to tell pieces apart.
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

  const joinUrl = selected
    ? typeof window !== "undefined"
      ? `${window.location.origin}/pieces/${selected.id}/join`
      : `/pieces/${selected.id}/join`
    : "";

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        selected
          ? selected.title || "Untitled"
          : "Share a piece to invite friends"
      }
      size="sm"
    >
      {selected ? (
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
          <ShareLinkOptions
            url={joinUrl}
            shareText="I want you to read this on Riff!"
          />
          {pieces && pieces.length > 1 && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => setSelected(null)}
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
      ) : (
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
                      e.currentTarget.style.boxShadow =
                        "8px 8px 0px 0px #01EFFC";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        "8px 8px 0px 0px #000000";
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
      )}
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
