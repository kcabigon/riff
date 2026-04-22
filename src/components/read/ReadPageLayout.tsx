"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Avatar from "@/components/shared/Avatar";
import ReadToggle from "./ReadToggle";
import ReadOnlyEditor from "./ReadOnlyEditor";
import CommentPopover from "./CommentPopover";
import CommentSidebar from "./CommentSidebar";
import CommentDrawer from "./CommentDrawer";
import EmojiBar, { ReactionData } from "./EmojiBar";
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
  parentId: string | null;
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
  startInRiffMode?: boolean;
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
  startInRiffMode,
  isAlreadyRead,
}: ReadPageLayoutProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentColumnRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(isAlreadyRead);
  // Always start in read mode. If this is a notification nav (startInRiffMode=true),
  // we activate riff mode only after the editor signals it is ready — that way
  // marks are guaranteed to be in the DOM before the sidebar ever mounts.
  const [isRiffMode, setIsRiffMode] = useState(false);
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    null
  );
  const [activeReactionKey, setActiveReactionKey] = useState<string | null>(
    null
  );
  const [highlightsVersion, setHighlightsVersion] = useState(0);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [reactions, setReactions] = useState<ReactionData[]>([]);

  // Clear compose mode whenever selection is cleared
  useEffect(() => {
    if (!pendingSelection) setShowCompose(false);
  }, [pendingSelection]);

  const isMobile = useIsMobile();
  useThemeColor("#FFFFFF");
  const navVisible = useScrollDirection({ threshold: 15 });
  const metadataRef = useRef<HTMLDivElement>(null);
  const [showNavTitle, setShowNavTitle] = useState(false);

  // Show title in nav bar when metadata scrolls out of view (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const el = metadataRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowNavTitle(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

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
    setActiveReactionKey(null);
    setPendingSelection(null);
  }, []);

  const handleDeleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setActiveHighlightId((prev) => (prev === commentId ? null : prev));
  }, []);

  const handleUpdateComment = useCallback(
    (commentId: string, newContent: string) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: newContent, updatedAt: new Date().toISOString() }
            : c
        )
      );
    },
    []
  );

  const handleNewReply = useCallback(
    async (parentId: string, content: string) => {
      const res = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          pieceId: piece.id,
          riffId,
          clubId,
          parentId,
        }),
      });
      if (!res.ok) return;
      const { comment } = await res.json();
      setComments((prev) => [
        ...prev,
        {
          id: comment.id,
          content: comment.content,
          selectionStart: 0,
          selectionEnd: 0,
          selectedText: "",
          authorId: comment.authorId,
          parentId: comment.parentId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          author: comment.author,
        },
      ]);
    },
    [piece.id, riffId, clubId]
  );

  const handleAddReaction = useCallback(
    (emoji: string) => {
      if (!pendingSelection) return;
      const newReaction: ReactionData = {
        id: `local-${Date.now()}`,
        emoji,
        authorId: currentUser.id,
        selectionStart: pendingSelection.start,
        selectionEnd: pendingSelection.end,
        selectedText: pendingSelection.text,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
        },
      };
      setReactions((prev) => [...prev, newReaction]);
      setPendingSelection(null);
      // Fire API — fails gracefully until schema migration lands
      fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emoji,
          pieceId: piece.id,
          riffId,
          clubId,
          selectionStart: pendingSelection.start,
          selectionEnd: pendingSelection.end,
          selectedText: pendingSelection.text,
        }),
      }).catch(() => {});
    },
    [pendingSelection, currentUser, piece.id, riffId, clubId]
  );

  const handleRemoveReaction = useCallback((reactionId: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    fetch(`/api/reactions/${reactionId}`, { method: "DELETE" }).catch(() => {});
  }, []);

  const handleAddCommentReaction = useCallback(
    (emoji: string, commentId: string) => {
      const newReaction: ReactionData = {
        id: `local-${Date.now()}`,
        emoji,
        authorId: currentUser.id,
        commentId,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
        },
      };
      setReactions((prev) => [...prev, newReaction]);
      fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emoji,
          pieceId: piece.id,
          riffId,
          clubId,
          commentId,
        }),
      }).catch(() => {});
    },
    [currentUser, piece.id, riffId, clubId]
  );

  // Click sidebar comment → scroll to highlight in content
  const handleSidebarCommentClick = useCallback((commentId: string) => {
    setActiveHighlightId(commentId);
    setActiveReactionKey(null);

    setTimeout(() => {
      const mark = document.querySelector(
        `mark[data-comment-id="${commentId}"]`
      );
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }, []);

  // Click highlight in content → activate comment and ensure both are visible
  const handleHighlightClick = useCallback((commentId: string) => {
    setActiveHighlightId(commentId);
    setActiveReactionKey(null);

    // After positions recalculate, scroll the highlight into center view
    // The sidebar comment will be repositioned next to it
    setTimeout(() => {
      const mark = document.querySelector(
        `mark[data-comment-id="${commentId}"]`
      );
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  }, []);

  // Click reaction highlight in content → activate reaction pill in sidebar
  const handleReactionClick = useCallback((reactionKey: string) => {
    setActiveReactionKey(reactionKey);
    setActiveHighlightId(null);
    setTimeout(() => {
      const mark = document.querySelector(
        `mark[data-reaction-key="${reactionKey}"]`
      );
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  }, []);

  // Handle image comment
  const handleImageComment = useCallback(
    (rect: DOMRect, charOffset: number) => {
      setPendingSelection({
        text: "[Image]",
        start: charOffset,
        end: charOffset,
        rect,
      });
    },
    []
  );

  const filteredReactions = useMemo(
    () => (isRiffMode ? reactions.filter((r) => !r.commentId) : []),
    [isRiffMode, reactions]
  );

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

      {/* Top bar — full-width on mobile, 720px on desktop (stable width) */}
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
            maxWidth: "720px",
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

            {/* Nav title + author avatar — appears when metadata scrolls out */}
            {!isMobile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginLeft: "32px",
                  flex: 1,
                  minWidth: 0,
                  opacity: showNavTitle ? 1 : 0,
                  transition: "opacity 200ms ease",
                  pointerEvents: showNavTitle ? "auto" : "none",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "16px",
                    fontWeight: 400,
                    color: "#000000",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {piece.title}
                </p>
                <div style={{ flexShrink: 0 }}>
                  <Avatar
                    user={{
                      id: piece.author.id,
                      name: piece.author.name,
                      username: piece.author.username,
                      avatarUrl: piece.author.avatarUrl,
                    }}
                    size={24}
                  />
                </div>
              </div>
            )}

            <ReadToggle isRiffMode={isRiffMode} onToggle={setIsRiffMode} />
          </div>
        </div>
      </div>

      {/* Spacer for fixed nav on mobile */}
      {isMobile && <div style={{ height: "60px" }} />}

      {/* Content area */}
      <div
        style={{
          maxWidth: isRiffMode && !isMobile ? "1100px" : "720px",
          margin: "0 auto",
          padding: "32px 24px 96px",
          transition: "max-width 0.3s ease",
          display: "flex",
          gap: "40px",
          alignItems: "flex-start",
          position: "relative",
        }}
      >
        {/* Main content column */}
        <div
          ref={contentColumnRef}
          style={{
            maxWidth: "720px",
            width: "100%",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          {/* Metadata section — tracked for nav title visibility */}
          <div ref={metadataRef} style={{ width: "100%" }}>
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

            {/* Reading metadata */}
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                color: "#999999",
                margin: "12px 0 0",
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

            {/* Author */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                margin: "16px 0 24px",
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
          </div>

          {/* Content — Tiptap read-only */}
          <ReadOnlyEditor
            content={piece.currentContent}
            comments={isRiffMode ? comments : []}
            reactions={filteredReactions}
            isRiffMode={isRiffMode}
            activeHighlightId={activeHighlightId}
            pendingSelection={pendingSelection}
            currentUserId={currentUser.id}
            onSelection={(sel) => {
              setActiveReactionKey(null);
              setActiveHighlightId(null);
              setPendingSelection(sel);
            }}
            onHighlightClick={handleHighlightClick}
            onReactionClick={handleReactionClick}
            onHighlightsApplied={() => setHighlightsVersion((v) => v + 1)}
            onEditorReady={() => {
              if (startInRiffMode) setIsRiffMode(true);
            }}
            onImageComment={handleImageComment}
          />

          {/* End sentinel for read tracking */}
          <div ref={endRef} style={{ height: "1px" }} />
        </div>

        {/* Sidebar — desktop riff mode only */}
        {isRiffMode && !isMobile && (
          <CommentSidebar
            comments={comments}
            reactions={reactions}
            activeHighlightId={activeHighlightId}
            activeReactionKey={activeReactionKey}
            highlightsVersion={highlightsVersion}
            currentUserId={currentUser.id}
            onDelete={handleDeleteComment}
            onUpdate={handleUpdateComment}
            onAddReply={handleNewReply}
            onAddCommentReaction={handleAddCommentReaction}
            onRemoveReaction={handleRemoveReaction}
            onCommentClick={handleSidebarCommentClick}
            contentColumnRef={contentColumnRef}
            pendingSelection={showCompose ? pendingSelection : null}
            pendingCommentProps={
              showCompose && pendingSelection
                ? {
                    selection: pendingSelection,
                    currentUser,
                    pieceId: piece.id,
                    riffId,
                    clubId,
                    onSubmit: handleNewComment,
                    onClose: () => setPendingSelection(null),
                  }
                : null
            }
          />
        )}
      </div>

      {/* Emoji bar — shown on text selection before compose (both mobile and desktop) */}
      {isRiffMode && pendingSelection && !showCompose && (
        <EmojiBar
          selection={pendingSelection}
          isMobile={isMobile}
          existingReactions={reactions}
          currentUserId={currentUser.id}
          onReact={handleAddReaction}
          onComment={() => setShowCompose(true)}
          onClose={() => setPendingSelection(null)}
        />
      )}

      {/* Mobile: comment popover as bottom sheet — only after tapping "Comment…" */}
      {isMobile && showCompose && pendingSelection && (
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
          onUpdate={handleUpdateComment}
        />
      )}
    </div>
  );
}
