"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";

interface DeletePieceModalProps {
  pieceId: string;
  pieceTitle: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeletePieceModal({
  pieceId,
  pieceTitle,
  onClose,
  onDeleted,
}: DeletePieceModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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

  const footer = (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        onMouseEnter={() => {
          if (!isDeleting) setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "100%",
          backgroundColor: isDeleting
            ? "#FFFFFF"
            : isHovered
              ? "#DC2626"
              : "#FFFFFF",
          border: isDeleting ? "2px solid #9C9C9C" : "2px solid #000000",
          boxShadow: isDeleting
            ? "none"
            : isHovered
              ? "8px 8px 0px 0px #000000"
              : "8px 8px 0px 0px #DC2626",
          padding: "12px 48px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: isDeleting ? "#9C9C9C" : "#000000",
          cursor: isDeleting ? "not-allowed" : "pointer",
          transition: "none",
        }}
      >
        {isDeleting ? "Deleting…" : "Delete"}
      </button>
      <button
        onClick={onClose}
        disabled={isDeleting}
        style={{
          background: "none",
          border: "none",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 300,
          color: "#808080",
          cursor: isDeleting ? "not-allowed" : "pointer",
          padding: "4px",
          textDecoration: "underline",
          textAlign: "center",
        }}
      >
        Cancel
      </button>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Delete piece?"
      size="sm"
      footer={footer}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
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
