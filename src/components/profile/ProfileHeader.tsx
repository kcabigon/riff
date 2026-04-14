"use client";

import Image from "next/image";
import BackButton from "@/components/BackButton";

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  lastActiveClubId?: string | null;
}

export default function ProfileHeader({
  firstName,
  lastName,
  lastActiveClubId,
}: ProfileHeaderProps) {
  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        minHeight: "48px",
      }}
    >
      {/* Left: back button + riff logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {lastActiveClubId && (
          <BackButton href={`/clubs/${lastActiveClubId}`} size={24} />
        )}
        <Image
          src="/images/riff_logo_black_shadow.svg"
          alt="Riff"
          width={40}
          height={26}
        />
      </div>

      {/* Right: name */}
      <span
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "16px",
          fontWeight: 400,
          color: "#000000",
        }}
      >
        {displayName}
      </span>
    </div>
  );
}
