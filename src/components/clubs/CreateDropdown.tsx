"use client";

import { useState } from "react";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import {
  useCreationOverlay,
  riffCreatedPath,
  clubCreatedPath,
} from "@/hooks/useCreationOverlay";
import CreatePillButton from "./CreatePillButton";
import CreateRiffOverlay from "@/components/riffs/CreateRiffOverlay";
import CreateClubOverlay from "./CreateClubOverlay";

export default function CreateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const riffOverlay = useCreationOverlay(riffCreatedPath);
  const clubOverlay = useCreationOverlay(clubCreatedPath);
  const { createDraft, isCreating } = useDraftCreation();

  const items: DropdownItem[] = [
    {
      type: "action",
      label: isCreating ? "Creating…" : "New draft",
      onClick: () => createDraft(),
    },
    {
      type: "action",
      label: "New riff",
      onClick: riffOverlay.open,
    },
    {
      type: "action",
      label: "New club",
      onClick: clubOverlay.open,
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
        isOpen={riffOverlay.isOpen}
        onClose={riffOverlay.close}
        onCreated={riffOverlay.onCreated}
      />
      <CreateClubOverlay
        isOpen={clubOverlay.isOpen}
        onClose={clubOverlay.close}
        onCreated={clubOverlay.onCreated}
      />
    </>
  );
}
