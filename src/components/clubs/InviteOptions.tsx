"use client";

import { useState } from "react";
import TextInput from "@/components/TextInput";
import OnboardingButton from "@/components/onboarding/OnboardingButton";

interface InviteOptionsProps {
  clubId: string;
}

export default function InviteOptions({ clubId }: InviteOptionsProps) {
  const [emails, setEmails] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate invite link
  const generateInviteLink = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

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
      setSuccess("Invite link generated!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    if (!inviteUrl) {
      await generateInviteLink();
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  // Share via native share API (SMS/other)
  const shareViaSystem = async () => {
    if (!inviteUrl) {
      await generateInviteLink();
      return;
    }

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my club on Riff",
          text: "I'd love for you to join my club on Riff!",
          url: inviteUrl,
        });
      } catch (err: any) {
        // User cancelled or error occurred
        if (err.name !== "AbortError") {
          setError("Failed to share");
        }
      }
    } else {
      // Fallback to copying
      await copyToClipboard();
      setError("Share not supported. Link copied to clipboard instead.");
    }
  };

  // Send email invitations
  const sendEmailInvites = async () => {
    if (!emails.trim()) {
      setError("Please enter at least one email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Parse comma-separated emails
      const emailList = emails
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (emailList.length === 0) {
        throw new Error("Please enter at least one email address");
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailList.filter((e) => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email(s): ${invalidEmails.join(", ")}`);
      }

      const response = await fetch(`/api/clubs/${clubId}/invites/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailList }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send invitations");
      }

      const data = await response.json();
      setSuccess(
        `Successfully sent ${data.sentCount || emailList.length} invitation(s)!`
      );
      setEmails(""); // Clear input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Email Invitations */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "18px",
            fontWeight: 500,
            color: "#000000",
            margin: 0,
          }}
        >
          Invite by Email
        </h3>
        <TextInput
          type="text"
          placeholder="friend@example.com, another@example.com"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          disabled={loading}
        />
        <OnboardingButton
          onClick={sendEmailInvites}
          disabled={loading || !emails.trim()}
          loading={loading}
        >
          Send Email Invites
        </OnboardingButton>
      </div>

      {/* Shareable Link */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "18px",
            fontWeight: 500,
            color: "#000000",
            margin: 0,
          }}
        >
          Share Link
        </h3>
        {inviteUrl && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#F9F9F9",
              border: "2px solid #000000",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              wordBreak: "break-all",
              color: "#000000",
            }}
          >
            {inviteUrl}
          </div>
        )}
        <OnboardingButton
          onClick={copyToClipboard}
          disabled={loading}
          loading={loading}
          variant="secondary"
        >
          {copySuccess
            ? "Copied!"
            : inviteUrl
            ? "Copy Link"
            : "Generate Link"}
        </OnboardingButton>
      </div>

      {/* Share via SMS/System */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "18px",
            fontWeight: 500,
            color: "#000000",
            margin: 0,
          }}
        >
          Share via SMS
        </h3>
        <OnboardingButton
          onClick={shareViaSystem}
          disabled={loading}
          loading={loading}
          variant="secondary"
        >
          Share via SMS
        </OnboardingButton>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#00FF66",
            border: "2px solid #000000",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            color: "#000000",
          }}
        >
          {success}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#FFE6E6",
            border: "2px solid #FF0000",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            color: "#FF0000",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
