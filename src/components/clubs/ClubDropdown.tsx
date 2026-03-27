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
      color: "#000000",
      backgroundColor: "#00FF66",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ color: "#000000" }}
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
            backgroundColor: isOpen ? "#FFFFFF" : "#000000",
            border: `1px solid ${isOpen ? "#00FF66" : "#FFFFFF"}`,
            boxShadow: "2px 2px 0px 0px #FFFFFF",
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
              fontWeight: 300,
              color: isOpen ? "#000000" : isHovered ? "#00FF66" : "#FFFFFF",
              transition: "none",
              maxWidth: "160px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentClub.name}
          </span>

          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              color: isOpen ? "#000000" : isHovered ? "#00FF66" : "#FFFFFF",
              transition: "none",
            }}
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
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
