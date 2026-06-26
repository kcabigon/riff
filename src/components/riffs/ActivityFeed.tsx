"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/shared/Avatar";
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

interface ContributionMember {
  user: { id: string; name: string | null; avatarUrl: string | null };
  readCount: number;
  commentCount: number;
}

export default function ActivityFeed({
  riffId,
  contributionData = [],
  totalPieces = 0,
}: {
  riffId: string;
  contributionData?: ContributionMember[];
  totalPieces?: number;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/riffs/${riffId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [riffId]);

  const totalReads = contributionData.reduce((sum, m) => sum + m.readCount, 0);
  const totalComments = contributionData.reduce(
    (sum, m) => sum + m.commentCount,
    0
  );

  return (
    <div>
      {/* Activity header — reading progress + member stats */}
      {contributionData.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "20px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Activity
            </h2>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
              }}
            >
              {totalReads} {totalReads === 1 ? "read" : "reads"} &middot;{" "}
              {totalComments} {totalComments === 1 ? "comment" : "comments"}
            </p>
          </div>

          {/* Member cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "0",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {contributionData.map(({ user, readCount, commentCount }) => {
              const firstName = user.name?.split(" ")[0] ?? "—";
              const readFraction =
                totalPieces > 0 ? readCount / totalPieces : 0;
              return (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    minWidth: "88px",
                    padding: "16px 12px",
                    borderRight: "1px solid #E6E6E6",
                  }}
                >
                  <Avatar
                    user={{
                      id: user.id,
                      name: user.name,
                      username: null,
                      avatarUrl: user.avatarUrl,
                    }}
                    size={40}
                    borderColor="#000000"
                  />
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#000000",
                      margin: 0,
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {firstName}
                  </p>

                  {/* Read progress bar */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#E6E6E6",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${readFraction * 100}%`,
                          height: "100%",
                          backgroundColor: "#000000",
                        }}
                      />
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "11px",
                        fontWeight: 300,
                        color: "#808080",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      {readCount}/{totalPieces} read
                    </p>
                  </div>

                  {commentCount > 0 && (
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "11px",
                        fontWeight: 300,
                        color: "#9C9C9C",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      {commentCount}{" "}
                      {commentCount === 1 ? "comment" : "comments"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid #E6E6E6", marginTop: "0" }} />
        </div>
      )}

      {/* Comment stream heading */}
      <h2
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "20px",
          fontWeight: 300,
          color: "#000000",
          margin: "0 0 20px 0",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Comments
      </h2>

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
            fontSize: "16px",
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

            return (
              <div
                key={comment.id}
                style={{
                  paddingTop: i === 0 ? "0" : "20px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #E6E6E6",
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

                {/* Quoted passage */}
                {comment.selectedText && (
                  <div
                    style={{
                      borderLeft: "2px solid #E6E6E6",
                      paddingLeft: "12px",
                      marginBottom: "8px",
                    }}
                  >
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
                  </div>
                )}

                {/* Comment text */}
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: "#000000",
                    margin: "0 0 8px 0",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {comment.content}
                </p>

                {/* Piece attribution */}
                <button
                  onClick={() =>
                    router.push(`/read/${comment.piece.id}?riff=${riffId}`)
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "13px",
                    fontWeight: 300,
                    color: "#808080",
                    display: "inline",
                  }}
                >
                  on{" "}
                  <span
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "#000000",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    {pieceTitle}
                  </span>
                </button>

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
                                  fontSize: "13px",
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
                                fontSize: "11px",
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
