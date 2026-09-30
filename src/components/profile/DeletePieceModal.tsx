"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import FormErrorText from "@/components/shared/FormErrorText";
import DestructiveButton from "@/components/DestructiveButton";

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
    <DestructiveButton
      size="lg"
      onClick={handleDelete}
      disabled={isDeleting}
      style={{ width: "100%" }}
    >
      {isDeleting ? "Deleting…" : friendNames ? "Delete anyway" : "Delete"}
    </DestructiveButton>
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
      <FormErrorText message={error} style={{ marginTop: "12px" }} />
    </Modal>
  );
}
