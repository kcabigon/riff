"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

interface InviteOptionsProps {
  clubId: string;
  clubName?: string;
  /** If provided, use this URL directly instead of generating a token-based invite link */
  inviteUrl?: string;
}

export default function InviteOptions({
  clubId,
  clubName: clubNameProp,
  inviteUrl: inviteUrlProp,
}: InviteOptionsProps) {
  const [clubName, setClubName] = useState<string>(clubNameProp || "");
  const [inviteUrl, setInviteUrl] = useState(inviteUrlProp || "");
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLinkBox, setShowLinkBox] = useState(false);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  // Fetch club name on mount only if not provided as prop
  useEffect(() => {
    if (clubNameProp) return;

    const fetchClubName = async () => {
      try {
        const response = await fetch(`/api/clubs/${clubId}`);
        if (response.ok) {
          const data = await response.json();
          setClubName(data.club.name || "your club");
        }
      } catch (err) {
        console.error("Failed to fetch club name:", err);
        setClubName("your club");
      }
    };

    if (clubId) {
      fetchClubName();
    }
  }, [clubId, clubNameProp]);

  // Generate invite link — skipped if a static URL was provided
  const generateInviteLink = async () => {
    if (inviteUrl) return inviteUrl; // Already have a URL

    // If a static join URL was passed as prop, use it
    if (inviteUrlProp) {
      setInviteUrl(inviteUrlProp);
      return inviteUrlProp;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clubs/${clubId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate invite link");
      }

      const data = await response.json();
      setInviteUrl(data.invite.url);
      return data.invite.url;
    } catch (err: any) {
      console.error("Error generating invite link:", err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handler: Send a text
  const handleSendText = async () => {
    const url = await generateInviteLink();
    if (!url) return;

    const message = `Join ${clubName} on Riff! ${url}`;

    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          text: message,
        });
        return;
      } catch (err: any) {
        // User cancelled or error occurred
        if (err.name === "AbortError") return;
      }
    }

    // Fallback to SMS URI scheme
    const smsBody = encodeURIComponent(message);
    window.location.href = `sms:?&body=${smsBody}`;
  };

  // Handler: Generate link to share
  const handleGenerateLink = async () => {
    await generateInviteLink();
    setShowLinkBox(true);
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard");
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
          disabled={loading}
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
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
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
          disabled={loading}
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
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
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

      {/* Show link box when generated */}
      {showLinkBox && inviteUrl && (
        <div
          style={{
            padding: "12px",
            background: "#F5F5F5",
            border: "2px solid #000000",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            wordBreak: "break-all",
            color: "#000000",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div>{inviteUrl}</div>
          <button
            onClick={copyToClipboard}
            style={{
              padding: "8px 16px",
              background: "#FFFFFF",
              border: "2px solid #000000",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              cursor: "pointer",
            }}
          >
            {copySuccess ? "Copied!" : "Copy Link"}
          </button>
        </div>
      )}
    </div>
  );
}
