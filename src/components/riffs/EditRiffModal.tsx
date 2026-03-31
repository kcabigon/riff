"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Tagline from "@/components/Tagline";
import PrimaryButton from "@/components/PrimaryButton";

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
          title: title.trim() || null,
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
          {/* Riff name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tagline
                text="Riff name"
                color="#01EFFC"
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tagline
                text="Prompt"
                color="#00FF66"
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tagline
                text="Deadline"
                color="#EECF01"
                textColor="#000000"
                fontSize={16}
                width={116}
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

          <PrimaryButton type="submit" loading={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
