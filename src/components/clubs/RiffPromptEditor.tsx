"use client";

import { useState } from "react";
import TextInput from "@/components/TextInput";
import CTAButton from "@/components/CTAButton";
import IconButton from "@/components/shared/IconButton";
import FormErrorText from "@/components/shared/FormErrorText";
import { PencilIcon } from "@/components/shared/icons";

const promptTextStyle = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  margin: 0,
  lineHeight: 1.5,
};

// The current riff's prompt on the club page — the black left rule marks it as
// a note from the host. Hosts and co-hosts can edit it in place instead of
// digging into the 3-dot menu's Edit riff modal; everyone else just reads it.
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
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const wrapperStyle: React.CSSProperties = {
    borderLeft: `2px solid ${prompt || isEditing ? "#000000" : "#CCCCCC"}`,
    paddingLeft: "16px",
    maxWidth: "780px",
    ...style,
  };

  if (isEditing) {
    return (
      <div style={wrapperStyle}>
        <TextInput
          multiline
          rows={3}
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
        />
        <FormErrorText message={error} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginTop: "16px",
          }}
        >
          <CTAButton onClick={save} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </CTAButton>
          <button
            type="button"
            onClick={cancel}
            disabled={isSaving}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...wrapperStyle,
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
      }}
    >
      {canEdit ? (
        <p
          onClick={startEditing}
          style={{
            ...promptTextStyle,
            color: prompt ? "#000000" : "#9C9C9C",
            cursor: "text",
            flex: 1,
            minWidth: 0,
          }}
        >
          {prompt || "Add a prompt"}
        </p>
      ) : (
        <p style={{ ...promptTextStyle, color: "#000000" }}>{prompt}</p>
      )}
      {canEdit && (
        <IconButton
          onClick={startEditing}
          ariaLabel={prompt ? "Edit prompt" : "Add a prompt"}
        >
          {(color) => <PencilIcon color={color} size={14} />}
        </IconButton>
      )}
    </div>
  );
}
