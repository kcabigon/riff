"use client";

import { useState } from "react";
import Image from "next/image";
import ClubDropdown from "./ClubDropdown";
import AvatarDropdown from "./AvatarDropdown";
import NotificationBell from "@/components/notifications/NotificationBell";

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

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
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
              src="/images/landing/riff_logo.svg"
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

        {/* Right Section: Bell + Avatar Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <NotificationBell />
          <AvatarDropdown user={user} />
        </div>
      </div>
    </nav>
  );
}
