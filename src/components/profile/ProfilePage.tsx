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

  // Stats preserved here for future use (e.g. own-profile dropdown)
  const _stats = stats;
  void _stats;

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
        {featured && (
          <div style={{ padding: "32px 0 0" }}>
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
          </div>
        )}

        {rest.length > 0 && (
          <PiecesGrid
            pieces={rest}
            isOwnProfile={isOwnProfile}
            onDelete={(id: string, title: string | null) =>
              setDeleteTarget({ id, title })
            }
          />
        )}
      </div>
    </div>
  );
}
