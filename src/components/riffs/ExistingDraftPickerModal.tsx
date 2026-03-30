"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";

interface Draft {
  id: string;
  title: string;
  wordCount: number;
  updatedAt: string;
}

interface ExistingDraftPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  riffId: string;
  existingPieceId?: string | null;
}

export default function ExistingDraftPickerModal({
  isOpen,
  onClose,
  riffId,
  existingPieceId,
}: ExistingDraftPickerModalProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSelectedId(null);
    fetch(`/api/riffs/${riffId}/eligible-drafts`)
      .then((res) => res.json())
      .then((data) => setDrafts(data.pieces ?? []))
      .finally(() => setLoading(false));
  }, [isOpen, riffId]);

  const handleAttach = async () => {
    if (!selectedId) return;
    setAttaching(true);
    try {
      // If swapping, unlink the old piece first
      if (existingPieceId) {
        await fetch(`/api/riffs/${riffId}/pieces/${existingPieceId}`, {
          method: "DELETE",
        });
      }
      const res = await fetch(`/api/riffs/${riffId}/pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId: selectedId }),
      });
      if (res.ok) {
        router.push(`/write/${selectedId}`);
      }
    } finally {
      setAttaching(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose a draft"
      size="sm"
      footer={
        <div style={{ display: "flex", gap: "12px" }}>
          <SecondaryButton onClick={onClose} style={{ padding: "12px 24px" }}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleAttach}
            disabled={!selectedId}
            loading={attaching}
            style={{ padding: "12px 24px" }}
          >
            Use this draft
          </PrimaryButton>
        </div>
      }
    >
      {loading ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            color: "#666666",
            margin: 0,
          }}
        >
          Loading drafts...
        </p>
      ) : drafts.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            color: "#666666",
            margin: 0,
          }}
        >
          No other drafts available. Start a new one instead.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {drafts.map((draft) => (
            <button
              key={draft.id}
              onClick={() => setSelectedId(draft.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                border: `2px solid ${selectedId === draft.id ? "#000000" : "#E0E0E0"}`,
                backgroundColor:
                  selectedId === draft.id ? "#F5F5F5" : "#FFFFFF",
                boxShadow:
                  selectedId === draft.id ? "4px 4px 0px 0px #000000" : "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 500,
                  fontSize: "15px",
                  color: "#000000",
                }}
              >
                {draft.title || "Untitled"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  color: "#888888",
                  flexShrink: 0,
                  marginLeft: "12px",
                }}
              >
                {draft.wordCount > 0 ? `${draft.wordCount} words` : "empty"}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
