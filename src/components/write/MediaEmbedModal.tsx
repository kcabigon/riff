"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";

interface MediaEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "youtube" | "spotify";
  /** If provided, shows paste-confirm UI instead of URL input */
  prefilledUrl?: string;
  onEmbed: (url: string) => void;
  onAddLink?: (url: string) => void;
}

const CONFIG = {
  youtube: {
    manualTitle: "Add YouTube video",
    confirmTitle: "Embed this video?",
    placeholder: "https://youtube.com/watch?v=...",
  },
  spotify: {
    manualTitle: "Add Spotify track",
    confirmTitle: "Embed this track?",
    placeholder: "https://open.spotify.com/track/...",
  },
};

export default function MediaEmbedModal({
  isOpen,
  onClose,
  type,
  prefilledUrl,
  onEmbed,
  onAddLink,
}: MediaEmbedModalProps) {
  const [url, setUrl] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  const config = CONFIG[type];
  const isPasteConfirm = !!prefilledUrl;

  useEffect(() => {
    if (isOpen && !isPasteConfirm) {
      setUrl("");
      setTimeout(() => urlRef.current?.focus(), 100);
    }
  }, [isOpen, isPasteConfirm]);

  const handleEmbed = () => {
    const target = isPasteConfirm ? prefilledUrl! : url.trim();
    if (!target) return;
    let finalUrl = target;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    onEmbed(finalUrl);
    onClose();
  };

  const handleAddLink = () => {
    if (!prefilledUrl || !onAddLink) return;
    onAddLink(prefilledUrl);
    onClose();
  };

  if (isPasteConfirm) {
    const footer = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          width: "100%",
        }}
      >
        <PrimaryButton onClick={handleEmbed}>Embed</PrimaryButton>
        <button
          onClick={handleAddLink}
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            background: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            padding: "0 8px 8px",
            textDecoration: "underline",
          }}
        >
          Add as link
        </button>
      </div>
    );

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={config.confirmTitle}
        size="sm"
        footer={footer}
      >
        {null}
      </Modal>
    );
  }

  const footer = (
    <PrimaryButton onClick={handleEmbed} disabled={!url.trim()}>
      Add
    </PrimaryButton>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.manualTitle}
      size="sm"
      footer={footer}
    >
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
          placeholder={config.placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              handleEmbed();
            }
          }}
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            padding: "12px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </Modal>
  );
}
