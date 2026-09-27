"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import RiffFormFields from "./RiffFormFields";
import PrimaryButton from "@/components/PrimaryButton";
import { toEndOfDay, toLocalDateInputValue } from "@/lib/riff-utils";

interface EditRiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  riff: {
    id: string;
    title: string | null;
    prompt: string | null;
    deadline: string | null;
  };
  // True for club riffs, matching what CreateRiffModal already enforces there.
  // Clearing a club riff's deadline used to be possible here and nowhere else,
  // and on a club with an interval cadence it stopped the cadence sweep dead —
  // a riff with no deadline can't be revealed, extended, or replaced, so the
  // club silently stopped getting riffs. Clubless riffs genuinely have no
  // deadline, which is why this is a prop rather than always on.
  deadlineRequired?: boolean;
}

export default function EditRiffModal({
  isOpen,
  onClose,
  onUpdated,
  riff,
  deadlineRequired = false,
}: EditRiffModalProps) {
  const [title, setTitle] = useState(riff.title || "");
  const [prompt, setPrompt] = useState(riff.prompt || "");
  const [deadline, setDeadline] = useState(
    riff.deadline ? toLocalDateInputValue(riff.deadline) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deadlineRequired && !deadline) {
      setError("Please set a deadline");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/riffs/${riff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          prompt: prompt.trim() || null,
          deadline: deadline ? toEndOfDay(deadline) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update riff");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onUpdated();
    } catch (err) {
      console.error("Error updating riff:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit riff">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <RiffFormFields
            title={title}
            setTitle={setTitle}
            prompt={prompt}
            setPrompt={setPrompt}
            deadline={deadline}
            setDeadline={setDeadline}
            deadlineRequired={deadlineRequired}
          />

          {error && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#DC2626",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <PrimaryButton type="submit" loading={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
