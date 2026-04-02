"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";

// --- Types ---

export interface ShareItem {
  id: string;
  shareType: "CLUB" | "PUBLIC";
  clubId: string | null;
  isPublic: boolean;
  club: { id: string; name: string } | null;
}

interface ShareModalProps {
  pieceId: string;
  userClubs: Array<{ id: string; name: string }>;
  existingShares: ShareItem[];
  onClose: () => void;
  onShareCreated: (share: ShareItem) => void;
  onShareRevoked: (shareId: string) => void;
}

// --- Shared row layout ---

function Row({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "14px 0",
        borderBottom: "1px solid #E6E6E6",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          minWidth: 0,
          flex: 1,
        }}
      >
        {left}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "11px",
        fontWeight: 700,
        color: "#808080",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        margin: "0 0 12px 0",
      }}
    >
      {children}
    </p>
  );
}

function ShareButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "12px",
        fontWeight: 300,
        color: "#000000",
        border: "1px solid #000000",
        background: "none",
        padding: "4px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function RevokeButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "12px",
        fontWeight: 300,
        color: disabled ? "#808080" : "#DC2626",
        border: "none",
        background: "none",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        textDecoration: "underline",
        transition: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function SharedBadge() {
  return (
    <span
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "11px",
        fontWeight: 700,
        color: "#000000",
        backgroundColor: "#00FF66",
        padding: "1px 6px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      Shared
    </span>
  );
}

// --- Main component ---

export default function ShareModal({
  pieceId,
  userClubs,
  existingShares,
  onClose,
  onShareCreated,
  onShareRevoked,
}: ShareModalProps) {
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clubShares = existingShares.filter((s) => s.shareType === "CLUB");
  const publicShare =
    existingShares.find((s) => s.shareType === "PUBLIC") ?? null;
  const sharedClubIds = new Set(clubShares.map((s) => s.clubId));

  const handleShareToClub = async (clubId: string) => {
    setLoadingClubId(clubId);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareType: "CLUB", clubId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to share.");
        return;
      }
      onShareCreated(data.share);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoadingClubId(null);
    }
  };

  const handleMakePublic = async () => {
    setLoadingPublic(true);
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
      onShareCreated(data.share);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoadingPublic(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    setRevoking(shareId);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}/shares/${shareId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to revoke.");
        return;
      }
      onShareRevoked(shareId);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setRevoking(null);
    }
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}/p/${pieceId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${pieceId}`;

  return (
    <Modal isOpen onClose={onClose} title="Share" size="md">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* Club section */}
        {userClubs.length > 0 && (
          <div>
            <SectionLabel>Club</SectionLabel>
            <div style={{ borderTop: "1px solid #E6E6E6" }}>
              {userClubs.map((club) => {
                const share = clubShares.find((s) => s.clubId === club.id);
                const isShared = sharedClubIds.has(club.id);
                return (
                  <Row
                    key={club.id}
                    left={
                      <>
                        <span
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "14px",
                            fontWeight: 300,
                            color: "#000000",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {club.name}
                        </span>
                        {isShared && <SharedBadge />}
                      </>
                    }
                    right={
                      isShared && share ? (
                        <RevokeButton
                          label={revoking === share.id ? "Revoking…" : "Revoke"}
                          onClick={() => handleRevoke(share.id)}
                          disabled={revoking !== null}
                        />
                      ) : (
                        <ShareButton
                          label={
                            loadingClubId === club.id ? "Sharing…" : "Share"
                          }
                          onClick={() => handleShareToClub(club.id)}
                          disabled={loadingClubId !== null}
                        />
                      )
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Public section */}
        <div>
          <SectionLabel>Public link</SectionLabel>
          <div style={{ borderTop: "1px solid #E6E6E6" }}>
            {publicShare ? (
              <>
                {/* URL + copy */}
                <Row
                  left={
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono, monospace)",
                        fontSize: "13px",
                        color: "#808080",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {publicUrl}
                    </span>
                  }
                  right={
                    <ShareButton
                      label={copied ? "Copied!" : "Copy"}
                      onClick={handleCopy}
                    />
                  }
                />
                {/* Revoke */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingTop: "12px",
                  }}
                >
                  <RevokeButton
                    label={
                      revoking === publicShare.id
                        ? "Revoking…"
                        : "Revoke public link"
                    }
                    onClick={() => handleRevoke(publicShare.id)}
                    disabled={revoking !== null}
                  />
                </div>
              </>
            ) : (
              <Row
                left={
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "14px",
                      fontWeight: 300,
                      color: "#808080",
                    }}
                  >
                    Anyone with a link can read this piece.
                  </span>
                }
                right={
                  <ShareButton
                    label={loadingPublic ? "Making public…" : "Make public"}
                    onClick={handleMakePublic}
                    disabled={loadingPublic}
                  />
                }
              />
            )}
          </div>
        </div>

        {/* Error */}
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
