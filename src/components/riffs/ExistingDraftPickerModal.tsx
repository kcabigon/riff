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
  existingPiece?: { id: string; title: string; wordCount: number } | null;
}

export default function ExistingDraftPickerModal({
  isOpen,
  onClose,
  riffId,
  existingPieceId,
  existingPiece,
}: ExistingDraftPickerModalProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    // Pre-select the currently attached draft if there is one
    setSelectedId(existingPieceId ?? null);
    fetch(`/api/riffs/${riffId}/eligible-drafts`)
      .then((res) => res.json())
      .then((data) => setDrafts(data.pieces ?? []))
      .finally(() => setLoading(false));
  }, [isOpen, riffId, existingPieceId]);

  const handleAttach = async () => {
    if (!selectedId) return;
    // If the selected draft is already the attached one, just navigate to it
    if (selectedId === existingPieceId) {
      router.push(`/write/${selectedId}`);
      return;
    }
    setAttaching(true);
    try {
      // Unlink the old piece first if swapping
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

  const DraftRow = ({
    id,
    title,
    wordCount,
    isCurrent,
  }: {
    id: string;
    title: string;
    wordCount: number;
    isCurrent?: boolean;
  }) => {
    const isSelected = selectedId === id;
    return (
      <button
        onClick={() => setSelectedId(id)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          border: `2px solid ${isSelected ? "#000000" : "#E0E0E0"}`,
          backgroundColor: isSelected ? "#F5F5F5" : "#FFFFFF",
          boxShadow: isSelected ? "4px 4px 0px 0px #000000" : "none",
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 500,
              fontSize: "15px",
              color: "#000000",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title || "Untitled"}
          </span>
          {isCurrent && (
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "11px",
                fontWeight: 400,
                color: "#FFFFFF",
                backgroundColor: "#000000",
                padding: "2px 6px",
                borderRadius: "2px",
                flexShrink: 0,
              }}
            >
              current
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
            color: "#888888",
            flexShrink: 0,
            marginLeft: "12px",
          }}
        >
          {wordCount > 0 ? `${wordCount} words` : "empty"}
        </span>
      </button>
    );
  };

  const hasOtherDrafts = drafts.length > 0;
  const isEmpty = !existingPiece && !hasOtherDrafts;

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
      ) : isEmpty ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            color: "#666666",
            margin: 0,
          }}
        >
          No drafts available. Start a new one instead.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Currently attached draft — always shown first */}
          {existingPiece && (
            <DraftRow
              id={existingPiece.id}
              title={existingPiece.title}
              wordCount={existingPiece.wordCount}
              isCurrent
            />
          )}

          {/* Divider if there are other drafts too */}
          {existingPiece && hasOtherDrafts && (
            <div
              style={{
                borderTop: "1px solid #E0E0E0",
                margin: "4px 0",
              }}
            />
          )}

          {/* Other eligible drafts */}
          {drafts.map((draft) => (
            <DraftRow
              key={draft.id}
              id={draft.id}
              title={draft.title}
              wordCount={draft.wordCount}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
