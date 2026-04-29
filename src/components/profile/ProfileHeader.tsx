"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Dropdown from "@/components/shared/Dropdown";
import MyStatsModal from "./MyStatsModal";

interface ProfileHeaderProps {
  profileUser: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
  isOwnProfile?: boolean;
  lastActiveClubId?: string | null;
  stats?: {
    pieceCount: number;
    totalWordCount: number;
  };
}

export default function ProfileHeader({
  profileUser,
  isOwnProfile,
  lastActiveClubId,
  stats,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const logoHref = lastActiveClubId ? `/clubs/${lastActiveClubId}` : "/";

  const dropdownItems = [
    ...(isOwnProfile && stats
      ? [
          {
            type: "action" as const,
            label: "My stats",
            onClick: () => setIsStatsOpen(true),
          },
          { type: "divider" as const },
        ]
      : []),
    ...(isOwnProfile
      ? [
          {
            type: "action" as const,
            label: "Settings",
            onClick: () => router.push("/settings"),
          },
          {
            type: "action" as const,
            label: "Log out",
            onClick: () => signOut({ callbackUrl: "/" }),
          },
        ]
      : []),
  ];

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

  const nameEl = (
    <span
      style={{
        fontFamily: "var(--font-dm-serif-text)",
        fontSize: "20px",
        fontWeight: 400,
        color: "#FFFFFF",
        cursor: isOwnProfile ? "pointer" : "default",
        transition: "color 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (isOwnProfile)
          (e.currentTarget as HTMLElement).style.color = "#C01582";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
      }}
    >
      {displayName}
    </span>
  );

  return (
    <>
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
          {/* Left: Logo */}
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

          {/* Right: name (dropdown for own profile, plain text for others) */}
          {isOwnProfile ? (
            <Dropdown
              trigger={nameEl}
              align="right"
              minWidth={140}
              items={dropdownItems}
            />
          ) : (
            nameEl
          )}
        </div>
      </nav>

      {isOwnProfile && stats && (
        <MyStatsModal
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          stats={stats}
        />
      )}
    </>
  );
}
