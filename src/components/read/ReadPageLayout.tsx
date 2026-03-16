"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/shared/Avatar";
import ReadToggle from "./ReadToggle";
import CommentAnchor from "./CommentAnchor";
import CommentPopover from "./CommentPopover";
import CommentSidebar from "./CommentSidebar";
import CommentDrawer from "./CommentDrawer";
import ReadingProgress from "./ReadingProgress";
import PieceNavigation from "./PieceNavigation";
import { useIsMobile } from "@/hooks/useMediaQuery";

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
  previousPiece = null,
  nextPiece = null,
}: ReadPageLayoutProps) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(isAlreadyRead);
  const [isRiffMode, setIsRiffMode] = useState(false);
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);

  const isMobile = useIsMobile();

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

    // Short piece: fits in viewport → mark after 3s
    if (content.scrollHeight <= window.innerHeight) {
      const timer = setTimeout(markAsRead, 3000);
      return () => clearTimeout(timer);
    }

    // Long piece: IntersectionObserver on end sentinel
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

  // Clear pending selection when clicking elsewhere
  const handleLayoutClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("mark[data-comment-id]")) {
      // Don't clear activeHighlightId here — user may have clicked the sidebar
    }
  }, []);

  const readMinutes = Math.max(1, piece.readLengthMin);

  const activeComment = activeHighlightId
    ? comments.find((c) => c.id === activeHighlightId) ?? null
    : null;

  return (
    <div
      ref={contentRef}
      style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}
      onClick={handleLayoutClick}
    >
      <ReadingProgress />

      {/* Top nav */}
      <div
        style={{
          maxWidth: isRiffMode ? "1100px" : "720px",
          margin: "0 auto",
          padding: "24px 24px 0",
          transition: "max-width 0.3s ease",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => router.push(`/riffs/${riffId}`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ color: "#808080" }}
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to riff
        </button>

        <ReadToggle isRiffMode={isRiffMode} onToggle={setIsRiffMode} />
      </div>

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
        <div style={{ maxWidth: "720px", width: "100%", flexShrink: 0, minWidth: 0 }}>
          {/* Cover image */}
          {piece.coverImage && (
            <div
              style={{
                width: "100%",
                maxHeight: "400px",
                overflow: "hidden",
                marginBottom: "32px",
              }}
            >
              <img
                src={piece.coverImage}
                alt=""
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "400px",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "36px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 16px 0",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {piece.title}
          </h1>

          {/* Author */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "8px",
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
              fontWeight: 300,
              color: "#808080",
              margin: "0 0 24px 0",
              textAlign: "center",
            }}
          >
            {readMinutes} min read &middot;{" "}
            {piece.wordCount.toLocaleString()} words
          </p>

          {/* Horizontal rule */}
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #E6E6E6",
              margin: "0 0 32px 0",
            }}
          />

          {/* Content with comment anchoring */}
          <CommentAnchor
            content={piece.currentContent}
            comments={isRiffMode ? comments : []}
            isRiffMode={isRiffMode}
            onSelection={setPendingSelection}
            onHighlightClick={handleHighlightClick}
          />

          {/* End sentinel for scroll detection */}
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

      {/* Piece-to-piece navigation */}
      <PieceNavigation
        previousPiece={previousPiece}
        nextPiece={nextPiece}
        riffId={riffId}
      />
    </div>
  );
}
