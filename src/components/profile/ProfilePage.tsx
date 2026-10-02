"use client";

import { useState } from "react";
import ProfileHeader from "./ProfileHeader";
import PiecesGrid from "./tabs/PiecesGrid";
import type { Piece } from "./tabs/PiecesGrid";
import DeletePieceModal from "@/components/profile/DeletePieceModal";
import ShareModal, { PublicShare } from "@/components/profile/ShareModal";

type TabId = "drafts" | "pieces";

interface ProfilePageProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
  };
  currentUser: {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
  stats: {
    pieceCount: number;
    totalWordCount: number;
  };
  pieces: Piece[];
  /** Owner-only. Always [] when viewing someone else's profile. */
  drafts: Piece[];
  isOwnProfile: boolean;
  hasFriends: boolean;
  currentClub: { id: string; name: string } | null;
}

const OWNER_TABS: { id: TabId; label: string }[] = [
  { id: "drafts", label: "DRAFTS" },
  { id: "pieces", label: "PIECES" },
];

export default function ProfilePage({
  user,
  currentUser,
  stats,
  currentClub,
  pieces: initialPieces,
  drafts: initialDrafts,
  isOwnProfile,
  hasFriends,
}: ProfilePageProps) {
  const [pieces, setPieces] = useState(initialPieces);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [activeTab, setActiveTab] = useState<TabId>(
    isOwnProfile && initialDrafts.length > 0 ? "drafts" : "pieces"
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string | null;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<string | null>(null);

  const handleDeleted = (pieceId: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
    setDrafts((prev) => prev.filter((p) => p.id !== pieceId));
  };

  const handleHide = async (pieceId: string) => {
    try {
      const res = await fetch(`/api/pieces/${pieceId}/profile-visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: true }),
      });
      if (!res.ok) {
        console.error("Error hiding piece:", await res.text());
        return;
      }
      setPieces((prev) => prev.filter((p) => p.id !== pieceId));
    } catch (err) {
      console.error("Error hiding piece:", err);
    }
  };

  const handleShareCreated = (pieceId: string, share: PublicShare) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, isPublic: true, publicShareId: share.id } : p
      )
    );
  };

  const handleShareRevoked = (pieceId: string) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, isPublic: false, publicShareId: null } : p
      )
    );
  };

  const gridPieces = isOwnProfile && activeTab === "drafts" ? drafts : pieces;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {deleteTarget && (
        <DeletePieceModal
          pieceId={deleteTarget.id}
          pieceTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => handleDeleted(deleteTarget.id)}
        />
      )}

      {shareTarget &&
        (() => {
          const piece = pieces.find((p) => p.id === shareTarget);
          if (!piece) return null;
          return (
            <ShareModal
              pieceId={piece.id}
              pieceTitle={piece.title}
              isRevealed={piece.isRevealed}
              hasFriends={hasFriends}
              existingShare={
                piece.publicShareId
                  ? {
                      id: piece.publicShareId,
                      shareType: "PUBLIC",
                      isPublic: true,
                    }
                  : null
              }
              onClose={() => setShareTarget(null)}
              onShareCreated={(share) => handleShareCreated(piece.id, share)}
              onShareRevoked={() => handleShareRevoked(piece.id)}
            />
          );
        })()}

      <ProfileHeader
        profileUser={user}
        currentUser={currentUser}
        isOwnProfile={isOwnProfile}
        currentClub={currentClub}
        stats={stats}
      />

      {/* Drafts tab is owner-only — never render for other viewers */}
      {isOwnProfile && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E6E6E6",
          }}
        >
          {OWNER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #000000"
                    : "2px solid transparent",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: isActive ? 700 : 300,
                  color: "#000000",
                  cursor: "pointer",
                  padding: "12px 24px",
                  letterSpacing: "0.02em",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {gridPieces.length > 0 ? (
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <PiecesGrid
            pieces={gridPieces}
            isOwnProfile={isOwnProfile}
            profileUserId={user.id}
            onDelete={(id: string, title: string | null) =>
              setDeleteTarget({ id, title })
            }
            onShare={(pieceId) => setShareTarget(pieceId)}
            onHide={handleHide}
          />
        </div>
      ) : isOwnProfile && activeTab === "drafts" ? (
        <div
          style={{
            padding: "64px 24px",
            textAlign: "center",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
          }}
        >
          No drafts yet.
        </div>
      ) : null}
    </div>
  );
}
