"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import PromptLibrary from "./PromptLibrary";

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
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

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

      // Success — reset and notify parent
      setTitle("");
      setPrompt("");
      setDeadline("");
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
          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              Riff name <span style={{ color: "#959595" }}>(optional)</span>
            </label>
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
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              Prompt <span style={{ color: "#959595" }}>(optional)</span>
            </label>
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

          {/* Prompt library */}
          <PromptLibrary onSelect={(text) => setPrompt(text)} />

          {/* Deadline (optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              Deadline <span style={{ color: "#959595" }}>(optional)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? "#E6E6E6" : "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: isSubmitting ? "none" : "8px 8px 0px 0px #00FF66",
              padding: "12px 48px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "none",
              width: "100%",
            }}
          >
            {isSubmitting ? "Creating..." : "Start riff"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
