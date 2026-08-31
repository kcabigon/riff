"use client";

import { useState } from "react";
import PieceConfirmModal from "./PieceConfirmModal";

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (publishDate: string) => Promise<void>;
  onCoverAction: () => void;
  publishDisabled?: boolean;
  piece: {
    id: string;
    title: string;
    coverImage: string | null;
  };
}

const dateInputStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "12px",
  fontWeight: 300,
  color: "#000000",
  backgroundColor: "#FFFFFF",
  border: "2px solid #000000",
  padding: "6px 8px",
  outline: "none",
  WebkitAppearance: "none",
  appearance: "none",
};

const editLinkStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "12px",
  fontWeight: 300,
  color: "#000000",
  textDecoration: "underline",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

// YYYY-MM-DD in the viewer's local timezone — matches what a <input type="date"> expects.
const todayLocalDate = () => new Date().toLocaleDateString("en-CA");

export default function PublishConfirmModal({
  publishDisabled = false,
  onConfirm,
  ...props
}: PublishConfirmModalProps) {
  // Computed fresh on every render (not seeded once at mount) so a
  // never-touched field always reflects "today" even if this modal has
  // been sitting mounted since before a day boundary.
  const today = todayLocalDate();
  const [publishDateOverride, setPublishDateOverride] = useState<string | null>(
    null
  );
  const publishDate = publishDateOverride ?? today;
  const [isEditingDate, setIsEditingDate] = useState(false);

  return (
    <PieceConfirmModal
      {...props}
      onConfirm={() => onConfirm(publishDate)}
      title="Publish your piece"
      actionLabel="Publish"
      doneLabel="Published"
      disabled={publishDisabled}
      footerExtra={
        !publishDisabled && (
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            {isEditingDate ? (
              <input
                id="publish-date"
                aria-label="Published date"
                type="date"
                value={publishDate}
                max={today}
                required
                onChange={(e) => {
                  const value = e.target.value;
                  // Never let the field go empty or land in the future.
                  if (!value) return;
                  setPublishDateOverride(value > today ? today : value);
                }}
                style={dateInputStyle}
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDate(true)}
                style={editLinkStyle}
              >
                Edit publish date
              </button>
            )}
          </div>
        )
      }
      note={
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          This piece will appear on your profile once published. You can edit it
          anytime.
        </p>
      }
    />
  );
}
