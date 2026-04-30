"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import PrimaryButton from "@/components/PrimaryButton";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    // Delay focus to let positioning settle, and prevent scroll jump
    setTimeout(() => {
      textareaRef.current?.focus({ preventScroll: true });
    }, 100);
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

  // Desktop: no positioning (parent sidebar handles it)
  // Mobile: bottom sheet
  const style: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "4px 4px 0 #000",
        padding: "12px",
      }
    : {
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "4px 4px 0 #000",
        padding: "12px",
      };

  return (
    <div ref={popoverRef} style={style}>
      {/* Input row */}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        {/* Avatar */}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "#01EFFC",
            border: "1px solid #000",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
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
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onPaste={handlePaste}
          placeholder="Write a comment..."
          rows={3}
          style={{
            flex: 1,
            resize: "none",
            overflow: "hidden",
            border: "1px solid #E6E6E6",
            padding: "6px 8px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            lineHeight: 1.5,
            outline: "none",
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
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "8px",
          marginTop: "8px",
        }}
      >
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
        <PrimaryButton
          onClick={handleSubmit}
          disabled={!text.trim()}
          loading={submitting}
          style={{
            width: "auto",
            height: "32px",
            padding: "4px 20px",
            fontSize: "13px",
            boxShadow: text.trim() ? "4px 4px 0px 0px #000000" : "none",
          }}
          onMouseEnter={(e) => {
            if (text.trim()) {
              e.currentTarget.style.boxShadow = "4px 4px 0px 0px #01EFFC";
            }
          }}
          onMouseLeave={(e) => {
            if (text.trim()) {
              e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
            }
          }}
          onMouseDown={(e) => {
            if (text.trim()) {
              e.currentTarget.style.boxShadow = "2px 2px 0px 0px #01EFFC";
              e.currentTarget.style.transform = "translate(2px, 2px)";
            }
          }}
          onMouseUp={(e) => {
            if (text.trim()) {
              e.currentTarget.style.boxShadow = "4px 4px 0px 0px #01EFFC";
              e.currentTarget.style.transform = "translate(0, 0)";
            }
          }}
        >
          Post
        </PrimaryButton>
      </div>
    </div>
  );
}
