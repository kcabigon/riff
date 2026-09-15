"use client";

import { useRouter, usePathname } from "next/navigation";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import CreatePillButton from "./CreatePillButton";

interface ClubDropdownProps {
  clubs: Array<{
    id: string;
    name: string;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function ClubDropdown({
  clubs,
  isOpen,
  onToggle,
  onClose,
}: ClubDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();

  const items: DropdownItem[] = [
    ...clubs.map(
      (club): DropdownItem => ({
        type: "action",
        label: club.name,
        // Bold means "the club page you're currently on" — only meaningful
        // when you're actually viewing a club page. Elsewhere (e.g. Home),
        // no club matches the path, so nothing is bolded.
        active: pathname === `/clubs/${club.id}`,
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
        sessionStorage.setItem("pendingClubFrom", pathname);
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
