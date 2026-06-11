"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "@/components/shared/Avatar";
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
  onReplyAdded: (reply: ReplyData) => void;
}

export default function ReplyThread({
  replies,
  parentId,
  pieceId,
  riffId,
  clubId,
  onReplyAdded,
}: ReplyThreadProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

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
      {replies.map((reply) => (
        <div
          key={reply.id}
          style={{ display: "flex", gap: "8px", marginBottom: "10px" }}
        >
          <Avatar user={reply.author} size={24} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "6px",
                marginBottom: "3px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
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
            </div>
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
          </div>
        </div>
      ))}

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
        rows={2}
        style={{
          width: "100%",
          resize: "none",
          overflow: "hidden",
          border: "1px solid #E6E6E6",
          padding: "6px 8px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "13px",
          lineHeight: 1.5,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "6px",
          visibility: text.trim() ? "visible" : "hidden",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={submitting}
          title="Send reply"
          style={{
            backgroundColor: submitting ? "#E6E6E6" : "#00FF66",
            border: `2px solid ${submitting ? "#9C9C9C" : "#000000"}`,
            borderRadius: 0,
            cursor: submitting ? "not-allowed" : "pointer",
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {submitting ? (
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                color: "#9C9C9C",
                lineHeight: 1,
              }}
            >
              …
            </span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M12.5 1.5L1 6L6 8L8 13L12.5 1.5Z"
                stroke="#000000"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 8L9.5 4.5"
                stroke="#000000"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
