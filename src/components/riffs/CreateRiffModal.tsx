"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import RiffFormFields from "./RiffFormFields";
import PrimaryButton from "@/components/PrimaryButton";
import ShareLinkOptions from "@/components/shared/ShareLinkOptions";
import { toEndOfDay } from "@/lib/riff-utils";

interface CreateRiffModalProps {
  /** Omit for a clubless (open) riff — invited by link instead of tied to a club. */
  clubId?: string;
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
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  };

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [deadline, setDeadline] = useState(getDefaultDeadline);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Clubless riffs only: after creation, show the invite link instead of
  // closing immediately — creating IS inviting for a clubless riff.
  const [step, setStep] = useState<"form" | "invite">("form");
  const [createdRiffId, setCreatedRiffId] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setPrompt("");
    setDeadline(getDefaultDeadline());
    setIsSubmitting(false);
    setStep("form");
    setCreatedRiffId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!deadline) {
      setError("Please set a deadline");
      setIsSubmitting(false);
      return;
    }

    // Clubless riffs have no club name to fall back on for display, so
    // (unlike club riffs, which can fall back to "Volume N") a real name
    // is required.
    if (!clubId && !title.trim()) {
      setError("Please name your riff");
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Create riff (starts as DRAFT)
      const createRes = await fetch(
        clubId ? `/api/clubs/${clubId}/riffs` : `/api/riffs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || null,
            prompt: prompt.trim() || null,
            deadline: deadline ? toEndOfDay(deadline) : null,
          }),
        }
      );

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

      setIsSubmitting(false);

      if (clubId) {
        // Club riffs land back on the club page immediately — no invite step.
        reset();
        onCreated(riff.id);
      } else {
        // Clubless riffs: show the invite link before handing off.
        setCreatedRiffId(riff.id);
        setStep("invite");
      }
    } catch (err) {
      console.error("Error creating riff:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    if (createdRiffId) {
      const riffId = createdRiffId;
      reset();
      onCreated(riffId);
    }
  };

  if (step === "invite" && createdRiffId) {
    const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/riffs/${createdRiffId}/join`;

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invite friends">
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <ShareLinkOptions url={joinUrl} shareText="Let's riff!" />

          <PrimaryButton onClick={handleDone}>Done</PrimaryButton>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={clubId ? "Let's riff" : "Riff with friends"}
    >
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
            titleRequired={!clubId}
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
            {isSubmitting
              ? "Creating..."
              : clubId
                ? "Start riff"
                : "Invite friends"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
