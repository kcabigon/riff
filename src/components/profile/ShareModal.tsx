"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";

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

function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        border: "2px solid #000000",
        backgroundColor: selected ? "#00FF66" : "#FFFFFF",
        flexShrink: 0,
        marginTop: "2px",
      }}
    />
  );
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

  const isPublic = share !== null;

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${pieceId}`
      : `/p/${pieceId}`;

  const handleMakePublic = async () => {
    if (loading || isPublic) return;
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
    if (loading || !share) return;
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

  const publicDisabled = !isRevealed;

  return (
    <Modal isOpen onClose={onClose} title="Piece access" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Private option */}
        <button
          onClick={handleMakePrivate}
          disabled={loading || !isPublic}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            width: "100%",
            border: !isPublic ? "2px solid #000000" : "2px solid #CCCCCC",
            backgroundColor: "#FFFFFF",
            padding: "16px",
            cursor: isPublic && !loading ? "pointer" : "default",
            textAlign: "left",
            boxShadow: !isPublic ? "4px 4px 0px 0px #000000" : "none",
            transition: "none",
          }}
        >
          <SelectionDot selected={!isPublic} />
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
              Private
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
              Only members of your club can view this piece.
            </p>
          </div>
        </button>

        {/* Public option */}
        <button
          onClick={handleMakePublic}
          disabled={loading || isPublic || publicDisabled}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            width: "100%",
            border: isPublic ? "2px solid #000000" : "2px solid #CCCCCC",
            backgroundColor: "#FFFFFF",
            padding: "16px",
            cursor:
              !isPublic && !loading && !publicDisabled ? "pointer" : "default",
            textAlign: "left",
            boxShadow: isPublic ? "4px 4px 0px 0px #000000" : "none",
            opacity: publicDisabled ? 0.45 : 1,
            transition: "none",
          }}
        >
          <SelectionDot selected={isPublic} />
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
              Public
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
              {publicDisabled
                ? "Only revealed pieces can be shared publicly."
                : "Generate a public link so anyone with the link can view — no login required."}
            </p>
          </div>
        </button>

        {/* URL box — visible when public */}
        {isPublic && (
          <div
            style={{
              border: "2px solid #000000",
              backgroundColor: "#FFFFFF",
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
