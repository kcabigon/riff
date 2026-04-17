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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [makePrivateHovered, setMakePrivateHovered] = useState(false);

  const isPublic = share !== null;

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

  const handleMakePrivate = async () => {
    if (!share) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}/shares/${share.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to make private.");
        return;
      }
      setShare(null);
      onShareRevoked();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const footer = !isRevealed ? null : isPublic ? (
    <button
      onClick={handleMakePrivate}
      disabled={loading}
      onMouseEnter={() => {
        if (!loading) setMakePrivateHovered(true);
      }}
      onMouseLeave={() => setMakePrivateHovered(false)}
      style={{
        width: "100%",
        backgroundColor: loading
          ? "#FFFFFF"
          : makePrivateHovered
            ? "#000000"
            : "#FFFFFF",
        border: loading ? "2px solid #9C9C9C" : "2px solid #000000",
        boxShadow: loading
          ? "none"
          : makePrivateHovered
            ? "8px 8px 0px 0px #000000"
            : "8px 8px 0px 0px #000000",
        padding: "12px 48px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "16px",
        fontWeight: 300,
        color: loading ? "#9C9C9C" : makePrivateHovered ? "#FFFFFF" : "#000000",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "none",
      }}
    >
      {loading ? "Saving…" : "Make private"}
    </button>
  ) : (
    <PrimaryButton onClick={handleMakePublic} loading={loading}>
      Make public
    </PrimaryButton>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Piece access"
      size="sm"
      footer={footer}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Current access state */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#000000",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: 0,
            }}
          >
            Current access
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              border: "2px solid #000000",
              padding: "16px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: isPublic ? "#00FF66" : "#9C9C9C",
                border: "2px solid #000000",
                flexShrink: 0,
                marginTop: "4px",
              }}
            />
            <div>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#000000",
                  margin: "0 0 4px 0",
                }}
              >
                {isPublic ? "Public" : "Private"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {isPublic
                  ? "Anyone with the link can read this piece — no login required."
                  : isRevealed
                    ? "Only members of your club can view this piece."
                    : "This piece hasn't been revealed yet and can't be shared publicly."}
              </p>
            </div>
          </div>
        </div>

        {/* Public URL — shown when public */}
        {isPublic && (
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
                color: "#000000",
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
                color: "#000000",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                whiteSpace: "nowrap",
                flexShrink: 0,
                opacity: copied ? 0.5 : 1,
              }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        )}

        {/* Error */}
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
