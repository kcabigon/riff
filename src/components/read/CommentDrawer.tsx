"use client";

import { useEffect, useRef } from "react";

interface CommentAuthor {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface CommentData {
  id: string;
  content: string;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

interface CommentDrawerProps {
  comment: CommentData | null;
  currentUserId: string;
  onClose: () => void;
  onDelete: (commentId: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(author: CommentAuthor): string {
  if (author.name) return author.name[0].toUpperCase();
  if (author.username) return author.username[0].toUpperCase();
  return "?";
}

export default function CommentDrawer({
  comment,
  currentUserId,
  onClose,
  onDelete,
}: CommentDrawerProps) {
  const startYRef = useRef<number | null>(null);

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const delta = e.changedTouches[0].clientY - startYRef.current;
    if (delta > 60) {
      onClose();
    }
    startYRef.current = null;
  };

  // Close on backdrop click
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isOpen = !!comment;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 900,
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          borderTop: "2px solid #000000",
          borderLeft: "2px solid #000000",
          borderRight: "2px solid #000000",
          borderRadius: "16px 16px 0 0",
          maxHeight: "60vh",
          overflowY: "auto",
          zIndex: 1000,
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "12px",
            paddingBottom: "8px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "#AFAFAF",
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "#808080",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {comment && (
          <div style={{ padding: "0 16px 24px" }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#01EFFC",
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
                {comment.author.avatarUrl ? (
                  <img
                    src={comment.author.avatarUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  initials(comment.author)
                )}
              </div>

              <div>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#000000",
                  }}
                >
                  {comment.author.name || comment.author.username || "Unknown"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#808080",
                    marginLeft: "8px",
                  }}
                >
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
            </div>

            {/* Quoted text */}
            <p
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "13px",
                color: "#808080",
                margin: "0 0 10px 0",
                fontStyle: "italic",
                borderLeft: "2px solid #01EFFC",
                paddingLeft: "8px",
              }}
            >
              {comment.selectedText}
            </p>

            {/* Comment content */}
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "15px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {comment.content}
            </p>

            {/* Delete — own comments */}
            {comment.authorId === currentUserId && (
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/comments/${comment.id}`, {
                      method: "DELETE",
                    });
                    onDelete(comment.id);
                    onClose();
                  } catch (err) {
                    console.error("Error deleting comment:", err);
                  }
                }}
                style={{
                  marginTop: "16px",
                  background: "none",
                  border: "1px solid #E6E6E6",
                  cursor: "pointer",
                  padding: "6px 12px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  color: "#808080",
                  borderRadius: "4px",
                }}
              >
                Delete comment
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
