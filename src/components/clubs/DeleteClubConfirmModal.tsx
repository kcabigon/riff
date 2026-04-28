"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";

interface DeleteClubConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  clubId: string;
  clubName: string;
}

export default function DeleteClubConfirmModal({
  isOpen,
  onClose,
  onDeleted,
  clubId,
  clubName,
}: DeleteClubConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText === clubName;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete club");
        setIsDeleting(false);
        return;
      }

      onDeleted();
    } catch (err) {
      console.error("Error deleting club:", err);
      setError("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  };

  const buttonDisabled = !isConfirmed || isDeleting;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete club?" size="sm">
      <div
        style={{
          backgroundColor: "#FFF5F5",
          border: "2px solid #DC2626",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#DC2626",
            margin: "0 0 4px",
            lineHeight: 1.5,
          }}
        >
          Members will lose access to the club and its riffs.
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Everyone keeps their pieces — they&apos;ll still appear on member
          profiles.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        <label
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#000000",
          }}
        >
          Type <strong>{clubName}</strong> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDelete()}
          placeholder={clubName}
          autoComplete="off"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            backgroundColor: "#FFFFFF",
            border: `2px solid ${isConfirmed ? "#DC2626" : "#000000"}`,
            padding: "12px 16px",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            if (!isConfirmed) e.target.style.borderColor = "#00FF66";
          }}
          onBlur={(e) => {
            if (!isConfirmed) e.target.style.borderColor = "#000000";
          }}
        />
      </div>

      {error && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#DC2626",
            margin: "0 0 16px",
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handleDelete}
        disabled={buttonDisabled}
        style={{
          backgroundColor: buttonDisabled ? "#E6E6E6" : "#DC2626",
          border: "2px solid #000000",
          boxShadow: buttonDisabled ? "none" : "8px 8px 0px 0px #000000",
          padding: "12px 48px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: buttonDisabled ? "#9C9C9C" : "#FFFFFF",
          cursor: buttonDisabled ? "not-allowed" : "pointer",
          width: "100%",
          marginBottom: "16px",
        }}
      >
        {isDeleting ? "Deleting..." : "Delete club"}
      </button>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
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
