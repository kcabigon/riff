"use client";

import { useState } from "react";
import Image from "next/image";
import ClubDropdown from "./ClubDropdown";

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

  // Get user initials for avatar
  const getInitials = () => {
    if (user.name) {
      const parts = user.name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

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
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "64px",
            border: "1px solid #FFFFFF",
            backgroundColor: user.avatarUrl ? "transparent" : "#E6E6E6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || user.username || "User"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "12px",
                fontWeight: 400,
                color: "#000000",
              }}
            >
              {getInitials()}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
