"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";

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

  const inputStyle = {
    width: "100%",
    backgroundColor: "#FFFFFF",
    border: "2px solid #000000",
    padding: "12px",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "16px",
    fontWeight: 300,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const footer = (
    <PrimaryButton onClick={handleSubmit} disabled={!url.trim()}>
      Add
    </PrimaryButton>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 500,
              color: "#000",
              display: "block",
              marginBottom: "6px",
            }}
          >
            URL
          </label>
          <input
            ref={urlRef}
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
            style={inputStyle}
          />
        </div>
        {showDisplayText && (
          <div>
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#000",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Display text
            </label>
            <input
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
              style={inputStyle}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
