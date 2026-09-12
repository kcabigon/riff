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

// Entry point from the My Riffs Friends row "+" tile — invites always go
// through a piece (see ShareModal's "Invite a friend" for the same flow
// triggered from a specific piece's 3-dot menu), so this picks one first.
export default function InviteFriendModal({ onClose }: InviteFriendModalProps) {
  const [pieces, setPieces] = useState<EligiblePiece[] | null>(null);
  const [selected, setSelected] = useState<EligiblePiece | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pieces?revealed=true")
      .then((res) => res.json())
      .then((data) => setPieces(data.pieces ?? []))
      .catch(() => setError("Couldn't load your pieces. Please try again."));
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
      title={selected ? selected.title || "Untitled" : "Invite a friend"}
      size="sm"
    >
      {selected ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Share this piece with one person — once they join, you&apos;re
            Friends, with access to everything you write.
          </p>
          <ShareLinkOptions
            url={joinUrl}
            shareText="I want you to read this on Riff!"
          />
        </div>
      ) : pieces === null ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          Loading your pieces…
        </p>
      ) : error ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#DC2626",
            margin: 0,
          }}
        >
          {error}
        </p>
      ) : pieces.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          You don&apos;t have a revealed piece yet — publish or submit one to a
          riff first, then come back to invite someone with it.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              margin: "0 0 4px 0",
            }}
          >
            Which piece do you want to invite them with?
          </p>
          {pieces.map((piece) => (
            <button
              key={piece.id}
              onClick={() => setSelected(piece)}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                border: "2px solid #CCCCCC",
                backgroundColor: "#FFFFFF",
                padding: "12px 16px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              {piece.title || "Untitled"}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
