"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import PiecesGrid, { FeaturedPiece } from "./tabs/PiecesGrid";
import type { Piece } from "./tabs/PiecesGrid";
import DeletePieceModal from "@/components/profile/DeletePieceModal";

interface ProfilePageProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatarUrl: string | null;
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

  const handleDeleted = (pieceId: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
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

      <ProfileHeader
        profileUser={user}
        isOwnProfile={isOwnProfile}
        lastActiveClubId={lastActiveClubId}
      />

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Hero piece */}
        <div style={{ padding: "32px 0 0" }}>
          {pieces.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center" }}>
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
          ) : featured ? (
            <FeaturedPiece
              piece={featured}
              onClick={
                !featured.isRevealed && !isOwnProfile
                  ? () => {}
                  : !featured.isRevealed && isOwnProfile
                    ? () => router.push(`/write/${featured.id}`)
                    : () => router.push(`/read/${featured.id}`)
              }
              isOwnProfile={isOwnProfile}
              onDelete={() =>
                setDeleteTarget({ id: featured.id, title: featured.title })
              }
            />
          ) : null}
        </div>

        {/* Piece grid */}
        {rest.length > 0 && (
          <PiecesGrid
            pieces={rest}
            isOwnProfile={isOwnProfile}
            onDelete={(id: string, title: string | null) =>
              setDeleteTarget({ id, title })
            }
          />
        )}

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
    </div>
  );
}
