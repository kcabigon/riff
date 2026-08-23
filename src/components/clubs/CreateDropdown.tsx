"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useDraftCreation } from "@/hooks/useDraftCreation";

// "New riff" is left out for now — it can't be wired up until the schema
// supports riffs that aren't tied to a club.
export default function CreateDropdown() {
  const [isHovered, setIsHovered] = useState(false);
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
            Create
          </span>

          <Image
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
      onToggle={() => setIsOpen((o) => !o)}
      onClose={() => setIsOpen(false)}
    />
  );
}
