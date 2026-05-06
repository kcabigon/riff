"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import CommentButton from "./CommentButton";
import DestructiveButton from "@/components/DestructiveButton";

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

interface CommentModalProps {
  comments: CommentData[];
  currentUserId: string;
  onClose: () => void;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, newContent: string) => Promise<void>;
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

export default function CommentModal({
  comments,
  currentUserId,
  onClose,
  onDelete,
  onUpdate,
}: CommentModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOpen = comments.length > 0;
  const comment = comments[currentIndex] ?? null;
  const hasMultiple = comments.length > 1;

  // Reset per-card state when navigating between comments
  useEffect(() => {
    setIsEditing(false);
    setEditContent(comment?.content ?? "");
    setConfirmingDelete(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentIndex, comment?.id]);

  // Reset index when a new set of comments is opened
  useEffect(() => {
    setCurrentIndex(0);
  }, [comments]);

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!comment) return;
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onUpdate(comment.id, trimmed);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "calc(100vw - 48px)",
          maxHeight: "70vh",
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
          ref={scrollRef}
          style={{
            overflowY: "auto",
            padding: "16px",
            flex: 1,
            minHeight: 0,
          }}
        >
          {comment && (
            <>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Avatar user={comment.author} size={32} borderWidth={1} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#000000",
                    }}
                  >
                    {comment.author.name ||
                      comment.author.username ||
                      "Unknown"}
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
                {comment.authorId === currentUserId &&
                  !isEditing &&
                  !confirmingDelete && (
                    <ThreeDotButton
                      variant="light"
                      align="right"
                      items={[
                        {
                          type: "action",
                          label: "Edit",
                          onClick: () => {
                            setEditContent(comment.content);
                            setIsEditing(true);
                          },
                        },
                        {
                          type: "action",
                          label: "Delete",
                          color: "#DC2626",
                          onClick: () => setConfirmingDelete(true),
                        },
                      ]}
                    />
                  )}
              </div>

              {/* Quoted text */}
              <p
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "13px",
                  color: "#808080",
                  margin: "0 0 8px 0",
                  fontStyle: "italic",
                  borderLeft: "2px solid #01EFFC",
                  paddingLeft: "8px",
                  overflowWrap: "break-word",
                }}
              >
                {comment.selectedText}
              </p>

              {/* Body or edit mode */}
              {isEditing ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                        handleSave();
                      if (e.key === "Escape") {
                        setEditContent(comment.content);
                        setIsEditing(false);
                      }
                    }}
                    autoFocus
                    rows={4}
                    style={{
                      width: "100%",
                      resize: "none",
                      overflow: "hidden",
                      border: "1px solid #E6E6E6",
                      padding: "6px 8px",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px",
                      lineHeight: 1.6,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
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
                      onClick={() => {
                        setEditContent(comment.content);
                        setIsEditing(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "13px",
                        fontWeight: 300,
                        color: "#808080",
                      }}
                    >
                      Cancel
                    </button>
                    <CommentButton
                      onClick={handleSave}
                      disabled={saving || !editContent.trim()}
                      loading={saving}
                    >
                      Save
                    </CommentButton>
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: "#000000",
                    margin: 0,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                  }}
                >
                  {comment.content}
                </p>
              )}

              {/* Delete confirmation */}
              {confirmingDelete && (
                <div
                  style={{
                    marginTop: "16px",
                    borderTop: "1px solid #E6E6E6",
                    paddingTop: "12px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "14px",
                      fontWeight: 300,
                      color: "#000000",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Delete this comment?
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "13px",
                        fontWeight: 300,
                        color: "#808080",
                      }}
                    >
                      Cancel
                    </button>
                    <DestructiveButton
                      onClick={async () => {
                        await fetch(`/api/comments/${comment.id}`, {
                          method: "DELETE",
                        });
                        onDelete(comment.id);
                        onClose();
                      }}
                    >
                      Delete
                    </DestructiveButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pager — only when multiple comments at same point */}
        {hasMultiple && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              borderTop: "1px solid #E6E6E6",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              style={{
                background: "none",
                border: "none",
                cursor: currentIndex === 0 ? "default" : "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "20px",
                color: currentIndex === 0 ? "#CCCCCC" : "#000000",
                padding: "4px 8px",
                lineHeight: 1,
              }}
            >
              ‹
            </button>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
              }}
            >
              {currentIndex + 1} / {comments.length}
            </span>
            <button
              onClick={() =>
                setCurrentIndex((i) => Math.min(comments.length - 1, i + 1))
              }
              disabled={currentIndex === comments.length - 1}
              style={{
                background: "none",
                border: "none",
                cursor:
                  currentIndex === comments.length - 1 ? "default" : "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "20px",
                color:
                  currentIndex === comments.length - 1 ? "#CCCCCC" : "#000000",
                padding: "4px 8px",
                lineHeight: 1,
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </>
  );
}
