"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import CreatePillButton from "./CreatePillButton";
import CreateRiffOverlay from "@/components/riffs/CreateRiffOverlay";

export default function CreateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRiffOverlayOpen, setIsRiffOverlayOpen] = useState(false);
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
      label: "New riff",
      onClick: () => setIsRiffOverlayOpen(true),
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
    <>
      <Dropdown
        trigger={
          <CreatePillButton
            label="Create"
            icon="plus"
            iconLeading
            forceActive={isOpen}
          />
        }
        items={items}
        align="left"
        minWidth={200}
        isOpen={isOpen}
        onToggle={() => setIsOpen((o) => !o)}
        onClose={() => setIsOpen(false)}
      />
      <CreateRiffOverlay
        isOpen={isRiffOverlayOpen}
        onClose={() => setIsRiffOverlayOpen(false)}
        onCreated={(riffId) => {
          setIsRiffOverlayOpen(false);
          router.push(`/riffs/${riffId}`);
        }}
      />
    </>
  );
}
