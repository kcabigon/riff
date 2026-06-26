"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/shared/Avatar";
import CommentButton from "@/components/read/CommentButton";
import { relativeTime } from "@/lib/timeAgo";

interface FeedReply {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; avatarUrl: string | null };
}

interface FeedComment {
  id: string;
  content: string;
  createdAt: string;
  selectedText: string | null;
  author: { id: string; name: string | null; avatarUrl: string | null };
  piece: { id: string; title: string | null };
  replies: FeedReply[];
}

interface CurrentUser {
  id: string;
  name: string | null;
  username?: string | null;
  avatarUrl: string | null;
}

function latestActivity(comment: FeedComment): number {
  const base = new Date(comment.createdAt).getTime();
  if (comment.replies.length === 0) return base;
  return Math.max(
    base,
    new Date(comment.replies[comment.replies.length - 1].createdAt).getTime()
  );
}

export default function ActivityFeed({
  riffId,
  clubId,
  currentUser,
}: {
  riffId: string;
  clubId: string;
  currentUser: CurrentUser | null | undefined;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/riffs/${riffId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [riffId]);

  // Focus textarea when reply box opens
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const openReply = (commentId: string) => {
    if (replyingTo === commentId) return;
    setReplyingTo(commentId);
    setReplyText("");
  };

  const closeReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleSubmitReply = async (comment: FeedComment) => {
    const trimmed = replyText.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          pieceId: comment.piece.id,
          riffId,
          clubId,
          parentId: comment.id,
        }),
      });
      if (res.ok) {
        const { comment: newReply } = await res.json();
        const reply: FeedReply = {
          id: newReply.id,
          content: newReply.content,
          createdAt: newReply.createdAt,
          author: newReply.author,
        };
        setComments((prev) => {
          const updated = prev.map((c) =>
            c.id === comment.id ? { ...c, replies: [...c.replies, reply] } : c
          );
          return [...updated].sort(
            (a, b) => latestActivity(b) - latestActivity(a)
          );
        });
        closeReply();
      }
    } catch (err) {
      console.error("Error submitting reply:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: "20px 0",
                borderBottom: "1px solid #E6E6E6",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "12px",
                  backgroundColor: "#E6E6E6",
                  borderRadius: "2px",
                }}
              />
              <div
                style={{
                  width: "80%",
                  height: "12px",
                  backgroundColor: "#F5F5F5",
                  borderRadius: "2px",
                }}
              />
              <div
                style={{
                  width: "60%",
                  height: "12px",
                  backgroundColor: "#F5F5F5",
                  borderRadius: "2px",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          No comments yet — be the first to read and leave a note.
        </p>
      )}

      {/* Comment list */}
      {!loading && comments.length > 0 && (
        <div>
          {comments.map((comment, i) => {
            const firstName = comment.author.name?.split(" ")[0] ?? "Someone";
            const pieceTitle = comment.piece.title || "Untitled";
            const isReplying = replyingTo === comment.id;

            return (
              <div
                key={comment.id}
                onClick={() => openReply(comment.id)}
                style={{
                  paddingTop: i === 0 ? "0" : "20px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #E6E6E6",
                  cursor: "pointer",
                }}
              >
                {/* Author row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Avatar
                      user={{
                        id: comment.author.id,
                        name: comment.author.name,
                        username: null,
                        avatarUrl: comment.author.avatarUrl,
                      }}
                      size={32}
                      borderColor="#000000"
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#000000",
                      }}
                    >
                      {firstName}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      fontWeight: 300,
                      color: "#9C9C9C",
                    }}
                  >
                    {relativeTime(comment.createdAt)}
                  </span>
                </div>

                {/* Context block — piece title + optional quoted passage */}
                <div
                  style={{
                    borderLeft: "2px solid #E6E6E6",
                    paddingLeft: "12px",
                    marginBottom: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/read/${comment.piece.id}?riff=${riffId}`);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "16px",
                      fontWeight: 400,
                      color: "#000000",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    {pieceTitle}
                  </button>
                  {comment.selectedText && (
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "14px",
                        fontWeight: 300,
                        fontStyle: "italic",
                        color: "#808080",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      &ldquo;{comment.selectedText}&rdquo;
                    </p>
                  )}
                </div>

                {/* Comment text */}
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#000000",
                    margin: "0 0 0 0",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {comment.content}
                </p>

                {/* Threaded replies */}
                {comment.replies.length > 0 && (
                  <div
                    style={{
                      marginTop: "12px",
                      marginLeft: "16px",
                      borderLeft: "2px solid #E6E6E6",
                      paddingLeft: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {comment.replies.map((reply) => {
                      const replyFirst =
                        reply.author.name?.split(" ")[0] ?? "Someone";
                      return (
                        <div key={reply.id}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Avatar
                                user={{
                                  id: reply.author.id,
                                  name: reply.author.name,
                                  username: null,
                                  avatarUrl: reply.author.avatarUrl,
                                }}
                                size={24}
                                borderColor="#000000"
                              />
                              <span
                                style={{
                                  fontFamily: "var(--font-dm-sans)",
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  color: "#000000",
                                }}
                              >
                                {replyFirst}
                              </span>
                            </div>
                            <span
                              style={{
                                fontFamily: "var(--font-dm-sans)",
                                fontSize: "12px",
                                fontWeight: 300,
                                color: "#9C9C9C",
                              }}
                            >
                              {relativeTime(reply.createdAt)}
                            </span>
                          </div>
                          <p
                            style={{
                              fontFamily: "var(--font-dm-sans)",
                              fontSize: "14px",
                              fontWeight: 300,
                              color: "#000000",
                              margin: 0,
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline reply compose */}
                {isReplying && currentUser && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <Avatar
                      user={{
                        id: currentUser.id,
                        name: currentUser.name,
                        username: currentUser.username ?? null,
                        avatarUrl: currentUser.avatarUrl,
                      }}
                      size={32}
                      borderColor="#000000"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <textarea
                        ref={textareaRef}
                        value={replyText}
                        onChange={(e) => {
                          setReplyText(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                            handleSubmitReply(comment);
                          if (e.key === "Escape") closeReply();
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
                          fontSize: "14px",
                          fontWeight: 300,
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
                          onClick={closeReply}
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
                          onClick={() => handleSubmitReply(comment)}
                          disabled={submitting || !replyText.trim()}
                          loading={submitting}
                        >
                          Post
                        </CommentButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
