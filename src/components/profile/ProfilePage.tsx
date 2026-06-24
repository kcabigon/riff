"use client";

import { useState, useEffect, useRef } from "react";
import ProfileHeader, { type ProfileTab } from "./ProfileHeader";
import PiecesGrid from "./tabs/PiecesGrid";
import type { Piece } from "./tabs/PiecesGrid";
import DeletePieceModal from "@/components/profile/DeletePieceModal";
import ShareModal, { PublicShare } from "@/components/profile/ShareModal";
import NoiseBackground from "@/components/NoiseBackground";

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
  } | null;
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
  currentUser,
  stats,
  lastActiveClubId,
  pieces: initialPieces,
  isOwnProfile,
}: ProfilePageProps) {
  const [pieces, setPieces] = useState(initialPieces);
  const [activeTab, setActiveTab] = useState<ProfileTab>("pieces");
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

  const isEmpty = pieces.length === 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 40, y: 40 });
  const vel = useRef({ dx: 2.5, dy: 2 });
  const [boxStyle, setBoxStyle] = useState({ left: 40, top: 40 });

  useEffect(() => {
    if (!isEmpty) return;
    let animId: number;

    const step = () => {
      const container = containerRef.current;
      const box = boxRef.current;
      if (!container || !box) {
        animId = requestAnimationFrame(step);
        return;
      }

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;

      pos.current.x += vel.current.dx;
      pos.current.y += vel.current.dy;

      if (pos.current.x <= 0) {
        pos.current.x = 0;
        vel.current.dx = Math.abs(vel.current.dx);
      }
      if (pos.current.x + bw >= cw) {
        pos.current.x = cw - bw;
        vel.current.dx = -Math.abs(vel.current.dx);
      }
      if (pos.current.y <= 0) {
        pos.current.y = 0;
        vel.current.dy = Math.abs(vel.current.dy);
      }
      if (pos.current.y + bh >= ch) {
        pos.current.y = ch - bh;
        vel.current.dy = -Math.abs(vel.current.dy);
      }

      setBoxStyle({ left: pos.current.x, top: pos.current.y });
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isEmpty]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        position: isEmpty ? "relative" : undefined,
      }}
    >
      {isEmpty && <NoiseBackground fillMode="tile" />}
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
        currentUser={currentUser}
        isOwnProfile={isOwnProfile}
        lastActiveClubId={lastActiveClubId}
        stats={stats}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Empty state — bouncing box */}
      {isEmpty && activeTab === "pieces" && (
        <div
          ref={containerRef}
          style={{
            position: "relative",
            height: "calc(100vh - 64px)",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <div
            ref={boxRef}
            style={{
              position: "absolute",
              left: boxStyle.left,
              top: boxStyle.top,
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: "8px 8px 0px 0px #000000",
              width: "160px",
              height: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              Every writer starts with a blank page.
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {activeTab === "pieces" && pieces.length > 0 && (
          <PiecesGrid
            pieces={pieces}
            isOwnProfile={isOwnProfile}
            profileUserId={user.id}
            onDelete={(id: string, title: string | null) =>
              setDeleteTarget({ id, title })
            }
            onShare={(pieceId) => setShareTarget(pieceId)}
          />
        )}

        {activeTab === "jams" && <div style={{ minHeight: "240px" }} />}

        {activeTab === "quotes" && <div style={{ minHeight: "240px" }} />}
      </div>
    </div>
  );
}
