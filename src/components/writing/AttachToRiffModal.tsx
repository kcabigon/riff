"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";

interface ActiveRiff {
  id: string;
  title: string | null;
  volume: number;
  club: { id: string; name: string };
}

interface CurrentAttachment {
  riffId: string;
  submittedAt: string | null;
  riff: {
    title: string | null;
    volume: number;
    status: string;
    club: { name: string };
  };
}

interface AttachToRiffModalProps {
  pieceId: string;
  activeRiffs: ActiveRiff[];
  alreadyAttachedRiffIds: string[];
  currentAttachments?: CurrentAttachment[];
  onClose: () => void;
  onAttached: (riff: ActiveRiff) => void;
}

export default function AttachToRiffModal({
  pieceId,
  activeRiffs,
  alreadyAttachedRiffIds,
  currentAttachments = [],
  onClose,
  onAttached,
}: AttachToRiffModalProps) {
  const [isAttaching, setIsAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibleRiffs = activeRiffs.filter(
    (r) => !alreadyAttachedRiffIds.includes(r.id)
  );

  const handleAttach = async (riff: ActiveRiff) => {
    setIsAttaching(true);
    setError(null);
    try {
      const res = await fetch(`/api/riffs/${riff.id}/pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to attach draft.");
        return;
      }

      onAttached(riff);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsAttaching(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Attach to Riff" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Available riffs */}
        {eligibleRiffs.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            No active riffs available to attach to.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {eligibleRiffs.map((riff) => (
              <button
                key={riff.id}
                onClick={() => handleAttach(riff)}
                disabled={isAttaching}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  border: "2px solid #000000",
                  backgroundColor: "#FFFFFF",
                  padding: "12px 16px",
                  cursor: isAttaching ? "not-allowed" : "pointer",
                  textAlign: "left",
                  width: "100%",
                  opacity: isAttaching ? 0.6 : 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "15px",
                    fontWeight: 300,
                    color: "#000000",
                  }}
                >
                  {riff.title || `Riff Vol. ${riff.volume}`}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#808080",
                  }}
                >
                  {riff.club.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Currently attached */}
        {currentAttachments.length > 0 && (
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "11px",
                fontWeight: 700,
                color: "#808080",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 8px 0",
              }}
            >
              Currently Attached
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {currentAttachments.map((a) => {
                const isSubmitted =
                  a.submittedAt !== null || a.riff.status === "REVEALED";
                const riffLabel = a.riff.title || `Vol. ${a.riff.volume}`;
                return (
                  <span
                    key={a.riffId}
                    title={isSubmitted ? "Submitted" : "Attached"}
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#000000",
                      backgroundColor: "#00FF66",
                      border: "1px solid #000000",
                      padding: "2px 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {riffLabel} · {a.riff.club.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              fontWeight: 300,
              color: "#DC2626",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
