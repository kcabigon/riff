"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface PendingSelection {
  text: string;
  start: number;
  end: number;
  rect: DOMRect;
}

interface CommentAuthor {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface NewComment {
  id: string;
  content: string;
  pieceId: string;
  riffId: string;
  clubId: string;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

interface CommentPopoverProps {
  selection: PendingSelection;
  currentUser: CommentAuthor;
  pieceId: string;
  riffId: string;
  clubId: string;
  onSubmit: (comment: NewComment) => void;
  onClose: () => void;
}

const QUICK_EMOJIS = ["❤️", "🔥", "👏", "✨", "😂", "😭", "🙌", "💯", "👀", "🎉", "💔", "😍", "🤔", "😮", "💪", "🥹"];

function initials(user: CommentAuthor): string {
  if (user.name) return user.name[0].toUpperCase();
  if (user.username) return user.username[0].toUpperCase();
  return "?";
}

export default function CommentPopover({
  selection,
  currentUser,
  pieceId,
  riffId,
  clubId,
  onSubmit,
  onClose,
}: CommentPopoverProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Click-outside to dismiss
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;

      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const { url } = await res.json();
          setText((prev) => prev + `\n![image](${url})\n`);
        }
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    },
    []
  );

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text.trim(),
          pieceId,
          riffId,
          clubId,
          selectionStart: selection.start,
          selectionEnd: selection.end,
          selectedText: selection.text,
        }),
      });

      if (res.ok) {
        const { comment } = await res.json();
        onSubmit(comment);
        onClose();
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Desktop: position above the selection rect
  const desktopStyle: React.CSSProperties = isMobile
    ? {}
    : {
        position: "fixed",
        top: Math.max(8, selection.rect.top - 120 + window.scrollY),
        left: Math.max(
          8,
          Math.min(
            window.innerWidth - 360 - 8,
            selection.rect.left + selection.rect.width / 2 - 180
          )
        ),
        width: "360px",
        zIndex: 1000,
      };

  const mobileStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: "16px 16px 0 0",
      }
    : {};

  const combinedStyle: React.CSSProperties = {
    ...desktopStyle,
    ...mobileStyle,
    backgroundColor: "#FFFFFF",
    border: "2px solid #000000",
    boxShadow: "4px 4px 0 #000",
    padding: "12px",
  };

  return (
    <div ref={popoverRef} style={combinedStyle}>
      {/* Selected text quote */}
      <p
        style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "13px",
          color: "#808080",
          margin: "0 0 10px 0",
          fontStyle: "italic",
          borderLeft: "2px solid #00FF66",
          paddingLeft: "8px",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {selection.text}
      </p>

      {/* Input row */}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        {/* Avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#00FF66",
            border: "1px solid #000",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
            fontWeight: 700,
            overflow: "hidden",
          }}
        >
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials(currentUser)
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onPaste={handlePaste}
          placeholder="Write a comment..."
          rows={focused || text ? 3 : 1}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid #E6E6E6",
            borderRadius: "4px",
            padding: "6px 8px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            lineHeight: 1.5,
            outline: "none",
            transition: "height 0.15s ease",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
            if (e.key === "Escape") {
              onClose();
            }
          }}
        />
      </div>

      {/* Actions row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "8px",
        }}
      >
        {/* Emoji picker trigger */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowEmoji((s) => !s)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              padding: "4px",
              lineHeight: 1,
            }}
            title="Add emoji"
          >
            😊
          </button>

          {showEmoji && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                backgroundColor: "#FFFFFF",
                border: "2px solid #000",
                boxShadow: "4px 4px 0 #000",
                padding: "8px",
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: "4px",
                zIndex: 1010,
                width: "200px",
              }}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setText((prev) => prev + emoji);
                    setShowEmoji(false);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "2px",
                    lineHeight: 1,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cancel + Submit */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              color: "#808080",
              padding: "4px 8px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            style={{
              backgroundColor: text.trim() ? "#000000" : "#E6E6E6",
              border: "none",
              cursor: text.trim() ? "pointer" : "not-allowed",
              padding: "6px 16px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: text.trim() ? "#FFFFFF" : "#AFAFAF",
              borderRadius: "4px",
              transition: "background-color 0.1s ease",
            }}
          >
            {submitting ? "..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
