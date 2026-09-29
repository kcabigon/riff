"use client";

import { useLayoutEffect, useRef, useState } from "react";
import FormErrorText from "@/components/shared/FormErrorText";
import CommentButton from "@/components/read/CommentButton";

const promptTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  lineHeight: 1.5,
  color: "#000000",
  margin: 0,
};

// The current riff's prompt on the club page — the black left rule marks it as
// a note from the host. Hosts and co-hosts edit it in place: clicking the text
// turns that same text into the editing surface (no box, same type), and the
// rule goes green while it has focus. Everyone else just reads it.
export default function RiffPromptEditor({
  riffId,
  prompt: initialPrompt,
  canEdit,
  onSaved,
  style,
}: {
  riffId: string;
  prompt: string | null;
  canEdit: boolean;
  onSaved: () => void;
  style?: React.CSSProperties;
}) {
  // Shown value, updated on save so the edit lands before the refresh does.
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow with the text instead of scrolling inside a fixed box, so editing
  // looks like the prompt it replaced.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, isEditing]);

  if (!prompt && !canEdit) return null;

  const startEditing = () => {
    setDraft(prompt ?? "");
    setError(null);
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const save = async () => {
    const next = draft.trim() || null;
    if (next === prompt) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/riffs/${riffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save the prompt. Please try again.");
        return;
      }
      setPrompt(next);
      setIsEditing(false);
      onSaved();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const ruleColor = isEditing ? "#00FF66" : prompt ? "#000000" : "#CCCCCC";

  return (
    <div style={{ maxWidth: "780px", ...style }}>
      <div
        style={{
          borderLeft: `2px solid ${ruleColor}`,
          paddingLeft: "16px",
          transition: "border-color 0.15s ease",
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
            }}
            placeholder="Let's write about..."
            aria-label="Riff prompt"
            autoFocus
            // Caret at the end, not the start — an edit is usually a tweak.
            onFocus={(e) => {
              const end = e.target.value.length;
              e.target.setSelectionRange(end, end);
            }}
            readOnly={isSaving}
            rows={1}
            className="riff-prompt-input"
            style={{
              ...promptTextStyle,
              display: "block",
              width: "100%",
              padding: 0,
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              background: "transparent",
            }}
          />
        ) : canEdit ? (
          <p
            role="button"
            tabIndex={0}
            onClick={startEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                startEditing();
              }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={prompt ? "Edit prompt" : "Add a prompt"}
            style={{
              ...promptTextStyle,
              color: prompt ? "#000000" : "#9C9C9C",
              cursor: "text",
              // Hover tint bleeds into the padding instead of hugging the
              // glyphs, without shifting the text.
              margin: "-4px -8px",
              padding: "4px 8px",
              backgroundColor: isHovered ? "#F5F5F5" : "transparent",
              transition: "background-color 0.15s ease",
            }}
          >
            {prompt || "Add a prompt"}
          </p>
        ) : (
          <p style={promptTextStyle}>{prompt}</p>
        )}
      </div>

      {isEditing && (
        <>
          <FormErrorText message={error} />
          {/* Same Cancel + Save pair as editing a comment or reply. Unlike
              those, Save stays live on an empty box — that clears the prompt. */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              onClick={cancel}
              disabled={isSaving}
              style={{
                background: "none",
                border: "none",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 300,
                color: "#808080",
                padding: "4px 8px",
              }}
            >
              Cancel
            </button>
            <CommentButton onClick={save} loading={isSaving}>
              Save
            </CommentButton>
          </div>
        </>
      )}

      <style>{`
        .riff-prompt-input::placeholder {
          color: #9C9C9C;
        }
      `}</style>
    </div>
  );
}
