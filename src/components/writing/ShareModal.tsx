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

// --- Section label (thin separator between club + public) ---

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 8px 0" }}>
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "11px",
          fontWeight: 700,
          color: "#808080",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          backgroundColor: "#FFFFFF",
          padding: "2px 6px",
          display: "inline-block",
        }}
      >
        {children}
      </span>
    </p>
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
  const isActioning =
    loadingClubId !== null || loadingPublic || revoking !== null;

  return (
    <Modal isOpen onClose={onClose} title="Share" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Club section */}
        {userClubs.length > 0 && (
          <div>
            <SectionLabel>Club</SectionLabel>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {userClubs.map((club) => {
                const share = clubShares.find((s) => s.clubId === club.id);
                const isShared = sharedClubIds.has(club.id);

                if (isShared && share) {
                  // Shared state — static card with revoke
                  return (
                    <div
                      key={club.id}
                      style={{
                        border: "2px solid #000000",
                        backgroundColor: "#FFFFFF",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "15px",
                            fontWeight: 300,
                            color: "#000000",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {club.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#000000",
                            backgroundColor: "#00FF66",
                            border: "1px solid #000000",
                            padding: "2px 6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            flexShrink: 0,
                          }}
                        >
                          Shared
                        </span>
                      </div>
                      <button
                        onClick={() => handleRevoke(share.id)}
                        disabled={isActioning}
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "12px",
                          fontWeight: 300,
                          color: revoking === share.id ? "#808080" : "#DC2626",
                          border: "none",
                          background: "none",
                          padding: 0,
                          cursor: isActioning ? "not-allowed" : "pointer",
                          textDecoration: "underline",
                          flexShrink: 0,
                        }}
                      >
                        {revoking === share.id ? "Revoking…" : "Revoke"}
                      </button>
                    </div>
                  );
                }

                // Unshared state — clickable card (matches AttachToRiffModal)
                return (
                  <button
                    key={club.id}
                    onClick={() => handleShareToClub(club.id)}
                    disabled={isActioning}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      border: "2px solid #000000",
                      backgroundColor: "#FFFFFF",
                      padding: "12px 16px",
                      cursor: isActioning ? "not-allowed" : "pointer",
                      textAlign: "left",
                      width: "100%",
                      opacity: isActioning ? 0.6 : 1,
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
                      {loadingClubId === club.id ? "Sharing…" : club.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "12px",
                        fontWeight: 300,
                        color: "#808080",
                      }}
                    >
                      Members can read and leave comments
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Public section */}
        <div>
          <SectionLabel>Public link</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {publicShare ? (
              // Active public share — URL card + revoke
              <div>
                <div
                  style={{
                    border: "2px solid #000000",
                    backgroundColor: "#FFFFFF",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
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
                      fontWeight: 300,
                      color: "#000000",
                      border: "2px solid #000000",
                      background: "none",
                      padding: "4px 10px",
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "none",
                    }}
                  >
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingTop: "8px",
                  }}
                >
                  <button
                    onClick={() => handleRevoke(publicShare.id)}
                    disabled={isActioning}
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      fontWeight: 300,
                      color:
                        revoking === publicShare.id ? "#808080" : "#DC2626",
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: isActioning ? "not-allowed" : "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {revoking === publicShare.id
                      ? "Revoking…"
                      : "Revoke public link"}
                  </button>
                </div>
              </div>
            ) : (
              // Not public — clickable card (matches club card pattern)
              <button
                onClick={handleMakePublic}
                disabled={isActioning}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  border: "2px solid #000000",
                  backgroundColor: "#FFFFFF",
                  padding: "12px 16px",
                  cursor: isActioning ? "not-allowed" : "pointer",
                  textAlign: "left",
                  width: "100%",
                  opacity: isActioning ? 0.6 : 1,
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
                  {loadingPublic ? "Making public…" : "Make public"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#808080",
                  }}
                >
                  Anyone with the link can read. No account required.
                </span>
              </button>
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
