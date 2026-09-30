"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import FormErrorText from "@/components/shared/FormErrorText";
import CadenceOptionList from "./CadenceOptionList";
import {
  CadenceValue,
  CADENCE_INTERVAL_OPTIONS,
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
  // notes say happens to it.
  activeRiff: { deadline: string | null } | null;
}

// The three modes, shown as tabs. Automatic holds the five rhythms; Freestyle
// and Pause are each a single choice, so their tab shows what the choice means
// in place of a list.
type Mode = "AUTOMATIC" | "MANUAL" | "PAUSED";

const MODES: Array<{ value: Mode; label: string }> = [
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "MANUAL", label: "Freestyle" },
  { value: "PAUSED", label: "Pause" },
];

function modeOf(cadence: CadenceValue): Mode {
  return isIntervalCadence(cadence) ? "AUTOMATIC" : (cadence as Mode);
}

const TEXT_STYLE = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  color: "#000000",
  margin: 0,
  lineHeight: 1.6,
} as const;

export default function CadenceSettingsModal({
  isOpen,
  onClose,
  onUpdated,
  clubId,
  cadence,
  activeRiff,
}: CadenceSettingsModalProps) {
  // Null on the Automatic tab until a rhythm is picked, when the club isn't on
  // one already — switching onto a rhythm can open a riff and email the club,
  // so it's never preselected.
  const [selected, setSelected] = useState<CadenceValue | null>(cadence);
  const [mode, setMode] = useState<Mode>(modeOf(cadence));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to the saved value each time the modal opens, so an abandoned
  // change doesn't persist visually into the next open.
  useEffect(() => {
    if (isOpen) {
      setSelected(cadence);
      setMode(modeOf(cadence));
      setError(null);
    }
  }, [isOpen, cadence]);

  const selectMode = (next: Mode) => {
    setMode(next);
    if (next === "AUTOMATIC") {
      setSelected(isIntervalCadence(cadence) ? cadence : null);
    } else {
      setSelected(next);
    }
  };

  // Freestyle or Paused onto a rhythm, with nothing running, opens a riff on
  // save (see openRiffIfDue) — so the button says that instead of "Save".
  const willOpenRiff =
    !activeRiff &&
    selected !== null &&
    isIntervalCadence(selected) &&
    !isIntervalCadence(cadence);

  const when = activeRiff?.deadline
    ? `on ${formatDateShort(activeRiff.deadline)}`
    : "at its deadline";

  // Under the rhythm list: only when picking one changes something. A new
  // cadence never moves the running riff's deadline, which is easy to assume
  // mid-riff.
  const automaticNote = (() => {
    if (selected === null || selected === cadence) return null;
    if (willOpenRiff)
      return "Saving starts a new riff now and emails the club.";
    if (!activeRiff) return null;
    return `Your current riff still ends ${when}, which you can change in the riff's settings. ${getCadenceLabel(selected)} starts with the next riff.`;
  })();

  // The Freestyle and Pause tabs' content. Button names match the club nav's
  // "Let's Riff" and the riff's "Reveal riff". Freestyle clubs aren't touched
  // by the cadence sweep, so a running riff waits for the host; paused ones
  // still reveal at the deadline.
  const freestyleText = (() => {
    if (cadence === "MANUAL") {
      return "You start riffs with Let's Riff, and hit Reveal riff when you're ready to unlock everyone's pieces.";
    }
    const off = isIntervalCadence(cadence)
      ? "You're turning automatic riffs off. "
      : "";
    return activeRiff
      ? `${off}Your current riff won't reveal on its own: hit Reveal riff when you're ready, then Let's Riff to start the next one.`
      : `${off}Start a riff with Let's Riff, and hit Reveal riff when you're ready to unlock everyone's pieces.`;
  })();

  const pauseText = (() => {
    const riffLine = activeRiff
      ? ` Your current riff still reveals ${when}.`
      : "";
    if (cadence === "PAUSED") {
      return `Automatic riffs are paused.${riffLine} Pick a rhythm under Automatic whenever you're ready to start again.`;
    }
    if (cadence === "MANUAL") {
      return activeRiff
        ? `Your club takes a break. Your current riff will now reveal on its own ${when}.`
        : "Your club takes a break until you pick a rhythm or switch back to Freestyle.";
    }
    return `Automatic riffs will be paused.${riffLine}`;
  })();

  const handleSave = async () => {
    if (selected === null) return;
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
        {/* A segmented bar styled like the rhythm list card. The active mode
            takes the palette's light gray. */}
        <div
          role="tablist"
          aria-label="Cadence mode"
          style={{
            display: "flex",
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px 0px #000000",
          }}
        >
          {MODES.map((m, i) => {
            const isActive = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectMode(m.value)}
                style={{
                  flex: 1,
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: isActive ? 500 : 300,
                  color: "#000000",
                  backgroundColor: isActive ? "#E6E6E6" : "#FFFFFF",
                  border: "none",
                  borderLeft: i === 0 ? "none" : "2px solid #000000",
                  padding: "12px 8px",
                  cursor: "pointer",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {mode === "AUTOMATIC" ? (
          <>
            <CadenceOptionList
              value={selected}
              options={CADENCE_INTERVAL_OPTIONS}
              onSelect={setSelected}
            />
            {automaticNote && <p style={TEXT_STYLE}>{automaticNote}</p>}
          </>
        ) : (
          <p style={TEXT_STYLE}>
            {mode === "MANUAL" ? freestyleText : pauseText}
          </p>
        )}

        <FormErrorText message={error} />

        <PrimaryButton
          type="button"
          onClick={handleSave}
          loading={isSubmitting}
          disabled={selected === null || selected === cadence}
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
