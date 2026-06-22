"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import ReplyThread, { ReplyData, ReplyThreadHandle } from "./ReplyThread";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import CommentButton from "./CommentButton";
import DestructiveButton from "@/components/DestructiveButton";
import { timeAgo } from "@/lib/timeAgo";
import { CommentAuthor } from "@/types";

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
  replies: ReplyData[];
}

interface CommentModalProps {
  comments: CommentData[];
  currentUserId: string;
  currentUser: CommentAuthor;
  pieceId: string;
  riffId: string;
  clubId: string;
  authorColorMap: Record<string, string>;
  onClose: () => void;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, newContent: string) => Promise<void>;
  onReplyAdded: (commentId: string, reply: ReplyData) => void;
  onReplyUpdated: (
    commentId: string,
    replyId: string,
    newContent: string
  ) => void;
  onReplyDeleted: (commentId: string, replyId: string) => void;
}

export default function CommentModal({
  comments,
  currentUserId,
  currentUser,
  pieceId,
  riffId,
  clubId,
  authorColorMap,
  onClose,
  onDelete,
  onUpdate,
  onReplyAdded,
  onReplyUpdated,
  onReplyDeleted,
}: CommentModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyFocused, setReplyFocused] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [isConfirmingReplyDelete, setIsConfirmingReplyDelete] = useState(false);
  const [position, setPosition] = useState<{
    top?: string;
    bottom?: string;
    left: string;
    transform: string;
    maxHeight: string;
  }>({
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    maxHeight: "70vh",
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboardTriggerRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyAbortRef = useRef<AbortController | null>(null);
  const replyThreadRef = useRef<ReplyThreadHandle>(null);
  const trimmedReplyText = replyText.trim();

  useEffect(() => {
    return () => replyAbortRef.current?.abort();
  }, []);

  // When a reply textarea is focused or a reply is being edited, iOS fires a
  // scroll-to-focus on the page even though the textarea is inside a
  // position:fixed modal. This shifts which essay content is visible through
  // the backdrop below the card, making bright/white content appear nearly
  // white at 40% opacity. Snap back to the pre-focus scroll position to keep
  // the backdrop uniform.
  useEffect(() => {
    if (!replyFocused && !isEditingReply) return;
    const savedY = window.scrollY;
    let snapping = false;
    const onScroll = () => {
      if (snapping || Math.abs(window.scrollY - savedY) < 2) return;
      snapping = true;
      window.scrollTo(0, savedY);
      setTimeout(() => {
        snapping = false;
      }, 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [replyFocused, isEditingReply]);

  // Reposition above the iOS keyboard whenever any textarea is active.
  // When keyboard is active, anchor to the bottom of the visual viewport
  // (just above the keyboard) rather than centering, so there's no gap.
  useEffect(() => {
    if (!isEditing && !replyFocused && !isEditingReply) {
      setPosition({
        top: "50%",
        bottom: undefined,
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxHeight: "70vh",
      });
      return;
    }

    function updatePosition() {
      const vv = window.visualViewport;
      if (!vv) return;
      const bottomGap = window.innerHeight - (vv.offsetTop + vv.height);
      setPosition({
        top: undefined,
        bottom: `${bottomGap + 8}px`,
        left: `${vv.offsetLeft + vv.width / 2}px`,
        transform: "translateX(-50%)",
        maxHeight: `${vv.height - 16}px`,
      });
      if (scrollRef.current) {
        if (isEditingReply) {
          replyThreadRef.current?.scrollEditIntoView();
        } else if (replyFocused) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    }

    updatePosition();
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);
    return () => {
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [isEditing, replyFocused, isEditingReply]);

  // Expand textarea to full content height when edit mode opens, then
  // transfer focus from the hidden keyboard trigger input to the textarea
  useEffect(() => {
    if (!isEditing || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    setTimeout(() => {
      el.focus({ preventScroll: true });
    }, 100);
  }, [isEditing]);

  const isOpen = comments.length > 0;
  const comment = comments[currentIndex] ?? null;
  const hasMultiple = comments.length > 1;

  // Reset per-card state when navigating between comments
  useEffect(() => {
    setIsEditing(false);
    setEditContent(comment?.content ?? "");
    setConfirmingDelete(false);
    setIsEditingReply(false);
    setIsConfirmingReplyDelete(false);
    setReplyText("");
    if (replyTextareaRef.current)
      replyTextareaRef.current.style.height = "auto";
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentIndex, comment?.id]);

  // Fix 3: only reset index when which parent comments are shown changes,
  // not when reply data within them changes (e.g. reply added/edited/deleted)
  const commentIds = comments.map((c) => c.id).join(",");
  useEffect(() => {
    setCurrentIndex(0);
  }, [commentIds]);

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleReplySubmit = async () => {
    if (!comment || !trimmedReplyText || replySubmitting) return;
    setReplySubmitting(true);
    replyAbortRef.current = new AbortController();
    try {
      const res = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmedReplyText,
          pieceId,
          riffId,
          clubId,
          parentId: comment.id,
        }),
        signal: replyAbortRef.current.signal,
      });
      if (res.ok) {
        const { comment: created } = await res.json();
        onReplyAdded(comment.id, {
          id: created.id,
          content: created.content,
          authorId: created.authorId,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          author: created.author,
        });
        setReplyText("");
        if (replyTextareaRef.current)
          replyTextareaRef.current.style.height = "auto";
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error submitting reply:", err);
      }
    } finally {
      setReplySubmitting(false);
    }
  };

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
          bottom: position.bottom,
          left: position.left,
          transform: position.transform,
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
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            ref={scrollRef}
            style={{
              overflowY: "auto",
              padding:
                replyFocused || !comment?.replies.length
                  ? "16px"
                  : "16px 16px 32px",
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
                  <Avatar user={comment.author} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "13px",
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
                        fontSize: "11px",
                        fontWeight: 300,
                        color: "#808080",
                        marginLeft: "8px",
                      }}
                    >
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  {comment.authorId === currentUserId && !isEditing && (
                    <ThreeDotButton
                      variant="light"
                      align="right"
                      size="sm"
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
                    rows={3}
                    style={{
                      width: "100%",
                      resize: "none",
                      overflow: "hidden",
                      border: "1px solid #E6E6E6",
                      padding: "6px 8px",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px", // must stay 16px — iOS zooms on inputs < 16px
                      lineHeight: 1.6,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "13px",
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

                {/* Replies list — compose input is pinned below the scroll area */}
                {comment.replies.length > 0 && (
                  <div
                    style={{
                      marginTop: "12px",
                      borderTop: "1px solid #E6E6E6",
                      paddingTop: "12px",
                    }}
                  >
                    <ReplyThread
                      ref={replyThreadRef}
                      replies={comment.replies}
                      parentId={comment.id}
                      pieceId={pieceId}
                      riffId={riffId}
                      clubId={clubId}
                      currentUser={currentUser}
                      onReplyAdded={(reply) => onReplyAdded(comment.id, reply)}
                      onReplyUpdated={(replyId, newContent) =>
                        onReplyUpdated(comment.id, replyId, newContent)
                      }
                      onReplyDeleted={(replyId) =>
                        onReplyDeleted(comment.id, replyId)
                      }
                      onReplyEditStart={() => setIsEditingReply(true)}
                      onReplyEditEnd={() => setIsEditingReply(false)}
                      onReplyDeleteStart={() =>
                        setIsConfirmingReplyDelete(true)
                      }
                      onReplyDeleteEnd={() => setIsConfirmingReplyDelete(false)}
                      hideCompose
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Fade gradient — hidden during parent/reply editing (edit textarea needs the space) */}
          {comment &&
            comment.replies.length > 0 &&
            !isEditing &&
            !isEditingReply &&
            !replyFocused && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "64px",
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0), #FFFFFF)",
                  pointerEvents: "none",
                }}
              />
            )}
        </div>

        {/* Sticky compose — hidden during parent/reply editing or delete confirmation */}
        {comment &&
          !isEditing &&
          !isEditingReply &&
          !isConfirmingReplyDelete && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #E6E6E6",
                flexShrink: 0,
                backgroundColor: "#FFFFFF",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                }}
              >
                <Avatar user={currentUser} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <textarea
                    ref={replyTextareaRef}
                    value={replyText}
                    onFocus={() => setReplyFocused(true)}
                    onBlur={() => setReplyFocused(false)}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                        handleReplySubmit();
                    }}
                    placeholder="Reply..."
                    rows={1}
                    style={{
                      width: "100%",
                      resize: "none",
                      overflow: "hidden",
                      border: "2px solid #E6E6E6",
                      padding: "6px 8px",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px",
                      lineHeight: 1.5,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {trimmedReplyText && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "6px",
                      }}
                    >
                      <button
                        onClick={() => {
                          setReplyText("");
                          if (replyTextareaRef.current)
                            replyTextareaRef.current.style.height = "auto";
                          onClose();
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
                        onClick={handleReplySubmit}
                        disabled={replySubmitting}
                        loading={replySubmitting}
                      >
                        Post
                      </CommentButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Delete confirmation overlay — covers entire modal, same pattern as CommentSidebar */}
        {confirmingDelete && comment && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(248,248,248,0.97)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                textAlign: "center",
              }}
            >
              Delete this comment?
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                  try {
                    const res = await fetch(`/api/comments/${comment.id}`, {
                      method: "DELETE",
                    });
                    if (!res.ok) return;
                  } catch {
                    return;
                  }
                  onDelete(comment.id);
                  onClose();
                }}
              >
                Delete
              </DestructiveButton>
            </div>
          </div>
        )}

        {/* Reply edit strip — replaces compose + pager when editing a reply */}
        {isEditingReply && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "8px",
              padding: "12px 16px",
              borderTop: "1px solid #E6E6E6",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => replyThreadRef.current?.cancelEdit()}
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
            <CommentButton onClick={() => replyThreadRef.current?.saveEdit()}>
              Save
            </CommentButton>
          </div>
        )}

        {/* Bottom strip — Save/Cancel when editing parent, or pager (hidden during reply editing) */}
        {(isEditing || hasMultiple) && !isEditingReply && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isEditing ? "flex-end" : "space-between",
              gap: "8px",
              padding: "12px 16px",
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
