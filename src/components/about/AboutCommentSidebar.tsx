"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import Image from "next/image";

const FOUNDER_COLORS: Record<string, string> = {
  Jarric: "#01EFFC",
  Chris: "#00FF66",
  Kyle: "#EECF01",
  Derek: "#FF6B35",
  Kyla: "#C01582",
};

const GAP = 8;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [containerHeight, setContainerHeight] = useState(0);

  const computePositions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;

    // Y of each mark relative to the sidebar container
    const markYs: Record<string, number> = {};
    for (const comment of comments) {
      const mark = document.querySelector(
        `mark[data-comment-id="${comment.id}"]`
      );
      if (mark) {
        markYs[comment.id] = mark.getBoundingClientRect().top - containerTop;
      }
    }

    const cardHeights: Record<string, number> = {};
    for (const [id, el] of cardRefs.current) {
      cardHeights[id] = el.offsetHeight;
    }

    const newPositions: Record<string, number> = {};

    if (!activeId || !(activeId in markYs)) {
      // Default: first card at first mark, rest packed downward
      const firstY = markYs[comments[0]?.id] ?? 0;
      let cursor = Math.max(0, firstY);
      for (const comment of comments) {
        newPositions[comment.id] = cursor;
        cursor += (cardHeights[comment.id] ?? 80) + GAP;
      }
    } else {
      const activeIdx = comments.findIndex((c) => c.id === activeId);
      const activeMarkY = markYs[activeId];

      // Active card anchored to its mark
      newPositions[activeId] = activeMarkY;

      // Cards below: pack downward
      let bottomCursor = activeMarkY + (cardHeights[activeId] ?? 80) + GAP;
      for (let i = activeIdx + 1; i < comments.length; i++) {
        newPositions[comments[i].id] = bottomCursor;
        bottomCursor += (cardHeights[comments[i].id] ?? 80) + GAP;
      }

      // Cards above: pack upward
      let topCursor = activeMarkY;
      for (let i = activeIdx - 1; i >= 0; i--) {
        const h = cardHeights[comments[i].id] ?? 80;
        topCursor = Math.max(0, topCursor - h - GAP);
        newPositions[comments[i].id] = topCursor;
      }
    }

    setPositions(newPositions);

    // Keep container tall enough to hold all cards
    let maxBottom = 0;
    for (const comment of comments) {
      const top = newPositions[comment.id] ?? 0;
      maxBottom = Math.max(maxBottom, top + (cardHeights[comment.id] ?? 80));
    }
    setContainerHeight(maxBottom);
  }, [comments, activeId]);

  // Synchronous initial measurement — prevents flash before first paint
  useLayoutEffect(() => {
    computePositions();
  }, [computePositions]);

  // Recompute after fonts finish loading (affects layout heights)
  useEffect(() => {
    document.fonts.ready.then(computePositions);
  }, [computePositions]);

  // Scroll and resize
  useEffect(() => {
    window.addEventListener("scroll", computePositions, { passive: true });
    window.addEventListener("resize", computePositions);
    return () => {
      window.removeEventListener("scroll", computePositions);
      window.removeEventListener("resize", computePositions);
    };
  }, [computePositions]);

  // Card height changes (e.g. expanded replies)
  useEffect(() => {
    const ro = new ResizeObserver(computePositions);
    for (const el of cardRefs.current.values()) ro.observe(el);
    return () => ro.disconnect();
  }, [computePositions]);

  if (comments.length === 0) return null;

  function handleCardClick(id: string) {
    onCardClick(id);
    // Scroll the corresponding highlight into view
    const mark = document.querySelector(`mark[data-comment-id="${id}"]`);
    mark?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "300px",
        flexShrink: 0,
        position: "relative",
        minHeight: containerHeight,
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
            onClick={() => handleCardClick(comment.id)}
            style={{
              position: "absolute",
              top: positions[comment.id] ?? 0,
              width: "100%",
              backgroundColor: "#FFFFFF",
              border: `2px solid ${isActive ? "#000000" : "#E6E6E6"}`,
              boxShadow: isActive ? `4px 4px 0 ${color}` : "none",
              padding: "12px",
              cursor: "pointer",
              transition: "top 0.2s ease, border-color 0.15s, box-shadow 0.15s",
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
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#000",
                    margin: "0 0 2px 0",
                  }}
                >
                  {comment.author}
                </p>
                {comment.text && (
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "14px",
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
              <div>
                {comment.replies.map((reply, i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key -- static seeded data
                    key={i}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                      marginTop: "10px",
                      marginLeft: "36px",
                    }}
                  >
                    <Image
                      src={reply.avatarSrc}
                      alt={reply.author}
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
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#000",
                          margin: "0 0 2px 0",
                        }}
                      >
                        {reply.author}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "14px",
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
