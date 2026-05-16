"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import RiffFormFields from "./RiffFormFields";
import PrimaryButton from "@/components/PrimaryButton";
import { toEndOfDay } from "@/lib/riff-utils";

interface CreateRiffModalProps {
  clubId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (riffId: string) => void;
}

export default function CreateRiffModal({
  clubId,
  isOpen,
  onClose,
  onCreated,
}: CreateRiffModalProps) {
  const getDefaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [deadline, setDeadline] = useState(getDefaultDeadline);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!deadline) {
      setError("Please set a deadline");
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Create riff (starts as DRAFT)
      const createRes = await fetch(`/api/clubs/${clubId}/riffs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          prompt: prompt.trim() || null,
          deadline: deadline ? toEndOfDay(deadline) : null,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        setError(data.error || "Failed to create riff");
        setIsSubmitting(false);
        return;
      }

      const { riff } = await createRes.json();

      // Step 2: Activate the riff immediately
      const activateRes = await fetch(`/api/riffs/${riff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (!activateRes.ok) {
        setError("Riff created but failed to activate. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success — reset and notify parent
      setTitle("");
      setPrompt("");
      setDeadline(getDefaultDeadline());
      setIsSubmitting(false);
      onCreated(riff.id);
    } catch (err) {
      console.error("Error creating riff:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start a new riff">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <RiffFormFields
            title={title}
            setTitle={setTitle}
            prompt={prompt}
            setPrompt={setPrompt}
            deadline={deadline}
            setDeadline={setDeadline}
            deadlineRequired
          />

          {error && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#FF4444",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <PrimaryButton type="submit" loading={isSubmitting}>
            {isSubmitting ? "Creating..." : "Start riff"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
