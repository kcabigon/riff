"use client";

import { useRouter } from "next/navigation";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import CreatePillButton from "./CreatePillButton";

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
        <CreatePillButton
          label="My Clubs"
          icon="chevron"
          forceActive={isOpen}
          reverseShadow
          compactOnMobile
        />
      }
      items={items}
      align="right"
      minWidth={200}
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
    />
  );
}
