"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";

// --- Types ---

export interface ActiveRiff {
  id: string;
  title: string | null;
  volume: number;
  club: { id: string; name: string };
}

export interface ShareItem {
  id: string;
  shareType: "CLUB" | "PUBLIC";
  clubId: string | null;
  isPublic: boolean;
  club: { id: string; name: string } | null;
}

interface ShareModalProps {
  pieceId: string;
  activeRiffs: ActiveRiff[];
  userClubs: Array<{ id: string; name: string }>;
  existingRiffIds: string[];
  existingShares: ShareItem[];
  onClose: () => void;
  onRiffAttached: (riff: ActiveRiff) => void;
  onShareCreated: (share: ShareItem) => void;
  onShareRevoked: (shareId: string) => void;
}

// --- Section label ---

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "11px",
        fontWeight: 300,
        color: "#808080",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        margin: "0 0 8px 0",
      }}
    >
      {children}
    </p>
  );
}

// --- Row item ---

function Row({
  primary,
  secondary,
  badge,
  action,
}: {
  primary: string;
  secondary?: string;
  badge?: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "2px solid #000000",
        backgroundColor: "#FFFFFF",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            {primary}
          </span>
          {badge}
        </div>
        {secondary && (
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
            }}
          >
            {secondary}
          </span>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  );
}

function SharedBadge() {
  return (
    <span
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "10px",
        fontWeight: 700,
        color: "#000000",
        backgroundColor: "#00FF66",
        border: "1px solid #000000",
        padding: "1px 6px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      Shared
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "12px",
        fontWeight: 300,
        color: destructive ? "#DC2626" : "#000000",
        border: `1px solid ${destructive ? "#DC2626" : "#000000"}`,
        background: "none",
        padding: "4px 10px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
        transition: "none",
      }}
    >
      {label}
    </button>
  );
}

// --- Main component ---

export default function ShareModal({
  pieceId,
  activeRiffs,
  userClubs,
  existingRiffIds,
  existingShares,
  onClose,
  onRiffAttached,
  onShareCreated,
  onShareRevoked,
}: ShareModalProps) {
  const [loadingRiffId, setLoadingRiffId] = useState<string | null>(null);
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibleRiffs = activeRiffs.filter(
    (r) => !existingRiffIds.includes(r.id)
  );
  const clubShares = existingShares.filter((s) => s.shareType === "CLUB");
  const publicShare =
    existingShares.find((s) => s.shareType === "PUBLIC") ?? null;
  const sharedClubIds = new Set(clubShares.map((s) => s.clubId));

  // --- Riff attach ---

  const handleAttachRiff = async (riff: ActiveRiff) => {
    setLoadingRiffId(riff.id);
    setError(null);
    try {
      const res = await fetch(`/api/riffs/${riff.id}/pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to attach to riff.");
        return;
      }
      onRiffAttached(riff);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoadingRiffId(null);
    }
  };

  // --- Club share ---

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

  // --- Public share ---

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

  // --- Revoke ---

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

  // --- Copy public link ---

  const handleCopy = async () => {
    const url = `${window.location.origin}/p/${pieceId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${pieceId}`;

  return (
    <Modal isOpen onClose={onClose} title="Share" size="md">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* RIFF section */}
        <div>
          <SectionLabel>Riff</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {existingRiffIds.map((riffId) => {
              const riff = activeRiffs.find((r) => r.id === riffId);
              const label = riff
                ? riff.title || `Riff Vol. ${riff.volume}`
                : "Riff";
              const sub = riff ? riff.club.name : undefined;
              return (
                <Row
                  key={riffId}
                  primary={label}
                  secondary={sub}
                  badge={<SharedBadge />}
                  action={null}
                />
              );
            })}
            {eligibleRiffs.map((riff) => (
              <Row
                key={riff.id}
                primary={riff.title || `Riff Vol. ${riff.volume}`}
                secondary={riff.club.name}
                action={
                  <ActionButton
                    label={loadingRiffId === riff.id ? "Attaching…" : "Attach"}
                    onClick={() => handleAttachRiff(riff)}
                    disabled={loadingRiffId !== null}
                  />
                }
              />
            ))}
            {existingRiffIds.length === 0 && eligibleRiffs.length === 0 && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                }}
              >
                No active riffs available.
              </p>
            )}
          </div>
        </div>

        {/* CLUB section */}
        {userClubs.length > 0 && (
          <div>
            <SectionLabel>Club</SectionLabel>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {userClubs.map((club) => {
                const share = clubShares.find((s) => s.clubId === club.id);
                const isShared = sharedClubIds.has(club.id);
                return (
                  <Row
                    key={club.id}
                    primary={club.name}
                    badge={isShared ? <SharedBadge /> : undefined}
                    action={
                      isShared && share ? (
                        <ActionButton
                          label={revoking === share.id ? "Revoking…" : "Revoke"}
                          onClick={() => handleRevoke(share.id)}
                          disabled={revoking !== null}
                          destructive
                        />
                      ) : (
                        <ActionButton
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

        {/* PUBLIC section */}
        <div>
          <SectionLabel>Public</SectionLabel>
          {publicShare ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div
                style={{
                  border: "2px solid #000000",
                  backgroundColor: "#F5F5F5",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono, monospace)",
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
                <ActionButton
                  label={copied ? "Copied!" : "Copy"}
                  onClick={handleCopy}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ActionButton
                  label={
                    revoking === publicShare.id
                      ? "Revoking…"
                      : "Revoke public link"
                  }
                  onClick={() => handleRevoke(publicShare.id)}
                  disabled={revoking !== null}
                  destructive
                />
              </div>
            </div>
          ) : (
            <ActionButton
              label={loadingPublic ? "Making public…" : "Make public"}
              onClick={handleMakePublic}
              disabled={loadingPublic}
            />
          )}
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
