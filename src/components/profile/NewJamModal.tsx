"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import Tagline from "@/components/Tagline";

interface NewJamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
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
  resize: "none",
};

const onFocusGreen = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  e.target.style.borderColor = "#00FF66";
};

const onBlurBlack = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  e.target.style.borderColor = "#000000";
};

export default function NewJamModal({ isOpen, onClose }: NewJamModalProps) {
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");

  const noteWordCount =
    note.trim() === "" ? 0 : note.trim().split(/\s+/).length;
  const noteOverLimit = noteWordCount > 250;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="What's your jam?">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Tagline
            text="What are you into right now?"
            color="#01EFFC"
            textColor="#000000"
            fontSize={16}
            width={290}
            align="left"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="A recent moment, an album on repeat, a new favorite place..."
            rows={2}
            style={inputStyle}
            onFocus={onFocusGreen}
            onBlur={onBlurBlack}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Tagline
            text="Why?"
            color="#EECF01"
            textColor="#000000"
            fontSize={16}
            width={64}
            align="left"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your mini riff on it..."
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              ...(noteOverLimit ? { borderColor: "#DC2626" } : {}),
            }}
            onFocus={onFocusGreen}
            onBlur={onBlurBlack}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: noteOverLimit ? "#DC2626" : "#9C9C9C",
              }}
            >
              {noteWordCount} / 250 words
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tagline
              text="Link"
              color="#C01582"
              textColor="#000000"
              fontSize={16}
              width={60}
              align="left"
            />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#9C9C9C",
              }}
            >
              optional
            </span>
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/..."
            style={{ ...inputStyle, resize: undefined }}
            onFocus={onFocusGreen}
            onBlur={onBlurBlack}
          />
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <PrimaryButton onClick={onClose} style={{ width: "100%" }}>
          Post jam
        </PrimaryButton>
      </div>
    </Modal>
  );
}
