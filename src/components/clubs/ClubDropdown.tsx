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
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/add.svg" alt="" width={16} height={16} />
      ),
      onClick: () => {
        sessionStorage.setItem("pendingClubFrom", `/clubs/${currentClub.id}`);
        router.push("/onboarding/create-club");
      },
    },
  ];

  return (
    <Dropdown
      trigger={
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            backgroundColor: "#000000",
            border: "2px solid #FFFFFF",
            boxShadow:
              isHovered || isOpen
                ? "4px 4px 0px 0px #01EFFC"
                : "4px 4px 0px 0px #00FF66",
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
              fontSize: "14px",
              fontWeight: 300,
              color: "#FFFFFF",
              transition: "none",
            }}
          >
            My Clubs
          </span>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/arrow_down.svg"
            alt=""
            width={16}
            height={16}
            style={{ filter: "invert(1)" }}
          />
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
