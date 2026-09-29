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
  getCadenceLabel,
  isIntervalCadence,
} from "@/lib/cadence";
import { formatDateShort } from "@/lib/riff-utils";

interface CadenceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // riffOpened: the save moved the club onto a rhythm with no riff going, so
  // the server opened one — the page needs a refresh to show it.
  onUpdated: (cadence: CadenceValue, riffOpened: boolean) => void;
  clubId: string;
  cadence: CadenceValue;
  // The club's running riff, if any — whether saving opens one, and what the
  // helper line says happens to it.
  activeRiff: { deadline: string | null } | null;
}

export default function CadenceSettingsModal({
  isOpen,
  onClose,
  onUpdated,
  clubId,
  cadence,
  activeRiff,
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

  // Freestyle or Paused onto a rhythm, with nothing running, opens a riff on
  // save (see openRiffIfDue) — so the button says that instead of "Save".
  const willOpenRiff =
    !activeRiff && isIntervalCadence(selected) && !isIntervalCadence(cadence);

  // What the change means for the club, in one line under the options. The
  // cadence and a riff's deadline are easy to mix up mid-riff: a new cadence
  // never moves the running riff's deadline, and Freestyle clubs aren't
  // revealed by the cadence sweep.
  const helperText = (() => {
    if (selected === cadence) return null;
    if (willOpenRiff) {
      return "Saving starts a new riff now and emails the club.";
    }
    if (!activeRiff) return null;
    const when = activeRiff.deadline
      ? `on ${formatDateShort(activeRiff.deadline)}`
      : "at its deadline";
    if (selected === "MANUAL") {
      return "Your current riff won't reveal on its own. You'll reveal it when you're ready.";
    }
    if (selected === "PAUSED") {
      return `Your current riff still reveals ${when}. Automatic riffs will be paused.`;
    }
    return `Your current riff still ends ${when}, which you can change in the riff's settings. ${getCadenceLabel(selected)} starts with the next riff.`;
  })();

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

      const data = await res.json();
      setIsSubmitting(false);
      onUpdated(selected, data.riffOpened === true);
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

        {helperText && (
          // A white box, like the co-host modal's info box: plain text on the
          // noise background is hard to read.
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
              {helperText}
            </p>
          </div>
        )}

        <FormErrorText message={error} />

        <PrimaryButton
          type="button"
          onClick={handleSave}
          loading={isSubmitting}
          disabled={selected === cadence}
        >
          {willOpenRiff
            ? isSubmitting
              ? "Starting..."
              : "Let's riff"
            : isSubmitting
              ? "Saving..."
              : "Save"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
