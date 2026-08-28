"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ClubDropdown from "./ClubDropdown";
import CreateDropdown from "./CreateDropdown";
import CreatePillButton from "./CreatePillButton";
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
  showClubDropdown?: boolean;
  showCreateDropdown?: boolean;
  // Single-action "Let's Riff" button for club pages — the club context is
  // implicit (this page's club), so unlike showCreateDropdown there's no
  // menu, just one button that opens the club's riff creation flow. Caller
  // is responsible for only passing this when there's no active riff.
  onNewRiff?: () => void;
}

export default function NavBar({
  user,
  clubs,
  currentClub,
  showClubDropdown = true,
  showCreateDropdown = false,
  onNewRiff,
}: NavBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
          width: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Section: Logo + Create Dropdown / New Riff */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Logo — wordmark treatment matches LandingNavBar's icon +
              "Riff" lockup. */}
          <Link
            href={currentClub ? `/clubs/${currentClub.id}` : "/no-club"}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Image
              src="/images/landing/riff_logo.svg"
              alt="Riff"
              width={55}
              height={36}
              priority
            />
            <span
              className="navbar-wordmark"
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "32px",
                fontWeight: 900,
                fontStyle: "italic",
                color: "#FFFFFF",
                lineHeight: 1,
              }}
            >
              Riff
            </span>
          </Link>

          {showCreateDropdown && <CreateDropdown />}
          {onNewRiff && (
            <CreatePillButton
              label="Let's Riff"
              icon="plus"
              iconLeading
              hideIconOnMobile
              onClick={onNewRiff}
            />
          )}
        </div>

        {/* Right Section: Club Dropdown + Bell + Avatar Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {showClubDropdown && currentClub && (
            <ClubDropdown
              clubs={clubs}
              currentClub={currentClub}
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onClose={() => setIsDropdownOpen(false)}
            />
          )}
          <NotificationBell />
          <AvatarDropdown user={user} />
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .navbar-wordmark { display: none; }
        }
      `}</style>
    </nav>
  );
}
