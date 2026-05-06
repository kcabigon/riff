"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";

interface MediaEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "youtube" | "spotify";
  onEmbed: (url: string) => void;
}

const CONFIG = {
  youtube: {
    title: "Add YouTube video",
    placeholder: "https://youtube.com/watch?v=...",
    validate: /(youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/,
    errorMessage: "Please enter a valid YouTube URL",
  },
  spotify: {
    title: "Add Spotify track",
    placeholder: "https://open.spotify.com/track/...",
    validate: /open\.spotify\.com\/(track|album|playlist|episode|show)\//,
    errorMessage: "Please enter a valid Spotify URL",
  },
};

export default function MediaEmbedModal({
  isOpen,
  onClose,
  type,
  onEmbed,
}: MediaEmbedModalProps) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const config = CONFIG[type];

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setUrlError(null);
      setTimeout(() => urlRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const validate = (value: string): boolean => {
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return config.validate.test(normalized);
  };

  const handleEmbed = () => {
    const target = url.trim();
    if (!target) return;
    if (!validate(target)) {
      setUrlError(config.errorMessage);
      return;
    }
    let finalUrl = target;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    onEmbed(finalUrl);
    onClose();
  };

  const footer = (
    <PrimaryButton onClick={handleEmbed} disabled={!url.trim() || !!urlError}>
      Add
    </PrimaryButton>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
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
