"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";

interface DeletePieceModalProps {
  pieceTitle: string;
  onClose: () => void;
  onDeleted: () => void;
  pieceId: string;
}

export default function DeletePieceModal({
  pieceTitle,
  onClose,
  onDeleted,
  pieceId,
}: DeletePieceModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete.");
        return;
      }
      onDeleted();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Delete piece?"
      size="sm"
      footer={
        <div
          style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
        >
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#DC2626",
              background: "none",
              border: "2px solid #DC2626",
              cursor: isDeleting ? "not-allowed" : "pointer",
              padding: "8px 16px",
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      }
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "15px",
          fontWeight: 300,
          color: "#000000",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Are you sure you want to delete{" "}
        <strong style={{ fontWeight: 700 }}>
          {pieceTitle || "this piece"}
        </strong>
        ? This can&apos;t be undone.
      </p>
      {error && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
            fontWeight: 300,
            color: "#DC2626",
            margin: "12px 0 0 0",
          }}
        >
          {error}
        </p>
      )}
    </Modal>
  );
}
