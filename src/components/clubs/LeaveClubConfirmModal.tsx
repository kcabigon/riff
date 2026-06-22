"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";

interface LeaveClubConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeft: () => void;
  clubId: string;
  clubName: string;
  userId: string;
}

export default function LeaveClubConfirmModal({
  isOpen,
  onClose,
  onLeft,
  clubId,
  clubName,
  userId,
}: LeaveClubConfirmModalProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsLeaving(false);
    }
  }, [isOpen]);

  const handleLeave = async () => {
    setIsLeaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to leave club");
        setIsLeaving(false);
        return;
      }

      onLeft();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLeaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave club?" size="sm">
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "2px solid #DC2626",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#DC2626",
            margin: "0 0 4px",
            lineHeight: 1.6,
          }}
        >
          You&apos;ll lose access to {clubName} and its riffs.
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Your pieces stay on your profile — nothing is deleted.
        </p>
      </div>

      {error && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: "#DC2626",
            margin: "0 0 16px",
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handleLeave}
        disabled={isLeaving}
        style={{
          backgroundColor: isLeaving ? "#E6E6E6" : "#DC2626",
          border: "2px solid #000000",
          boxShadow: isLeaving ? "none" : "8px 8px 0px 0px #000000",
          padding: "12px 48px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: isLeaving ? "#9C9C9C" : "#FFFFFF",
          cursor: isLeaving ? "not-allowed" : "pointer",
          width: "100%",
          marginBottom: "16px",
        }}
      >
        {isLeaving ? "Leaving..." : "Leave club"}
      </button>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: "#808080",
            padding: "4px",
            textDecoration: "underline",
          }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
