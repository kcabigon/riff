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
  const [friendNames, setFriendNames] = useState<string[] | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/pieces/${pieceId}${friendNames ? "?force=true" : ""}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409 && data.friendNames?.length) {
          setFriendNames(data.friendNames);
          return;
        }
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

  // "Alice" / "Alice and Bob" / "Alice, Bob, and Carol"
  const formatNames = (names: string[]) => {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
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
        {isDeleting ? "Deleting…" : friendNames ? "Delete anyway" : "Delete"}
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
      {friendNames && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#DC2626",
            margin: "12px 0 0 0",
            lineHeight: 1.6,
          }}
        >
          This piece grants Friend-status to {formatNames(friendNames)}.
          Deleting it will remove Friend-status and will require a new piece,
          riff, or club to establish Friend-status again.
        </p>
      )}
      {error && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#DC2626",
            margin: "12px 0 0 0",
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>
      )}
    </Modal>
  );
}
