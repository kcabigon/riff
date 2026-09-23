"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import Tagline from "@/components/Tagline";
import CadenceOptionList from "@/components/clubs/CadenceOptionList";
import {
  CADENCE_INTERVAL_OPTIONS,
  CADENCE_OTHER_OPTIONS,
  DEFAULT_CADENCE,
  cadenceStorageKey,
  CadenceValue,
} from "@/lib/cadence";

interface ClubCadenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
}

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
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Tagline
            text="Automatic"
            color="#01EFFC"
            textColor="#000000"
            fontSize={16}
            width={94}
            align="left"
          />
          <CadenceOptionList
            value={selected}
            options={CADENCE_INTERVAL_OPTIONS}
            onSelect={setSelected}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Tagline
            text="Other"
            color="#955CB5"
            textColor="#000000"
            fontSize={16}
            width={68}
            align="left"
          />
          <CadenceOptionList
            value={selected}
            options={CADENCE_OTHER_OPTIONS}
            onSelect={setSelected}
          />
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
