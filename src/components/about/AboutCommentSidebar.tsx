"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const FOUNDER_COLORS: Record<string, string> = {
  Jarric: "#01EFFC",
  Chris: "#00FF66",
  Kyle: "#EECF01",
  Derek: "#FF6B35",
  Kyla: "#C01582",
};

interface YoutubeEmbed {
  type: "youtube";
  videoId: string;
  url: string;
}

export interface SidebarComment {
  id: string;
  author: string;
  avatarSrc: string;
  text?: string;
  embed?: YoutubeEmbed;
  replies?: { author: string; avatarSrc: string; text: string }[];
}

interface AboutCommentSidebarProps {
  comments: SidebarComment[];
  activeId: string | null;
  onCardClick: (id: string) => void;
}

export default function AboutCommentSidebar({
  comments,
  activeId,
  onCardClick,
}: AboutCommentSidebarProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!activeId) return;
    const card = cardRefs.current.get(activeId);
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId]);

  if (comments.length === 0) return null;

  return (
    <div
      style={{
        width: "300px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {comments.map((comment) => {
        const isActive = comment.id === activeId;
        const color = FOUNDER_COLORS[comment.author] ?? "#01EFFC";
        return (
          <div
            key={comment.id}
            ref={(el) => {
              if (el) cardRefs.current.set(comment.id, el);
              else cardRefs.current.delete(comment.id);
            }}
            onClick={() => onCardClick(comment.id)}
            style={{
              backgroundColor: "#FFFFFF",
              border: `2px solid ${isActive ? "#000000" : "#E6E6E6"}`,
              boxShadow: isActive ? `4px 4px 0 ${color}` : "none",
              padding: "12px",
              cursor: "pointer",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          >
            <div
              style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
            >
              <Image
                src={comment.avatarSrc}
                alt={comment.author}
                width={28}
                height={28}
                style={{
                  borderRadius: "50%",
                  border: "1px solid #000",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#000",
                    margin: "0 0 4px 0",
                  }}
                >
                  {comment.author}
                </p>
                {comment.text && (
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "13px",
                      fontWeight: 300,
                      color: "#000",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {comment.text}
                  </p>
                )}
                {comment.embed?.type === "youtube" && (
                  <a
                    href={comment.embed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      marginTop: comment.text ? "8px" : "6px",
                      textDecoration: "none",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16/9",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${comment.embed.videoId}/hqdefault.jpg`}
                        alt="YouTube video"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0,0,0,0.2)",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#DC2626",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="white"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
              <div
                style={{
                  marginTop: "8px",
                  borderTop: "1px solid #E6E6E6",
                  paddingTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {comment.replies.map((reply, i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key -- static seeded data
                    key={i}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                      marginLeft: "4px",
                    }}
                  >
                    <Image
                      src={reply.avatarSrc}
                      alt={reply.author}
                      width={24}
                      height={24}
                      style={{
                        borderRadius: "50%",
                        border: "1px solid #000",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#000",
                          margin: "0 0 2px 0",
                        }}
                      >
                        {reply.author}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "12px",
                          fontWeight: 300,
                          color: "#000",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {reply.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
