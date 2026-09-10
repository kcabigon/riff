"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/shared/Modal";
import CTAButton from "@/components/CTAButton";
import { useDraftCreation } from "@/hooks/useDraftCreation";

interface StandaloneDraft {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  createdAt: string;
}

interface DraftChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  riffId: string;
}

// "New draft" is always the primary action; any standalone drafts to
// attach are listed right below it — one screen, no separate step.
export default function DraftChoiceModal({
  isOpen,
  onClose,
  riffId,
}: DraftChoiceModalProps) {
  const router = useRouter();
  const { createDraft, isCreating } = useDraftCreation();
  const [drafts, setDrafts] = useState<StandaloneDraft[] | null>(null);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDrafts(null);
      setAttachingId(null);
      setError(null);
      return;
    }

    fetch("/api/drafts")
      .then((res) => res.json())
      .then((data) => setDrafts(data.success ? data.pieces : []))
      .catch(() => setDrafts([]));
  }, [isOpen]);

  const handleAttach = async (pieceId: string) => {
    if (attachingId) return;
    setAttachingId(pieceId);
    setError(null);

    try {
      const res = await fetch(`/api/riffs/${riffId}/attach-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Couldn't attach that draft.");
        setAttachingId(null);
        return;
      }

      router.push(`/write/${pieceId}`);
    } catch {
      setError("Couldn't attach that draft.");
      setAttachingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start writing" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <CTAButton
          onClick={() => createDraft(riffId)}
          disabled={isCreating}
          style={{ width: "100%" }}
        >
          {isCreating ? "Creating…" : "New draft"}
        </CTAButton>

        {drafts === null && (
          <>
            <div style={{ borderTop: "1px solid #E6E6E6" }} />

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    width: "100%",
                    border: "2px solid #000000",
                    boxShadow: "8px 8px 0px 0px #000000",
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{
                      width: "50%",
                      height: "18px",
                      backgroundColor: "#E6E6E6",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "13px",
                        backgroundColor: "#F5F5F5",
                      }}
                    />
                    <div
                      style={{
                        width: "70%",
                        height: "13px",
                        backgroundColor: "#F5F5F5",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {drafts && drafts.length > 0 && (
          <>
            <div style={{ borderTop: "1px solid #E6E6E6" }} />

            {error && <p style={errorTextStyle}>{error}</p>}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {drafts.map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => handleAttach(draft.id)}
                  disabled={attachingId !== null}
                  onMouseEnter={(e) => {
                    if (attachingId === null) {
                      e.currentTarget.style.boxShadow =
                        "8px 8px 0px 0px #01EFFC";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "8px 8px 0px 0px #000000";
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "4px",
                    width: "100%",
                    textAlign: "left",
                    background: "#FFFFFF",
                    border: "2px solid #000000",
                    boxShadow: "8px 8px 0px 0px #000000",
                    padding: "12px 16px",
                    cursor: attachingId !== null ? "not-allowed" : "pointer",
                    opacity: attachingId && attachingId !== draft.id ? 0.5 : 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "18px",
                      fontWeight: 400,
                      lineHeight: 1.3,
                      color: "#000000",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                  >
                    {draft.title || "Untitled"}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "13px",
                      fontWeight: 300,
                      lineHeight: 1.5,
                      color: "#808080",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {attachingId === draft.id
                      ? "Attaching…"
                      : draft.preview || "No content yet"}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

const errorTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "12px",
  fontWeight: 300,
  color: "#DC2626",
  margin: 0,
};
