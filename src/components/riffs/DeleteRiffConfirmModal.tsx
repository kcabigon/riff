"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import DestructiveButton from "@/components/DestructiveButton";

interface DeleteRiffConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  riffId: string;
  riffTitle: string | null;
}

export default function DeleteRiffConfirmModal({
  isOpen,
  onClose,
  onDeleted,
  riffId,
  riffTitle,
}: DeleteRiffConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/riffs/${riffId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete riff");
        setIsDeleting(false);
        return;
      }

      onDeleted();
    } catch (err) {
      console.error("Error deleting riff:", err);
      setError("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete riff?" size="sm">
      <div
        style={{
          // eslint-disable-next-line riff/no-non-palette-colors -- destructive warning bg tint; pairs with the #DC2626 border below
          backgroundColor: "#FFF5F5",
          border: "2px solid #DC2626",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 8px",
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to delete &ldquo;{riffTitle || "Untitled"}
          &rdquo;?
        </p>
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
          This will permanently delete the riff and cannot be undone.
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
          Writers will keep their drafts, which will be detached from the riff.
        </p>
      </div>

      {error && (
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#FFFFFF",
            padding: "2px 8px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#DC2626",
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      )}

      <DestructiveButton
        size="lg"
        onClick={handleDelete}
        disabled={isDeleting}
        style={{ width: "100%", marginBottom: "16px" }}
      >
        {isDeleting ? "Deleting..." : "Delete riff"}
      </DestructiveButton>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={onClose}
          style={{
            backgroundColor: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            padding: "4px 12px",
            textDecoration: "underline",
          }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
