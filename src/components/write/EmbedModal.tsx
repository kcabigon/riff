"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string, displayText?: string) => void;
  title: string;
  placeholder?: string;
  /** Show a display text field below the URL field */
  showDisplayText?: boolean;
}

export default function EmbedModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder = "https://...",
  showDisplayText = false,
}: EmbedModalProps) {
  const [url, setUrl] = useState("");
  const [displayText, setDisplayText] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setDisplayText("");
      setTimeout(() => urlRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }
    onConfirm(finalUrl, displayText.trim() || url.trim());
    onClose();
  };

  const footer = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <PrimaryButton onClick={handleSubmit} disabled={!url.trim()}>
        Add
      </PrimaryButton>
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          margin: 0,
          textAlign: "center",
        }}
      >
        Shortcut: paste the URL directly in the editor. Works for images too.
      </p>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <TextInput
          ref={urlRef}
          aria-label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit();
            }
          }}
        />
        {showDisplayText && (
          <TextInput
            aria-label="Display text"
            value={displayText}
            onChange={(e) => setDisplayText(e.target.value)}
            placeholder="Text to display (defaults to URL)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }
            }}
          />
        )}
      </div>
    </Modal>
  );
}
