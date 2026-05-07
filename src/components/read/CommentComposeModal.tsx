"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "@/components/shared/Avatar";
import CommentButton from "./CommentButton";

interface CommentAuthor {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface PendingSelection {
  text: string;
  start: number;
  end: number;
  rect: DOMRect;
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

interface CommentComposeModalProps {
  selection: PendingSelection;
  currentUser: CommentAuthor;
  pieceId: string;
  riffId: string;
  clubId: string;
  quoteColor?: string;
  onSubmit: (comment: NewComment) => void;
  onClose: () => void;
}

export default function CommentComposeModal({
  selection,
  currentUser,
  pieceId,
  riffId,
  clubId,
  quoteColor = "#01EFFC",
  onSubmit,
  onClose,
}: CommentComposeModalProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState({
    top: "50%",
    left: "50%",
    maxHeight: "85vh",
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stay centered in the visible area above the keyboard
  useEffect(() => {
    function updatePosition() {
      const vv = window.visualViewport;
      if (!vv) return;
      setPosition({
        top: `${vv.offsetTop + vv.height / 2}px`,
        left: `${vv.offsetLeft + vv.width / 2}px`,
        maxHeight: `${vv.height * 0.85}px`,
      });
    }

    updatePosition();
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);
    return () => {
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus({ preventScroll: true });
    }, 100);
  }, []);

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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 900,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          transform: "translate(-50%, -50%)",
          width: "calc(100vw - 48px)",
          maxHeight: position.maxHeight,
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: "8px 8px 0px 0px #000000",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Scrollable content */}
        <div
          style={{
            overflowY: "auto",
            padding: "16px",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Header: current user */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Avatar user={currentUser} size={32} borderWidth={1} />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#000000",
              }}
            >
              {currentUser.name || currentUser.username || "You"}
            </span>
          </div>

          {/* Quoted text */}
          <p
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "13px",
              color: "#808080",
              margin: "0 0 12px 0",
              fontStyle: "italic",
              borderLeft: `2px solid ${quoteColor}`,
              paddingLeft: "8px",
              overflowWrap: "break-word",
            }}
          >
            {selection.text}
          </p>

          {/* Textarea — 16px prevents iOS auto-zoom on focus */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Write a comment..."
            rows={3}
            style={{
              width: "100%",
              resize: "none",
              overflow: "hidden",
              border: "1px solid #E6E6E6",
              padding: "8px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: 1.5,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            padding: "10px 16px",
            borderTop: "1px solid #E6E6E6",
            flexShrink: 0,
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
          <CommentButton
            onClick={handleSubmit}
            disabled={!text.trim()}
            loading={submitting}
          >
            Post
          </CommentButton>
        </div>
      </div>
    </>
  );
}
