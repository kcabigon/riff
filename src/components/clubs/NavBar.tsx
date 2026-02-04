"use client";

import { useState } from "react";
import Image from "next/image";
import ClubDropdown from "./ClubDropdown";
import Avatar from "@/components/shared/Avatar";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";

interface NavBarProps {
  user: {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
  clubs: Array<{
    id: string;
    name: string;
  }>;
  currentClub?: {
    id: string;
    name: string;
  } | null;
}

export default function NavBar({ user, clubs, currentClub }: NavBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const handleProfileClick = useProfileNavigation();

  return (
    <nav
      style={{
        height: "72px",
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
        {/* Left Section: Logo + Club Dropdown */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Image
              src="/images/riff_wordmark_white_outline.svg"
              alt="Riff"
              width={55}
              height={36}
              priority
            />
          </div>

          {/* Club Dropdown */}
          {currentClub && (
            <ClubDropdown
              clubs={clubs}
              currentClub={currentClub}
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onClose={() => setIsDropdownOpen(false)}
            />
          )}
        </div>

        {/* Right Section: Avatar */}
        <Avatar
          user={user}
          size={40}
          showBorder={true}
          borderColor="#FFFFFF"
          borderWidth={1}
          onClick={handleProfileClick}
        />
      </div>
    </nav>
  );
}
