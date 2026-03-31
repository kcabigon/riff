"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Avatar from "@/components/shared/Avatar";
import ReadToggle from "./ReadToggle";
import ReadOnlyEditor from "./ReadOnlyEditor";
import CommentPopover from "./CommentPopover";
import CommentSidebar from "./CommentSidebar";
import CommentDrawer from "./CommentDrawer";
import ReadingProgress from "./ReadingProgress";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import BackButton from "@/components/BackButton";

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

interface PendingSelection {
  text: string;
  start: number;
  end: number;
  rect: DOMRect;
}

interface ReadPageLayoutProps {
  piece: {
    id: string;
    title: string;
    subtitle: string | null;
    currentContent: string;
    coverImage: string | null;
    wordCount: number;
    readLengthMin: number;
    author: CommentAuthor;
  };
  riffId: string;
  clubId: string;
  currentUser: CommentAuthor;
  initialComments: CommentData[];
  isAlreadyRead: boolean;
  previousPiece?: { id: string; title: string } | null;
  nextPiece?: { id: string; title: string } | null;
}

export default function ReadPageLayout({
  piece,
  riffId,
  clubId,
  currentUser,
  initialComments,
  isAlreadyRead,
}: ReadPageLayoutProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(isAlreadyRead);
  const [isRiffMode, setIsRiffMode] = useState(false);
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    null
  );
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);

  const isMobile = useIsMobile();
  useThemeColor("#FFFFFF");
  const navVisible = useScrollDirection({ threshold: 15 });

  const markAsRead = useCallback(async () => {
    if (markedRead) return;
    setMarkedRead(true);
    try {
      await fetch(`/api/riffs/${riffId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId: piece.id }),
      });
    } catch (err) {
      console.error("Error marking piece as read:", err);
    }
  }, [markedRead, riffId, piece.id]);

  useEffect(() => {
    if (markedRead) return;

    const content = contentRef.current;
    const end = endRef.current;
    if (!content || !end) return;

    if (content.scrollHeight <= window.innerHeight) {
      const timer = setTimeout(markAsRead, 3000);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) markAsRead();
      },
      { threshold: 0.5 }
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [markAsRead, markedRead]);

  const handleNewComment = useCallback((comment: CommentData) => {
    setComments((prev) => {
      const updated = [...prev, comment];
      return updated.sort((a, b) => a.selectionStart - b.selectionStart);
    });
    setActiveHighlightId(comment.id);
  }, []);

  const handleDeleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setActiveHighlightId((prev) => (prev === commentId ? null : prev));
  }, []);

  const handleHighlightClick = useCallback((commentId: string) => {
    setActiveHighlightId(commentId);
  }, []);

  const readMinutes = Math.max(1, piece.readLengthMin);

  const activeComment = activeHighlightId
    ? (comments.find((c) => c.id === activeHighlightId) ?? null)
    : null;

  return (
    <div
      ref={contentRef}
      style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}
    >
      <ReadingProgress />

      {/* Top bar — full-width on mobile, content-width on desktop */}
      <div
        style={{
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: 0,
          right: isMobile ? 0 : undefined,
          zIndex: 50,
          width: "100%",
          maxWidth: isMobile ? "100%" : isRiffMode ? "1100px" : "720px",
          margin: isMobile ? undefined : "0 auto",
          backgroundColor: "#FFFFFF",
          transform:
            isMobile && !navVisible ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 200ms ease, max-width 0.3s ease",
          willChange: isMobile ? "transform" : undefined,
        }}
      >
        <div
          style={{
            maxWidth: isRiffMode ? "1100px" : "720px",
            width: "100%",
            margin: "0 auto",
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0 8px",
            }}
          >
            <BackButton href={`/riffs/${riffId}`} />
            <ReadToggle isRiffMode={isRiffMode} onToggle={setIsRiffMode} />
          </div>
        </div>
      </div>

      {/* Spacer for fixed nav on mobile */}
      {isMobile && <div style={{ height: "60px" }} />}

      {/* Content area */}
      <div
        style={{
          maxWidth: isRiffMode ? "1100px" : "720px",
          margin: "0 auto",
          padding: "32px 24px 96px",
          transition: "max-width 0.3s ease",
          display: "flex",
          gap: "40px",
          alignItems: "flex-start",
        }}
      >
        {/* Main content column */}
        <div
          style={{
            maxWidth: "720px",
            width: "100%",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "32px",
              fontWeight: "bold",
              color: "#000000",
              margin: 0,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {piece.title}
          </h1>

          {/* Subtitle */}
          {piece.subtitle && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#666666",
                margin: "8px 0 0",
                textAlign: "center",
                lineHeight: "1.4",
              }}
            >
              {piece.subtitle}
            </p>
          )}

          {/* Author */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <Avatar
              user={{
                id: piece.author.id,
                name: piece.author.name,
                username: piece.author.username,
                avatarUrl: piece.author.avatarUrl,
              }}
              size={32}
            />
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
              }}
            >
              {piece.author.name || piece.author.username || "Unknown"}
            </p>
          </div>

          {/* Reading metadata */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              color: "#999999",
              margin: "12px 0 24px",
              textAlign: "center",
            }}
          >
            <span style={{ fontWeight: "bold" }}>{readMinutes}</span> min read
            {" \u2022 "}
            <span style={{ fontWeight: "bold" }}>
              {piece.wordCount.toLocaleString()}
            </span>{" "}
            words
          </p>

          {/* Horizontal rule */}
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #E6E6E6",
              margin: "0 0 32px 0",
            }}
          />

          {/* Content — Tiptap read-only mode for pixel-perfect fidelity with write page */}
          <ReadOnlyEditor
            content={piece.currentContent}
            comments={isRiffMode ? comments : []}
            isRiffMode={isRiffMode}
            onSelection={setPendingSelection}
            onHighlightClick={handleHighlightClick}
          />

          {/* End sentinel for read tracking */}
          <div ref={endRef} style={{ height: "1px" }} />
        </div>

        {/* Sidebar — desktop riff mode only */}
        {isRiffMode && !isMobile && (
          <CommentSidebar
            comments={comments}
            activeHighlightId={activeHighlightId}
            currentUserId={currentUser.id}
            onDelete={handleDeleteComment}
          />
        )}
      </div>

      {/* Comment compose popover */}
      {pendingSelection && (
        <CommentPopover
          selection={pendingSelection}
          currentUser={currentUser}
          pieceId={piece.id}
          riffId={riffId}
          clubId={clubId}
          onSubmit={handleNewComment}
          onClose={() => setPendingSelection(null)}
        />
      )}

      {/* Mobile: bottom drawer for viewing a comment */}
      {isMobile && (
        <CommentDrawer
          comment={activeComment}
          currentUserId={currentUser.id}
          onClose={() => setActiveHighlightId(null)}
          onDelete={handleDeleteComment}
        />
      )}
    </div>
  );
}
