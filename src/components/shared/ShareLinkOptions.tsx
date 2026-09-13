"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Toast from "@/components/shared/Toast";

// Custom hook for responsive design
function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowWidth;
}

interface ShareLinkOptionsProps {
  /** The shareable URL — always provided by the caller (club/riff join links are plain, non-expiring URLs, not generated here). */
  url: string;
  /** Message used for the "Send a text" share/SMS fallback, e.g. "Join {name} on Riff!" */
  shareText: string;
}

export default function ShareLinkOptions({
  url,
  shareText,
}: ShareLinkOptionsProps) {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  // Handler: Send a text
  const handleSendText = async () => {
    const message = `${shareText} ${url}`;

    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          text: message,
        });
        return;
      } catch (err) {
        // User cancelled or error occurred
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    // Fallback to SMS URI scheme
    const smsBody = encodeURIComponent(message);
    window.location.href = `sms:?&body=${smsBody}`;
  };

  // Handler: Generate link to share — copies straight to clipboard,
  // no intermediate URL-preview step.
  const handleGenerateLink = async () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    try {
      await navigator.clipboard.writeText(url);
      setToast({ message: "Copied", type: "success" });
      toastTimeout.current = setTimeout(() => setToast(null), 2000);
    } catch {
      setToast({ message: "Couldn't copy link", type: "error" });
    }
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Two action boxes - responsive */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
        }}
      >
        {/* Box 1: Send a text */}
        <button
          onClick={handleSendText}
          style={{
            background: "#FFFFFF",
            border: "2px dashed #000000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "16px 12px",
            flex: isMobile ? "none" : 1,
            width: isMobile ? "100%" : "auto",
            height: isMobile ? "151px" : "auto",
            cursor: "pointer",
          }}
        >
          <Image
            src="/icons/invite_text.svg"
            alt="Send a text"
            width={26}
            height={42}
          />
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              textAlign: "center",
            }}
          >
            Send a text
          </p>
        </button>

        {/* Box 2: Generate link */}
        <button
          onClick={handleGenerateLink}
          style={{
            background: "#FFFFFF",
            border: "2px dashed #000000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "16px 12px",
            flex: isMobile ? "none" : 1,
            width: isMobile ? "100%" : "auto",
            height: isMobile ? "151px" : "auto",
            cursor: "pointer",
          }}
        >
          <Image
            src="/icons/invite_link.svg"
            alt="Generate a link to share"
            width={60}
            height={29}
          />
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              textAlign: "center",
            }}
          >
            Generate a link to share
          </p>
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={toast.type === "error" ? () => setToast(null) : undefined}
        />
      )}
    </div>
  );
}
