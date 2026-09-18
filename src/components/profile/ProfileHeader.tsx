"use client";

import { useRouter } from "next/navigation";
import NavBar from "@/components/clubs/NavBar";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import Avatar from "@/components/shared/Avatar";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface ProfileHeaderProps {
  profileUser: {
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
  isOwnProfile?: boolean;
  currentClub: { id: string; name: string } | null;
  stats: {
    pieceCount: number;
    totalWordCount: number;
  };
}

export default function ProfileHeader({
  profileUser,
  currentUser,
  isOwnProfile,
  currentClub,
  stats,
}: ProfileHeaderProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const firstName =
    profileUser.firstName ||
    profileUser.name?.split(" ")[0] ||
    profileUser.username ||
    "";
  const lastName =
    profileUser.lastName ||
    profileUser.name?.split(" ").slice(1).join(" ") ||
    "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  const joinedDate = profileUser.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const bioText = profileUser.bio || `Riffing since ${joinedDate}`;
  const statsLine = `${stats.pieceCount} pieces · ${stats.totalWordCount.toLocaleString()} words`;

  return (
    <div style={{ backgroundColor: "#000000" }}>
      <NavBar
        user={currentUser}
        clubs={[]}
        currentClub={currentClub}
        showClubDropdown={false}
      />

      {/* Hero */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: isMobile ? "12px 24px 20px" : "32px 24px 40px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? "12px" : "24px",
          flexWrap: isMobile ? "nowrap" : "wrap",
        }}
      >
        {/* Avatar + Name row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "16px" : "24px",
          }}
        >
          <Avatar
            size={isMobile ? 64 : 120}
            borderColor="#FFFFFF"
            user={{
              id: profileUser.id,
              name: displayName || null,
              username: profileUser.username,
              avatarUrl: profileUser.avatarUrl,
            }}
          />

          {!isMobile && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <h1
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "32px",
                    fontWeight: 400,
                    color: "#FFFFFF",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {displayName || "Anonymous"}
                </h1>
                {isOwnProfile && (
                  <ThreeDotButton
                    variant="dark"
                    align="right"
                    items={[
                      {
                        type: "action",
                        label: "Edit info",
                        onClick: () => router.push("/account"),
                      },
                    ]}
                  />
                )}
              </div>

              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#FFFFFF",
                  margin: 0,
                  lineHeight: 1.4,
                  maxWidth: "400px",
                }}
              >
                {bioText}
              </p>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#808080",
                  lineHeight: 1.4,
                }}
              >
                {statsLine}
              </span>
            </div>
          )}

          {isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minWidth: 0,
                flex: 1,
              }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#FFFFFF",
                  margin: 0,
                  lineHeight: 1.2,
                  minWidth: 0,
                }}
              >
                {displayName || "Anonymous"}
              </h1>
              {isOwnProfile && (
                <ThreeDotButton
                  variant="dark"
                  align="right"
                  items={[
                    {
                      type: "action",
                      label: "Edit info",
                      onClick: () => router.push("/account"),
                    },
                  ]}
                />
              )}
            </div>
          )}
        </div>

        {/* Bio + Stats — full width below on mobile, wraps normally */}
        {isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#FFFFFF",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {bioText}
            </p>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                lineHeight: 1.4,
              }}
            >
              {statsLine}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
