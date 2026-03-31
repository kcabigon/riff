"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import PromptLibrary from "./PromptLibrary";
import Tagline from "@/components/Tagline";
import PrimaryButton from "@/components/PrimaryButton";

interface CreateRiffModalProps {
  clubId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
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

  const daysUntilDeadline = deadline
    ? Math.round(
        (new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

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
          deadline: deadline || null,
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

      // Step 3: Auto-join the creator as a participant
      await fetch(`/api/riffs/${riff.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Success — reset and notify parent
      setTitle("");
      setPrompt("");
      setDeadline(getDefaultDeadline());
      setIsSubmitting(false);
      onCreated();
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
          {/* Deadline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Tagline
              text="Deadline"
              color="#01EFFC"
              textColor="#000000"
              fontSize={16}
              width={116}
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                backgroundColor: "#FFFFFF",
                border: "2px solid #000000",
                padding: "12px 16px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#00FF66";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#000000";
              }}
            />
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#FFFFFF",
                padding: "2px 8px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#959595",
                alignSelf: "flex-start",
              }}
            >
              {daysUntilDeadline} days from today
            </span>
          </div>

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tagline
                text="Riff name"
                color="#00FF66"
                textColor="#000000"
                fontSize={16}
                width={124}
              />
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#FFFFFF",
                  padding: "2px 8px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#959595",
                }}
              >
                (optional)
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Stories"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                backgroundColor: "#FFFFFF",
                border: "2px solid #000000",
                padding: "12px 16px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#00FF66";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#000000";
              }}
            />
          </div>

          {/* Prompt (optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tagline
                text="Prompt"
                color="#EECF01"
                textColor="#000000"
                fontSize={16}
                width={96}
              />
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#FFFFFF",
                  padding: "2px 8px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#959595",
                }}
              >
                (optional)
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should club members write about?"
              rows={3}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                backgroundColor: "#FFFFFF",
                border: "2px solid #000000",
                padding: "12px 16px",
                outline: "none",
                width: "100%",
                resize: "vertical",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#00FF66";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#000000";
              }}
            />
          </div>

          {/* Prompt library — white background, centered */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "inline-block",
                backgroundColor: "#FFFFFF",
                padding: "2px 8px",
              }}
            >
              <PromptLibrary onSelect={(text) => setPrompt(text)} />
            </div>
          </div>

          {/* Error */}
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

          {/* Submit */}
          <PrimaryButton type="submit" loading={isSubmitting}>
            {isSubmitting ? "Creating..." : "Start riff"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
