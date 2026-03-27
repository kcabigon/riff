"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";

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
}

export default function EditRiffModal({
  isOpen,
  onClose,
  onUpdated,
  riff,
}: EditRiffModalProps) {
  const [title, setTitle] = useState(riff.title || "");
  const [prompt, setPrompt] = useState(riff.prompt || "");
  const [deadline, setDeadline] = useState(
    riff.deadline ? new Date(riff.deadline).toISOString().split("T")[0] : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/riffs/${riff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          prompt: prompt.trim() || null,
          deadline: deadline || null,
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
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          {/* Prompt */}
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

          {/* Deadline */}
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
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
