"use client";

import { useEffect, useRef } from "react";

export const REACTION_EMOJIS = ["❤️", "🔥", "‼️", "💯", "😭", "👏"];

export interface ReactionData {
  id: string;
  emoji: string;
  authorId: string;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
  };
}

interface PendingSelection {
  text: string;
  start: number;
  end: number;
  rect: DOMRect;
}

interface EmojiBarProps {
  selection: PendingSelection;
  isMobile: boolean;
  existingReactions: ReactionData[];
  currentUserId: string;
  onReact: (emoji: string) => void;
  onComment: () => void;
  onClose: () => void;
}

export default function EmojiBar({
  selection,
  isMobile,
  existingReactions,
  currentUserId,
  onReact,
  onComment,
  onClose,
}: EmojiBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  // Click outside to close (desktop only — mobile has a backdrop)
  useEffect(() => {
    if (isMobile) return;
    function handlePointerDown(e: PointerEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMobile, onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Which emojis has the current user already applied to this exact selection?
  const myReactedEmojis = new Set(
    existingReactions
      .filter(
        (r) =>
          r.authorId === currentUserId &&
          r.selectionStart === selection.start &&
          r.selectionEnd === selection.end
      )
      .map((r) => r.emoji)
  );

  if (isMobile) {
    return (
      <>
        {/* Tap-outside backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1099,
          }}
        />
        <div
          ref={barRef}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            backgroundColor: "#FFFFFF",
            borderTop: "2px solid #000000",
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            gap: "4px",
          }}
        >
          {REACTION_EMOJIS.map((emoji) => {
            const reacted = myReactedEmojis.has(emoji);
            return (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                style={{
                  flex: 1,
                  fontSize: "22px",
                  padding: "8px 4px",
                  backgroundColor: reacted ? "#00FF66" : "transparent",
                  border: `2px solid ${reacted ? "#000000" : "transparent"}`,
                  borderRadius: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {emoji}
              </button>
            );
          })}
          <div
            style={{
              width: "1px",
              height: "32px",
              backgroundColor: "#E6E6E6",
              flexShrink: 0,
              margin: "0 4px",
            }}
          />
          <button
            onClick={onComment}
            style={{
              background: "none",
              border: "none",
              borderRadius: 0,
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              fontWeight: 300,
              color: "#000000",
              whiteSpace: "nowrap",
              padding: "8px 4px",
              flexShrink: 0,
            }}
          >
            Comment…
          </button>
        </div>
      </>
    );
  }

  // Desktop: floating bar, fixed position relative to viewport
  const BAR_HEIGHT = 48;
  const BAR_WIDTH = 344;
  const GAP = 8;

  const showAbove = selection.rect.top > BAR_HEIGHT + GAP + 56; // 56px for sticky nav
  const top = showAbove
    ? selection.rect.top - BAR_HEIGHT - GAP
    : selection.rect.bottom + GAP;

  const selectionCenterX = selection.rect.left + selection.rect.width / 2;
  const leftRaw = selectionCenterX - BAR_WIDTH / 2;
  const left = Math.max(
    8,
    Math.min(leftRaw, window.innerWidth - BAR_WIDTH - 8)
  );

  return (
    <div
      ref={barRef}
      style={{
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 200,
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "4px 4px 0px 0px #000000",
        display: "flex",
        alignItems: "center",
        padding: "4px",
        gap: "2px",
      }}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const reacted = myReactedEmojis.has(emoji);
        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            onMouseEnter={(e) => {
              if (!reacted)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#F5F5F5";
            }}
            onMouseLeave={(e) => {
              if (!reacted)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
            }}
            style={{
              width: "36px",
              height: "36px",
              fontSize: "18px",
              backgroundColor: reacted ? "#00FF66" : "transparent",
              border: `2px solid ${reacted ? "#000000" : "transparent"}`,
              borderRadius: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.1s ease",
            }}
          >
            {emoji}
          </button>
        );
      })}
      <div
        style={{
          width: "1px",
          height: "28px",
          backgroundColor: "#E6E6E6",
          margin: "0 4px",
          flexShrink: 0,
        }}
      />
      <button
        onClick={onComment}
        style={{
          background: "none",
          border: "none",
          borderRadius: 0,
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#000000",
          padding: "0 8px",
          height: "36px",
          whiteSpace: "nowrap",
        }}
      >
        Comment…
      </button>
    </div>
  );
}
