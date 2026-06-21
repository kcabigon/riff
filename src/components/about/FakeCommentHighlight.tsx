"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const FOUNDER_COLORS: Record<string, string> = {
  Jarric: "#01EFFC",
  Chris: "#00FF66",
  Kyle: "#EECF01",
  Derek: "#FF6B35",
  Kyla: "#C01582",
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface YoutubeEmbed {
  type: "youtube";
  videoId: string;
  url: string;
}

interface FakeComment {
  author: string;
  avatarSrc: string;
  text?: string;
  embed?: YoutubeEmbed;
  replies?: { author: string; avatarSrc: string; text: string }[];
}

export default function FakeCommentHighlight({
  children,
  comments,
}: {
  children: React.ReactNode;
  comments: FakeComment[];
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const highlightRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        highlightRef.current &&
        !highlightRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const color = FOUNDER_COLORS[comments[0]?.author] ?? "#01EFFC";

  const handleClick = () => {
    if (!highlightRef.current) return;
    const rect = highlightRef.current.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverEstimatedHeight = 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= popoverEstimatedHeight + 8
        ? rect.bottom + 8
        : rect.top - popoverEstimatedHeight - 8;
    setPos({
      top: Math.max(8, top),
      left: Math.max(
        16,
        Math.min(rect.left, window.innerWidth - popoverWidth - 16)
      ),
    });
    setOpen((o) => !o);
  };

  return (
    <>
      <mark
        ref={highlightRef}
        onClick={handleClick}
        style={{
          background: hexToRgba(color, 0.25),
          borderRadius: "2px",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {children}
      </mark>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: "280px",
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: `4px 4px 0 ${color}`,
              padding: "12px",
              zIndex: 1000,
            }}
          >
            {comments.map((comment, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key -- static seeded data on the About page
                key={i}
                style={{ marginBottom: i < comments.length - 1 ? "12px" : 0 }}
              >
                <CommentRow
                  author={comment.author}
                  avatarSrc={comment.avatarSrc}
                  text={comment.text}
                  embed={comment.embed}
                  size={28}
                />
                {comment.replies?.map((reply, j) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key -- static seeded data
                    key={j}
                    style={{ marginTop: "10px", marginLeft: "36px" }}
                  >
                    <CommentRow
                      author={reply.author}
                      avatarSrc={reply.avatarSrc}
                      text={reply.text}
                      size={24}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

function CommentRow({
  author,
  avatarSrc,
  text,
  embed,
  size,
}: {
  author: string;
  avatarSrc: string;
  text?: string;
  embed?: YoutubeEmbed;
  size: number;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
      <Image
        src={avatarSrc}
        alt={author}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          border: "1px solid #000000",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 700,
            color: "#000000",
            margin: "0 0 2px 0",
          }}
        >
          {author}
        </p>
        {text && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {text}
          </p>
        )}
        {embed?.type === "youtube" && (
          <a
            href={embed.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              marginTop: text ? "8px" : "6px",
              textDecoration: "none",
            }}
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
                src={`https://img.youtube.com/vi/${embed.videoId}/hqdefault.jpg`}
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
                    backgroundColor: "#FF0000",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
