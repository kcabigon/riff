"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import CommentButton from "./CommentButton";
import DestructiveButton from "@/components/DestructiveButton";
import { timeAgo } from "@/lib/timeAgo";

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
  authorColorMap: Record<string, string>;
  onClose: () => void;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, newContent: string) => Promise<void>;
}

export default function CommentModal({
  comments,
  currentUserId,
  authorColorMap,
  onClose,
  onDelete,
  onUpdate,
}: CommentModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [position, setPosition] = useState({
    top: "50%",
    left: "50%",
    maxHeight: "70vh",
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboardTriggerRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When editing, reposition to stay above the iOS keyboard
  useEffect(() => {
    if (!isEditing) {
      setPosition({ top: "50%", left: "50%", maxHeight: "70vh" });
      return;
    }

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
  }, [isEditing]);

  // Expand textarea to full content height when edit mode opens
  useEffect(() => {
    if (!isEditing || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [isEditing]);

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
      {/* Hidden input — focused synchronously on edit tap to open iOS keyboard before textarea mounts */}
      <input
        ref={keyboardTriggerRef}
        type="text"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "fixed",
          top: -100,
          left: 0,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          fontSize: "16px",
        }}
      />

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
                            keyboardTriggerRef.current?.focus();
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

              <p
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "13px",
                  color: "#808080",
                  margin: "0 0 8px 0",
                  fontStyle: "italic",
                  borderLeft: `2px solid ${authorColorMap[comment.authorId] ?? "#01EFFC"}`,
                  paddingLeft: "8px",
                  overflowWrap: "break-word",
                }}
              >
                {comment.selectedText}
              </p>

              {isEditing ? (
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
                  ref={textareaRef}
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

        {/* Bottom strip — Save/Cancel when editing, pager when viewing multiple comments */}
        {(isEditing || hasMultiple) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isEditing ? "flex-end" : "space-between",
              gap: "8px",
              padding: "10px 16px",
              borderTop: "1px solid #E6E6E6",
              flexShrink: 0,
            }}
          >
            {isEditing ? (
              <>
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
              </>
            ) : (
              <>
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
                      currentIndex === comments.length - 1
                        ? "default"
                        : "pointer",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "20px",
                    color:
                      currentIndex === comments.length - 1
                        ? "#CCCCCC"
                        : "#000000",
                    padding: "4px 8px",
                    lineHeight: 1,
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
