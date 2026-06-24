"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import AvatarDropdown from "@/components/clubs/AvatarDropdown";

function NewJamButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        backgroundColor: "#000000",
        border: disabled ? "2px solid #9C9C9C" : "2px solid #FFFFFF",
        boxShadow: disabled
          ? "none"
          : hovered
            ? "4px 4px 0px 0px #01EFFC"
            : "4px 4px 0px 0px #00FF66",
        padding: "8px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "none",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 300,
          color: disabled ? "#9C9C9C" : "#FFFFFF",
        }}
      >
        New jam
      </span>
    </button>
  );
}

interface ProfileHeaderProps {
  profileUser: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  currentUser: {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  isOwnProfile?: boolean;
  lastActiveClubId?: string | null;
  onNewJam?: () => void;
  isComposing?: boolean;
  stats: {
    pieceCount: number;
    totalWordCount: number;
    riffCount: number;
    commentsGiven: number;
  };
}

export default function ProfileHeader({
  profileUser,
  currentUser,
  isOwnProfile,
  lastActiveClubId,
  onNewJam,
  isComposing,
  stats,
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

  const statItems = [
    { value: stats.riffCount, label: "riffs" },
    { value: stats.pieceCount, label: "pieces" },
    { value: stats.totalWordCount.toLocaleString(), label: "words" },
    { value: stats.commentsGiven, label: "comments given" },
  ];

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
          padding: "32px 24px 40px",
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
              display: "flex",
              alignItems: "flex-end",
              gap: "32px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              {statItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "24px",
                      fontWeight: 400,
                      color: "#FFFFFF",
                      lineHeight: 1,
                    }}
                  >
                    {item.value}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      fontWeight: 300,
                      color: "#808080",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {isOwnProfile && onNewJam && (
              <NewJamButton onClick={onNewJam} disabled={!!isComposing} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
