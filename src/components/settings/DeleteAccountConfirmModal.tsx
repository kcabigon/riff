"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Modal from "@/components/shared/Modal";

interface DeleteAccountConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountConfirmModal({
  isOpen,
  onClose,
}: DeleteAccountConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText === "DELETE";

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
      const res = await fetch("/api/users/me", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete account");
        setIsDeleting(false);
        return;
      }

      signOut({ callbackUrl: "/" });
    } catch {
      setError("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  };

  const buttonDisabled = !isConfirmed || isDeleting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete your account?"
      size="sm"
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          margin: "0 0 16px 0",
          lineHeight: 1.5,
        }}
      >
        This will permanently delete your account, all your pieces, and all your
        data. This cannot be undone.
      </p>

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
            color: "#808080",
          }}
        >
          Type <strong>DELETE</strong> to confirm:
        </label>
        <input
          autoFocus
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDelete()}
          placeholder="DELETE"
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
        {isDeleting ? "Deleting..." : "Delete my account"}
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
