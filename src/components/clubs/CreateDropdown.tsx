"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import CreatePillButton from "./CreatePillButton";

// "New riff" is left out for now — it can't be wired up until the schema
// supports riffs that aren't tied to a club.
export default function CreateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { createDraft, isCreating } = useDraftCreation();
  const router = useRouter();
  const pathname = usePathname();

  const items: DropdownItem[] = [
    {
      type: "action",
      label: isCreating ? "Creating…" : "New draft",
      onClick: () => createDraft(),
    },
    {
      type: "action",
      label: "New club",
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
          label="Create"
          icon="plus"
          iconLeading
          forceActive={isOpen}
          compactOnMobile
        />
      }
      items={items}
      align="left"
      minWidth={200}
      isOpen={isOpen}
      onToggle={() => setIsOpen((o) => !o)}
      onClose={() => setIsOpen(false)}
    />
  );
}
