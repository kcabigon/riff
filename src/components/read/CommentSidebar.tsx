"use client";

import { useEffect, useRef, useState } from "react";

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

interface CommentSidebarProps {
  comments: CommentData[];
  activeHighlightId: string | null;
  currentUserId: string;
  onDelete: (commentId: string) => void;
  onCommentClick?: (commentId: string) => void;
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

function CommentCard({
  comment,
  isActive,
  isOwn,
  onDelete,
}: {
  comment: CommentData;
  isActive: boolean;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      onDelete();
    } catch (err) {
      console.error("Error deleting comment:", err);
      setDeleting(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: isActive ? "2px solid #00FF66" : "2px solid #000000",
        backgroundColor: isActive ? "rgba(0,255,102,0.05)" : "#FFFFFF",
        boxShadow: "4px 4px 0 rgba(0,0,0,0.08)",
        padding: "12px",
        marginBottom: "12px",
        position: "relative",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
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
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials(comment.author)
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
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

        {/* Delete button — own comments only */}
        {isOwn && hovered && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete comment"
            style={{
              background: "none",
              border: "none",
              cursor: deleting ? "not-allowed" : "pointer",
              padding: "2px",
              color: "#808080",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3.5 3.5l.5 8h6l.5-8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Comment content */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 300,
          color: "#000000",
          margin: 0,
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {comment.content}
      </p>
    </div>
  );
}

export default function CommentSidebar({
  comments,
  activeHighlightId,
  currentUserId,
  onDelete,
  onCommentClick,
}: CommentSidebarProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  // Scroll active comment into view
  useEffect(() => {
    if (activeHighlightId && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeHighlightId]);

  if (comments.length === 0) {
    return (
      <div
        style={{
          width: "300px",
          flexShrink: 0,
          paddingTop: "32px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#AFAFAF",
            margin: 0,
            textAlign: "center",
          }}
        >
          No comments yet.
          <br />
          Select text to comment.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "300px",
        flexShrink: 0,
        paddingTop: "32px",
        maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
        position: "sticky",
        top: "80px",
        alignSelf: "flex-start",
      }}
    >
      {comments.map((comment) => {
        const isActive = comment.id === activeHighlightId;
        return (
          <div
            key={comment.id}
            ref={isActive ? activeRef : null}
            onClick={() => onCommentClick?.(comment.id)}
            style={{ cursor: "pointer" }}
          >
            <CommentCard
              comment={comment}
              isActive={isActive}
              isOwn={comment.authorId === currentUserId}
              onDelete={() => onDelete(comment.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
