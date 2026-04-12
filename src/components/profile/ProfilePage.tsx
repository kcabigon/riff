"use client";

import ProfileHeader from "./ProfileHeader";
import PiecesGrid from "./tabs/PiecesGrid";
import Avatar from "@/components/shared/Avatar";

const AVATAR_SIZE = 80;

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
  pieces: Array<{
    id: string;
    title: string | null;
    coverImage: string | null;
    currentContent: string | null;
    isRevealed: boolean;
  }>;
  isOwnProfile: boolean;
  lastActiveClubId: string | null;
}

export default function ProfilePage({
  user,
  stats,
  lastActiveClubId,
  pieces,
  isOwnProfile,
}: ProfilePageProps) {
  const firstName =
    user.firstName || user.name?.split(" ")[0] || user.username || "";
  const lastName =
    user.lastName || user.name?.split(" ").slice(1).join(" ") || "";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Header + avatar bridge */}
      <div style={{ position: "relative" }}>
        <ProfileHeader
          firstName={firstName}
          lastName={lastName}
          lastActiveClubId={lastActiveClubId}
        />

        {/* Avatar centered on the header's bottom edge, cutting into the featured piece */}
        <div
          style={{
            position: "absolute",
            bottom: -(AVATAR_SIZE / 2),
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
        >
          <Avatar
            user={user}
            size={48}
            borderColor="#FFFFFF"
            borderWidth={4}
            style={{ width: `${AVATAR_SIZE}px`, height: `${AVATAR_SIZE}px` }}
          />
        </div>
      </div>

      <PiecesGrid pieces={pieces} isOwnProfile={isOwnProfile} />

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
