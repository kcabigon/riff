"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import CreatePillButton from "./CreatePillButton";
import CreateRiffModal from "@/components/riffs/CreateRiffModal";

export default function CreateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRiffModalOpen, setIsRiffModalOpen] = useState(false);
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
      onClick: () => setIsRiffModalOpen(true),
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
      <CreateRiffModal
        isOpen={isRiffModalOpen}
        onClose={() => setIsRiffModalOpen(false)}
        onCreated={(riffId) => {
          setIsRiffModalOpen(false);
          router.push(`/riffs/${riffId}`);
        }}
      />
    </>
  );
}
