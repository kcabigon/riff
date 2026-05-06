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

interface SpotifyOEmbed {
  title: string;
  thumbnail_url: string;
  iframe_url: string;
}

const CONFIG = {
  youtube: {
    manualTitle: "Add YouTube video",
    placeholder: "https://youtube.com/watch?v=...",
    validate: /(youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/,
    errorMessage: "Please enter a valid YouTube URL",
  },
  spotify: {
    manualTitle: "Add Spotify track",
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
  onAddLink,
}: MediaEmbedModalProps) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [oEmbed, setOEmbed] = useState<SpotifyOEmbed | null>(null);
  const [oEmbedLoading, setOEmbedLoading] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const config = CONFIG[type];
  const isPasteConfirm = !!prefilledUrl;

  useEffect(() => {
    if (!isOpen) {
      setOEmbed(null);
      setOEmbedLoading(false);
      return;
    }
    if (!isPasteConfirm || !prefilledUrl || type !== "spotify") return;

    setOEmbed(null);
    setOEmbedLoading(true);
    let cancelled = false;

    fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(prefilledUrl)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setOEmbed(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setOEmbedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isPasteConfirm, prefilledUrl, type]);

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
    const target = isPasteConfirm
      ? oEmbed?.iframe_url || prefilledUrl!
      : url.trim();
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
        <PrimaryButton onClick={handleEmbed} disabled={oEmbedLoading}>
          Embed
        </PrimaryButton>
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
        title="Embed this?"
        size="sm"
        footer={footer}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {oEmbedLoading ? (
            <div
              style={{
                width: 72,
                height: 72,
                flexShrink: 0,
                backgroundColor: "#F5F5F5",
              }}
            />
          ) : oEmbed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={oEmbed.thumbnail_url}
              alt=""
              style={{
                width: 72,
                height: 72,
                flexShrink: 0,
                objectFit: "cover",
              }}
            />
          ) : null}
          {oEmbed && (
            <div>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#000000",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {oEmbed.title}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: "4px 0 0",
                }}
              >
                Spotify
              </p>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  const footer = (
    <PrimaryButton onClick={handleEmbed} disabled={!url.trim() || !!urlError}>
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
