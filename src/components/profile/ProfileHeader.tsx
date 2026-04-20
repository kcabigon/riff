"use client";

import Image from "next/image";
import Link from "next/link";
import Avatar from "@/components/shared/Avatar";

interface ProfileHeaderProps {
  profileUser: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  lastActiveClubId?: string | null;
}

export default function ProfileHeader({
  profileUser,
  lastActiveClubId,
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

  return (
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
        <Link href={logoHref} style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/images/landing/riff_logo.svg"
            alt="Riff"
            width={55}
            height={36}
            priority
          />
        </Link>

        {/* Right: name + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "18px",
              fontWeight: 400,
              color: "#FFFFFF",
            }}
          >
            {displayName}
          </span>
          <Avatar user={profileUser} size={40} borderColor="#FFFFFF" />
        </div>
      </div>
    </nav>
  );
}
