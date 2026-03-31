"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";

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
          display: "inline-block",
          backgroundColor: "#FFFFFF",
          padding: "2px 8px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to delete &ldquo;{riffTitle || "Untitled"}
          &rdquo;? This can&apos;t be undone.
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
              color: "#FF4444",
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        style={{
          backgroundColor: isDeleting ? "#E6E6E6" : "#FF4444",
          border: "2px solid #000000",
          boxShadow: isDeleting ? "none" : "8px 8px 0px 0px #000000",
          padding: "12px 48px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: isDeleting ? "#000000" : "#FFFFFF",
          cursor: isDeleting ? "not-allowed" : "pointer",
          transition: "none",
          width: "100%",
          marginBottom: "16px",
        }}
      >
        {isDeleting ? "Deleting..." : "Delete riff"}
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
