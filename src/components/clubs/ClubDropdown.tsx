"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";

interface ClubDropdownProps {
  clubs: Array<{
    id: string;
    name: string;
  }>;
  currentClub: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function ClubDropdown({
  clubs,
  currentClub,
  isOpen,
  onToggle,
  onClose,
}: ClubDropdownProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const items: DropdownItem[] = [
    ...clubs.map(
      (club): DropdownItem => ({
        type: "action",
        label: club.name,
        active: club.id === currentClub.id,
        onClick: () => router.push(`/clubs/${club.id}`),
      })
    ),
    ...(clubs.length > 0 ? [{ type: "divider" as const }] : []),
    {
      type: "action",
      label: "Start new club",
      color: "#808080",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: "#808080" }}
        >
          <path
            d="M8 3V13M3 8H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      onClick: () => router.push("/onboarding/create-club"),
    },
  ];

  return (
    <Dropdown
      trigger={
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            backgroundColor: isHovered || isOpen ? "#00FF66" : "#FFFFFF",
            border: "2px solid #000000",
            boxShadow:
              isHovered || isOpen
                ? "3px 3px 0px 0px #FFFFFF"
                : "3px 3px 0px 0px #00FF66",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#000000",
              transition: "none",
            }}
          >
            My Clubs
          </span>

          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{ color: "#000000", transition: "none" }}
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      }
      items={items}
      align="left"
      minWidth={200}
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
    />
  );
}
