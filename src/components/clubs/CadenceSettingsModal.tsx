"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import Tagline from "@/components/Tagline";
import FormErrorText from "@/components/shared/FormErrorText";
import CadenceOptionList from "./CadenceOptionList";
import {
  CadenceValue,
  CADENCE_INTERVAL_OPTIONS,
  CADENCE_OTHER_OPTIONS,
} from "@/lib/cadence";

interface CadenceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (cadence: CadenceValue) => void;
  clubId: string;
  cadence: CadenceValue;
}

export default function CadenceSettingsModal({
  isOpen,
  onClose,
  onUpdated,
  clubId,
  cadence,
}: CadenceSettingsModalProps) {
  const [selected, setSelected] = useState<CadenceValue>(cadence);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to the saved value each time the modal opens, so an abandoned
  // change doesn't persist visually into the next open.
  useEffect(() => {
    if (isOpen) {
      setSelected(cadence);
      setError(null);
    }
  }, [isOpen, cadence]);

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadence: selected }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save cadence");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onUpdated(selected);
      onClose();
    } catch (err) {
      console.error("Error updating club cadence:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
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

        <FormErrorText message={error} />

        <PrimaryButton
          type="button"
          onClick={handleSave}
          loading={isSubmitting}
          disabled={selected === cadence}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
