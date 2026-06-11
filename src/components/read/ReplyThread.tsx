"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "@/components/shared/Avatar";
import CommentButton from "./CommentButton";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import { timeAgo } from "@/lib/timeAgo";
import { CommentAuthor } from "@/types";

export interface ReplyData {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
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
  onCancel?: () => void;
}

export default function ReplyThread({
  replies,
  parentId,
  pieceId,
  riffId,
  clubId,
  currentUser,
  onReplyAdded,
  onReplyUpdated,
  onCancel,
}: ReplyThreadProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoveredReplyId, setHoveredReplyId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!editingReplyId || !editTextareaRef.current) return;
    const el = editTextareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    el.focus();
  }, [editingReplyId]);

  const handleSaveEdit = async (replyId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/comments/${replyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        onReplyUpdated?.(replyId, trimmed);
        setEditingReplyId(null);
      }
    } catch (err) {
      console.error("Error updating reply:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
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

  return (
    <div>
      {replies.map((reply) => {
        const isOwn = reply.authorId === currentUser.id;
        const isEditing = editingReplyId === reply.id;
        return (
          <div
            key={reply.id}
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
                {isOwn && !isEditing && hoveredReplyId === reply.id && (
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
                            setEditContent(reply.content);
                            setEditingReplyId(reply.id);
                          },
                        },
                      ]}
                    />
                  </div>
                )}
              </div>

              {isEditing ? (
                <>
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                        handleSaveEdit(reply.id);
                      if (e.key === "Escape") setEditingReplyId(null);
                    }}
                    rows={1}
                    style={{
                      width: "100%",
                      resize: "none",
                      overflow: "hidden",
                      border: "2px solid #000000",
                      padding: "6px 8px",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px",
                      lineHeight: 1.5,
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
                      marginTop: "6px",
                    }}
                  >
                    <button
                      onClick={() => setEditingReplyId(null)}
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
                      onClick={() => handleSaveEdit(reply.id)}
                      disabled={saving || !editContent.trim()}
                      loading={saving}
                    >
                      Save
                    </CommentButton>
                  </div>
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

      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
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
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
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
          {text.trim() && (
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
    </div>
  );
}
