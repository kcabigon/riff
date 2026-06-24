"use client";

import Image from "next/image";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import AvatarDropdown from "@/components/clubs/AvatarDropdown";

export type ProfileTab = "pieces" | "jams" | "quotes";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "pieces", label: "Pieces" },
  { id: "jams", label: "Jams" },
  { id: "quotes", label: "Quotes" },
];

interface ProfileHeaderProps {
  profileUser: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
  currentUser: {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  isOwnProfile?: boolean;
  lastActiveClubId?: string | null;
  totalWordCount: number;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export default function ProfileHeader({
  profileUser,
  currentUser,
  lastActiveClubId,
  totalWordCount,
  activeTab,
  onTabChange,
}: ProfileHeaderProps) {
  const logoHref = lastActiveClubId ? `/clubs/${lastActiveClubId}` : "/";

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

  const initials = displayName
    ? displayName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  const joinedDate = profileUser.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ backgroundColor: "#000000" }}>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "#000000",
          display: "flex",
          alignItems: "center",
          padding: "16px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            width: "100%",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href={logoHref}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Image
              src="/images/landing/riff_logo.svg"
              alt="Riff"
              width={55}
              height={36}
              priority
            />
          </Link>

          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <NotificationBell />
              <AvatarDropdown user={currentUser} />
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 32px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "64px",
            border: "2px solid #FFFFFF",
            overflow: "hidden",
            flexShrink: 0,
            backgroundColor: "#E6E6E6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {profileUser.avatarUrl ? (
            <img
              src={profileUser.avatarUrl}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "28px",
                fontWeight: 400,
                color: "#000000",
                lineHeight: "normal",
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Name + Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

          <div
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              lineHeight: 1.4,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span>Riffing since {joinedDate}</span>
            <span>{totalWordCount.toLocaleString()} words written</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          justifyContent: "center",
          gap: "32px",
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #00FF66"
                  : "2px solid transparent",
                padding: "12px 0",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: isActive ? 500 : 300,
                color: isActive ? "#FFFFFF" : "#808080",
                lineHeight: 1,
                transition: "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
