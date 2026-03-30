"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import Dropdown from "@/components/shared/Dropdown";
import ExistingDraftPickerModal from "@/components/riffs/ExistingDraftPickerModal";

interface RiffCTAButtonProps {
  riffId: string;
  isJoined: boolean;
  hasDraft: boolean;
  hasSubmitted: boolean;
  existingPieceId?: string | null;
  onJoin?: () => void;
  stopPropagation?: boolean;
}

export default function RiffCTAButton({
  riffId,
  isJoined,
  hasDraft,
  hasSubmitted,
  existingPieceId,
  onJoin,
  stopPropagation = false,
}: RiffCTAButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDraftPickerOpen, setIsDraftPickerOpen] = useState(false);
  const [isChangingDraft, setIsChangingDraft] = useState(false);
  const router = useRouter();
  const { createDraft } = useDraftCreation();

  const label = !isJoined
    ? "Join riff"
    : hasSubmitted
      ? "View submission"
      : hasDraft
        ? "Continue writing"
        : "Start writing";

  const buttonStyle = {
    backgroundColor: isHovered ? "#00FF66" : "#FFFFFF",
    border: "2px solid #000000",
    boxShadow: isHovered
      ? "8px 8px 0px 0px #000000"
      : isJoined
        ? "8px 8px 0px 0px #00FF66"
        : "8px 8px 0px 0px #01EFFC",
    padding: "12px 48px",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "16px",
    fontWeight: 300,
    lineHeight: "normal",
    color: "#000000",
    cursor: "pointer",
    transition: "none",
    whiteSpace: "nowrap" as const,
  };

  const handleJoin = async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    try {
      const res = await fetch(`/api/riffs/${riffId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok && onJoin) onJoin();
    } catch (err) {
      console.error("Error joining riff:", err);
    }
  };

  const handleContinueOrView = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (existingPieceId) {
      router.push(`/write/${existingPieceId}`);
    } else {
      createDraft(riffId);
    }
  };

  // "Start writing" — dropdown with New draft / Existing draft
  if (isJoined && !hasDraft && !hasSubmitted) {
    return (
      <div
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
        style={{ display: "contents" }}
      >
        <Dropdown
          align="right"
          minWidth={200}
          trigger={
            <button
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={buttonStyle}
            >
              Start writing
            </button>
          }
          items={[
            {
              type: "action",
              label: "New draft",
              onClick: () => createDraft(riffId),
            },
            {
              type: "action",
              label: "Existing draft",
              onClick: () => setIsDraftPickerOpen(true),
            },
          ]}
        />
        <ExistingDraftPickerModal
          isOpen={isDraftPickerOpen}
          onClose={() => setIsDraftPickerOpen(false)}
          riffId={riffId}
        />
      </div>
    );
  }

  // "Continue writing" — dropdown with change/remove options
  if (isJoined && hasDraft && !hasSubmitted) {
    return (
      <div
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
        style={{ display: "contents" }}
      >
        <Dropdown
          align="right"
          minWidth={200}
          trigger={
            <button
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={buttonStyle}
            >
              Continue writing
            </button>
          }
          items={[
            {
              type: "action",
              label: "Continue writing",
              onClick: () =>
                existingPieceId && router.push(`/write/${existingPieceId}`),
            },
            {
              type: "action",
              label: "Change draft",
              onClick: () => setIsChangingDraft(true),
            },
            { type: "divider" },
            {
              type: "action",
              label: "Remove from riff",
              color: "#FF6B35",
              onClick: async () => {
                if (!existingPieceId) return;
                if (stopPropagation) return; // riff card context — skip, too destructive
                await fetch(`/api/riffs/${riffId}/pieces/${existingPieceId}`, {
                  method: "DELETE",
                });
                router.refresh();
              },
            },
          ]}
        />
        <ExistingDraftPickerModal
          isOpen={isChangingDraft}
          onClose={() => setIsChangingDraft(false)}
          riffId={riffId}
          existingPieceId={existingPieceId}
        />
      </div>
    );
  }

  return (
    <button
      onClick={isJoined ? handleContinueOrView : handleJoin}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={buttonStyle}
    >
      {label}
    </button>
  );
}
