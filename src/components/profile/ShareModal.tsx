"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";

export interface PublicShare {
  id: string;
  shareType: "PUBLIC";
  isPublic: boolean;
}

interface ShareModalProps {
  pieceId: string;
  isRevealed: boolean;
  existingShare: PublicShare | null;
  onClose: () => void;
  onShareCreated: (share: PublicShare) => void;
  onShareRevoked: () => void;
}

export default function ShareModal({
  pieceId,
  isRevealed,
  existingShare,
  onClose,
  onShareCreated,
  onShareRevoked,
}: ShareModalProps) {
  const [share, setShare] = useState<PublicShare | null>(existingShare);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${pieceId}`
      : `/p/${pieceId}`;

  const handleMakePublic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareType: "PUBLIC" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to make public.");
        return;
      }
      setShare(data.share);
      onShareCreated(data.share);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!share) return;
    setRevoking(true);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}/shares/${share.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to revoke.");
        return;
      }
      setShare(null);
      onShareRevoked();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen onClose={onClose} title="Share publicly" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {!isRevealed && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Only revealed pieces can be shared publicly. Submit this piece to a
            riff and wait for the reveal.
          </p>
        )}

        {isRevealed && !share && (
          <>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Generate a public link anyone can use to read this piece — no
              login required.
            </p>
            <PrimaryButton onClick={handleMakePublic} loading={loading}>
              Make public
            </PrimaryButton>
          </>
        )}

        {isRevealed && share && (
          <>
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
                Public link
              </p>
              <div
                style={{
                  border: "2px solid #000000",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#808080",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {publicUrl}
                </span>
                <button
                  onClick={handleCopy}
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: copied ? "#808080" : "#000000",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #E6E6E6",
                paddingTop: "16px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: "0 0 12px 0",
                  lineHeight: 1.5,
                }}
              >
                Revoking the link will make this piece private again. Anyone
                with the URL will see a 404.
              </p>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: revoking ? "#9C9C9C" : "#DC2626",
                  background: "none",
                  border: "none",
                  cursor: revoking ? "not-allowed" : "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                {revoking ? "Revoking…" : "Revoke link"}
              </button>
            </div>
          </>
        )}

        {error && (
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
        )}
      </div>
    </Modal>
  );
}
