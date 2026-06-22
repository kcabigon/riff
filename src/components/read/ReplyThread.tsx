"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import Avatar from "@/components/shared/Avatar";
import CommentButton from "./CommentButton";
import DestructiveButton from "@/components/DestructiveButton";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import { timeAgo } from "@/lib/timeAgo";
import { CommentAuthor } from "@/types";
import { useIsMobile } from "@/hooks/useMediaQuery";

export interface ReplyData {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

// Exposed via forwardRef so CommentModal's strip can trigger save/cancel
export interface ReplyThreadHandle {
  saveEdit: () => void;
  cancelEdit: () => void;
  scrollEditIntoView: () => void;
}

interface ReplyThreadProps {
  replies: ReplyData[];
  parentId: string;
  pieceId: string;
  riffId: string;
  clubId: string;
  currentUser: CommentAuthor;
  onReplyAdded: (reply: ReplyData) => void;
  onReplyUpdated?: (replyId: string, newContent: string) => void;
  onReplyDeleted?: (replyId: string) => void;
  onReplyEditStart?: () => void;
  onReplyEditEnd?: () => void;
  onReplyDeleteStart?: () => void;
  onReplyDeleteEnd?: () => void;
  onCancel?: () => void;
  hideCompose?: boolean;
  isComposing?: boolean;
}

const ReplyThread = forwardRef<ReplyThreadHandle, ReplyThreadProps>(
  function ReplyThread(
    {
      replies,
      parentId,
      pieceId,
      riffId,
      clubId,
      currentUser,
      onReplyAdded,
      onReplyUpdated,
      onReplyDeleted,
      onReplyEditStart,
      onReplyEditEnd,
      onReplyDeleteStart,
      onReplyDeleteEnd,
      onCancel,
      hideCompose = false,
      isComposing = false,
    },
    ref
  ) {
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [hoveredReplyId, setHoveredReplyId] = useState<string | null>(null);
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
      null
    );
    const [deleting, setDeleting] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);
    const isMobile = useIsMobile();
    const textareaFontSize = isMobile ? "16px" : "13px";
    const trimmedText = text.trim();

    // Refs always mirror the latest values — updated during render so
    // useImperativeHandle's stable closures can read current state without
    // being recreated on every render.
    const editingReplyIdRef = useRef<string | null>(null);
    const editContentRef = useRef<string>("");
    const onReplyUpdatedRef = useRef(onReplyUpdated);
    const onReplyEditEndRef = useRef(onReplyEditEnd);
    editingReplyIdRef.current = editingReplyId;
    editContentRef.current = editContent;
    onReplyUpdatedRef.current = onReplyUpdated;
    onReplyEditEndRef.current = onReplyEditEnd;

    useEffect(() => {
      return () => abortRef.current?.abort();
    }, []);

    // Expand edit textarea and place cursor at the END of the content so the
    // user sees the last line first (most edits happen near the end).
    useEffect(() => {
      if (!editingReplyId || !editTextareaRef.current) return;
      const el = editTextareaRef.current;
      requestAnimationFrame(() => {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
        el.setSelectionRange(0, 0);
        el.scrollTop = 0;
        el.focus();
      });
    }, [editingReplyId]);

    const clearEditingReply = () => {
      setEditingReplyId(null);
      onReplyEditEndRef.current?.();
    };

    // Async save used both inline (Cmd+Enter / Save button) and imperatively
    // from CommentModal's strip. Uses refs so the imperative version is never stale.
    const doSaveById = async () => {
      const id = editingReplyIdRef.current;
      const content = editContentRef.current.trim();
      if (!id || !content) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/comments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          onReplyUpdatedRef.current?.(id, content);
          setEditingReplyId(null);
          onReplyEditEndRef.current?.();
        }
      } catch (err) {
        console.error("Error updating reply:", err);
      } finally {
        setSaving(false);
      }
    };

    // Expose save/cancel to CommentModal so the pinned strip can trigger them
    useImperativeHandle(
      ref,
      () => ({
        saveEdit: doSaveById,
        cancelEdit: clearEditingReply,
        scrollEditIntoView: () => {
          editTextareaRef.current?.scrollIntoView({
            block: "start",
            behavior: "instant",
          });
        },
      }),
      []
      // Empty deps intentional — closures use refs which are always current
    );

    const handleDeleteReply = async (replyId: string) => {
      setDeleting(true);
      try {
        const res = await fetch(`/api/comments/${replyId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          onReplyDeleted?.(replyId);
        }
        setConfirmingDeleteId(null);
        onReplyDeleteEnd?.();
      } catch (err) {
        console.error("Error deleting reply:", err);
        setConfirmingDeleteId(null);
        onReplyDeleteEnd?.();
      } finally {
        setDeleting(false);
      }
    };

    const handleSubmit = async () => {
      if (!trimmedText || submitting) return;
      const trimmed = trimmedText;
      setSubmitting(true);
      abortRef.current = new AbortController();
      try {
        const res = await fetch("/api/comments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: trimmed,
            pieceId,
            riffId,
            clubId,
            parentId,
          }),
          signal: abortRef.current.signal,
        });
        if (res.ok) {
          const { comment } = await res.json();
          onReplyAdded({
            id: comment.id,
            content: comment.content,
            authorId: comment.authorId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            author: comment.author,
          });
          setText("");
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error submitting reply:", err);
        }
      } finally {
        setSubmitting(false);
      }
    };

    // When hideCompose=true (modal context), Save/Cancel live in the modal's
    // pinned strip instead of inline — so we don't render them here.
    const showInlineSaveCancel = !hideCompose;

    return (
      <div>
        {replies
          .filter(
            (reply) =>
              !hideCompose || !editingReplyId || reply.id === editingReplyId
          )
          .map((reply) => {
            const isOwn = reply.authorId === currentUser.id;
            const isEditing = editingReplyId === reply.id;
            return (
              <div
                key={reply.id}
                data-reply-id={reply.id}
                onMouseEnter={() => setHoveredReplyId(reply.id)}
                onMouseLeave={() => setHoveredReplyId(null)}
                style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
              >
                <Avatar user={reply.author} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#000000",
                      }}
                    >
                      {reply.author.name || reply.author.username || "Unknown"}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "11px",
                        fontWeight: 300,
                        color: "#808080",
                      }}
                    >
                      {timeAgo(reply.createdAt)}
                    </span>
                    {isOwn &&
                      !isEditing &&
                      !trimmedText &&
                      !isComposing &&
                      confirmingDeleteId !== reply.id &&
                      (hoveredReplyId === reply.id || isMobile) && (
                        <div style={{ marginLeft: "auto" }}>
                          <ThreeDotButton
                            variant="light"
                            align="right"
                            size="sm"
                            items={[
                              {
                                type: "action",
                                label: "Edit",
                                onClick: () => {
                                  setConfirmingDeleteId(null);
                                  setEditContent(reply.content);
                                  setEditingReplyId(reply.id);
                                  onReplyEditStart?.();
                                },
                              },
                              {
                                type: "action",
                                label: "Delete",
                                color: "#DC2626",
                                onClick: () => {
                                  setConfirmingDeleteId(reply.id);
                                  onReplyDeleteStart?.();
                                },
                              },
                            ]}
                          />
                        </div>
                      )}
                  </div>

                  {confirmingDeleteId === reply.id ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "13px",
                          fontWeight: 300,
                          color: "#000000",
                        }}
                      >
                        Delete this reply?
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => {
                            setConfirmingDeleteId(null);
                            onReplyDeleteEnd?.();
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
                        <DestructiveButton
                          loading={deleting}
                          onClick={() => handleDeleteReply(reply.id)}
                        >
                          Delete
                        </DestructiveButton>
                      </div>
                    </div>
                  ) : isEditing ? (
                    <>
                      <textarea
                        ref={editTextareaRef}
                        value={editContent}
                        onChange={(e) => {
                          setEditContent(e.target.value);
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                            doSaveById();
                          if (e.key === "Escape") clearEditingReply();
                        }}
                        rows={1}
                        style={{
                          width: "100%",
                          resize: "none",
                          overflow: "hidden",
                          border: "1px solid #E6E6E6",
                          padding: "6px 8px",
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: textareaFontSize,
                          lineHeight: 1.5,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      {showInlineSaveCancel && (
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
                            onClick={() => clearEditingReply()}
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
                            onClick={() => doSaveById()}
                            disabled={saving || !editContent.trim()}
                            loading={saving}
                          >
                            Save
                          </CommentButton>
                        </div>
                      )}
                    </>
                  ) : (
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "13px",
                        fontWeight: 300,
                        color: "#000000",
                        margin: 0,
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {reply.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

        {!hideCompose && !editingReplyId && !confirmingDeleteId && (
          <div
            style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
          >
            <Avatar user={currentUser} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea
                ref={textareaRef}
                value={text}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  setText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                    handleSubmit();
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
                  fontSize: textareaFontSize,
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {trimmedText && (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel?.();
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmit();
                    }}
                    disabled={submitting}
                    loading={submitting}
                  >
                    Post
                  </CommentButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default ReplyThread;
