"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import CadenceOptionCard from "@/components/clubs/CadenceOptionCard";
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
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            padding: "16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            How often this club gets a new riff. Change it anytime.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ALL_OPTIONS.map((option) => (
            <CadenceOptionCard
              key={option.value}
              option={option}
              selected={selected === option.value}
              onSelect={() => setSelected(option.value)}
            />
          ))}
        </div>

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
