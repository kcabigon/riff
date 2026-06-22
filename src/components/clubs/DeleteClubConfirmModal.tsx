"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import TextInput from "@/components/TextInput";
import DestructiveButton from "@/components/DestructiveButton";

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
    } catch {
      setError("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  };

  const buttonDisabled = !isConfirmed || isDeleting;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete club?" size="sm">
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
          Members will lose access to the club and its riffs.
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
            fontSize: "12px",
            fontWeight: 300,
            color: "#000000",
          }}
        >
          Type <strong>{clubName}</strong> to confirm
        </label>
        <TextInput
          autoFocus
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDelete()}
          placeholder={clubName}
          autoComplete="off"
          style={isConfirmed ? { borderColor: "#DC2626" } : undefined} // override border to red when confirmed — TextInput's focus/blur handlers update it imperatively
        />
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

      <DestructiveButton
        size="lg"
        onClick={handleDelete}
        disabled={buttonDisabled}
        style={{ width: "100%", marginBottom: "16px" }}
      >
        {isDeleting ? "Deleting..." : "Delete club"}
      </DestructiveButton>

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
