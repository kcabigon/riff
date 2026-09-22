"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import CadenceDropdown from "@/components/clubs/CadenceDropdown";
import {
  CADENCE_OPTIONS,
  PAUSED_CADENCE_OPTION,
  DEFAULT_CADENCE,
  cadenceStorageKey,
  CadenceValue,
} from "@/lib/cadence";

interface ClubCadenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
}

const ALL_OPTIONS = [...CADENCE_OPTIONS, PAUSED_CADENCE_OPTION];

export default function ClubCadenceModal({
  isOpen,
  onClose,
  clubId,
}: ClubCadenceModalProps) {
  const [selected, setSelected] = useState<CadenceValue>(DEFAULT_CADENCE);

  // Clubs created before this mockup have no stored value — default to
  // Bi-weekly rather than showing nothing selected.
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem(
        cadenceStorageKey(clubId)
      ) as CadenceValue | null;
      setSelected(stored || DEFAULT_CADENCE);
    }
  }, [isOpen, clubId]);

  const handleSave = () => {
    localStorage.setItem(cadenceStorageKey(clubId), selected);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Riff cadence" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            lineHeight: 1.6,
            color: "#9C9C9C",
            backgroundColor: "#FFFFFF",
            padding: "2px 8px",
            alignSelf: "flex-start",
          }}
        >
          Your club always has a riff running — this sets how long each one
          lasts before it reveals. Change it anytime.
        </span>

        <CadenceDropdown
          value={selected}
          options={ALL_OPTIONS}
          onSelect={setSelected}
          openUp
        />

        <PrimaryButton
          type="button"
          onClick={handleSave}
          style={{ width: "100%" }}
        >
          Save
        </PrimaryButton>
      </div>
    </Modal>
  );
}
