"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import PiecesGrid, { FeaturedPiece } from "./tabs/PiecesGrid";
import type { Piece } from "./tabs/PiecesGrid";
import DeletePieceModal from "@/components/profile/DeletePieceModal";
import ShareModal, { PublicShare } from "@/components/profile/ShareModal";

interface ProfilePageProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
  stats: {
    pieceCount: number;
    totalWordCount: number;
  };
  pieces: Piece[];
  isOwnProfile: boolean;
  lastActiveClubId: string | null;
}

export default function ProfilePage({
  user,
  stats,
  lastActiveClubId,
  pieces: initialPieces,
  isOwnProfile,
}: ProfilePageProps) {
  const router = useRouter();
  const [pieces, setPieces] = useState(initialPieces);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string | null;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<string | null>(null);

  const handleDeleted = (pieceId: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
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

  const [featured, ...rest] = pieces;

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
              isRevealed={piece.isRevealed}
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
        isOwnProfile={isOwnProfile}
        lastActiveClubId={lastActiveClubId}
        stats={isOwnProfile ? stats : undefined}
      />

      {/* Empty state */}
      {pieces.length === 0 && (
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "24px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 8px 0",
            }}
          >
            Every great writer starts with a blank page.
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
            }}
          >
            Pieces coming soon.
          </p>
        </div>
      )}

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {featured && (
          <div style={{ padding: "32px 0 0" }}>
            <FeaturedPiece
              piece={featured}
              onClick={
                !featured.isRevealed && isOwnProfile
                  ? () => router.push(`/write/${featured.id}`)
                  : !featured.isRevealed
                    ? () => {}
                    : isOwnProfile || featured.viewerHasClubAccess
                      ? () =>
                          router.push(
                            `/read/${featured.id}?from=profile&userId=${user.id}`
                          )
                      : featured.isPublic
                        ? () => router.push(`/p/${featured.id}`)
                        : () => {}
              }
              isOwnProfile={isOwnProfile}
              onDelete={() =>
                setDeleteTarget({ id: featured.id, title: featured.title })
              }
              onShare={(pieceId) => setShareTarget(pieceId)}
            />
          </div>
        )}

        {/* Jams — coming soon */}

        {rest.length > 0 && (
          <PiecesGrid
            pieces={rest}
            isOwnProfile={isOwnProfile}
            profileUserId={user.id}
            onDelete={(id: string, title: string | null) =>
              setDeleteTarget({ id, title })
            }
            onShare={(pieceId) => setShareTarget(pieceId)}
          />
        )}
      </div>

      {/* Footer: stats */}
      <div
        style={{
          borderTop: "1px solid #E6E6E6",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
          }}
        >
          {stats.pieceCount} pieces
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
          }}
        >
          &middot;
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
          }}
        >
          {stats.totalWordCount.toLocaleString()} words
        </span>
      </div>
    </div>
  );
}
