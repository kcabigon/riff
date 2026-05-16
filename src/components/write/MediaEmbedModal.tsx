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
}

const CONFIG = {
  youtube: {
    manualTitle: "Add YouTube video",
    confirmTitle: "Embed this video?",
    placeholder: "https://youtube.com/watch?v=...",
    validate: /(youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/,
    errorMessage: "Please enter a valid YouTube URL",
  },
  spotify: {
    manualTitle: "Add Spotify track",
    confirmTitle: "Embed this Spotify track?",
    placeholder: "https://open.spotify.com/track/...",
    validate: /open\.spotify\.com\/(track|album|playlist|episode|show)\//,
    errorMessage: "Please enter a valid Spotify URL",
  },
};

export default function MediaEmbedModal({
  isOpen,
  onClose,
  type,
  prefilledUrl,
  onEmbed,
}: MediaEmbedModalProps) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const config = CONFIG[type];
  const isPasteConfirm = !!prefilledUrl;

  useEffect(() => {
    if (isOpen && !isPasteConfirm) {
      setUrl("");
      setUrlError(null);
      setTimeout(() => urlRef.current?.focus(), 100);
    }
  }, [isOpen, isPasteConfirm]);

  const validate = (value: string): boolean => {
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return config.validate.test(normalized);
  };

  const handleEmbed = () => {
    const target = isPasteConfirm ? prefilledUrl! : url.trim();
    if (!target) return;
    if (!isPasteConfirm && !validate(target)) {
      setUrlError(config.errorMessage);
      return;
    }
    let finalUrl = target;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    onEmbed(finalUrl);
    onClose();
  };

  if (isPasteConfirm) {
    const footer = <PrimaryButton onClick={handleEmbed}>Embed</PrimaryButton>;

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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <PrimaryButton onClick={handleEmbed} disabled={!url.trim() || !!urlError}>
        Add
      </PrimaryButton>
      {type === "youtube" && (
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#FFFFFF",
            padding: "2px 8px",
          }}
        >
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
            Shortcut: paste the URL directly in the editor. Works for images
            too.
          </p>
        </div>
      )}
    </div>
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
          htmlFor="embed-url"
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
          id="embed-url"
          ref={urlRef}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) setUrlError(null);
          }}
          onBlur={() => {
            if (url.trim() && !validate(url.trim())) {
              setUrlError(config.errorMessage);
            }
          }}
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
            border: `2px solid ${urlError ? "#DC2626" : "#000000"}`,
            padding: "12px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {urlError && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#DC2626",
              margin: "6px 0 0",
            }}
          >
            {urlError}
          </p>
        )}
      </div>
    </Modal>
  );
}
