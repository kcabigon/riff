"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { formatSubmittedDate } from "@/lib/timeAgo";
import { useRouter } from "next/navigation";
import Avatar from "@/components/shared/Avatar";
import ReadToggle from "./ReadToggle";
import ReadOnlyEditor, {
  buildAuthorColorMap,
  AUTHOR_COLORS,
} from "./ReadOnlyEditor";
import CommentSidebar from "./CommentSidebar";
import CommentModal from "./CommentModal";
import CommentComposeModal from "./CommentComposeModal";
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
    submittedAt: string | null;
    author: CommentAuthor;
  };
  riffId: string;
  clubId: string;
  currentUser: CommentAuthor;
  initialComments: CommentData[];
  isAlreadyRead: boolean;
  startInRiffMode?: boolean;
  previousPiece?: { id: string; title: string } | null;
  nextPiece?: { id: string; title: string } | null;
  fromProfileUserId?: string;
  backHref?: string;
  disableCommentCompose?: boolean;
}

export default function ReadPageLayout({
  piece,
  riffId,
  clubId,
  currentUser,
  initialComments,
  isAlreadyRead,
  startInRiffMode,
  fromProfileUserId,
  backHref,
  disableCommentCompose,
}: ReadPageLayoutProps) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentColumnRef = useRef<HTMLDivElement>(null);
  const [markedRead, setMarkedRead] = useState(isAlreadyRead);
  const hasCalledReadApi = useRef(false);
  // Always start in read mode — activate riff mode only after the editor is
  // ready so marks are in the DOM before the sidebar mounts (prevents all
  // comment cards stacking at top:0 on notification deep-link nav).
  const [isRiffMode, setIsRiffMode] = useState(false);
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [activeHighlightIds, setActiveHighlightIds] = useState<string[]>([]);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);

  const isMobile = useIsMobile();
  const keyboardTriggerRef = useRef<HTMLInputElement>(null);
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
    if (hasCalledReadApi.current) return;
    hasCalledReadApi.current = true;
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
  }, [riffId, piece.id]);

  useEffect(() => {
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
  }, [markAsRead]);

  const handleNewComment = useCallback((comment: CommentData) => {
    setComments((prev) => {
      const updated = [...prev, comment];
      return updated.sort((a, b) => a.selectionStart - b.selectionStart);
    });
    setActiveHighlightIds([comment.id]);
    setPendingSelection(null);
  }, []);

  const handleEditorReady = useCallback(() => {
    if (startInRiffMode) setIsRiffMode(true);
  }, [startInRiffMode]);

  const handleClearHighlight = useCallback(() => setActiveHighlightIds([]), []);

  const handleDeleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setActiveHighlightIds((prev) => prev.filter((id) => id !== commentId));
  }, []);

  const handleUpdateComment = useCallback(
    async (commentId: string, newContent: string) => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) return;
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

  // Click sidebar comment → scroll to highlight in content (single activation)
  const handleSidebarCommentClick = useCallback((commentId: string) => {
    setActiveHighlightIds([commentId]);

    setTimeout(() => {
      const mark = document.querySelector(
        `mark[data-comment-id="${commentId}"]`
      );
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }, []);

  // Click highlight in content → activate all comments at that point.
  // Scrolls to the topmost mark in the group.
  const handleHighlightClick = useCallback((commentIds: string[]) => {
    setActiveHighlightIds(commentIds);

    // After positions recalculate, scroll the first (topmost) highlight into view
    setTimeout(() => {
      const mark = document.querySelector(
        `mark[data-comment-id="${commentIds[0]}"]`
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

  const readMinutes = Math.max(1, piece.readLengthMin);

  const authorColorMap = useMemo(
    () => buildAuthorColorMap(comments),
    [comments]
  );

  const currentUserColor =
    authorColorMap[currentUser.id] ??
    AUTHOR_COLORS[Object.keys(authorColorMap).length % AUTHOR_COLORS.length];

  const activeComments = useMemo(
    () =>
      activeHighlightIds
        .map((id) => comments.find((c) => c.id === id))
        .filter((c): c is CommentData => c !== undefined),
    [activeHighlightIds, comments]
  );

  return (
    <div
      ref={contentRef}
      style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}
    >
      <ReadingProgress />

      {/* Hidden input — focused synchronously on selection to open the iOS keyboard before the compose modal mounts */}
      {isMobile && (
        <input
          ref={keyboardTriggerRef}
          type="text"
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: "fixed",
            top: -100,
            left: 0,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
            fontSize: "16px",
          }}
        />
      )}

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
            <BackButton
              onClick={() => {
                if (backHref) {
                  router.push(backHref);
                } else if (fromProfileUserId) {
                  router.push(`/profile/${fromProfileUserId}`);
                } else {
                  router.push(`/riffs/${riffId}`);
                }
              }}
            />

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
              {readMinutes} min read
              {" \u2022 "}
              {piece.wordCount.toLocaleString()} words
              {piece.submittedAt && (
                <>
                  {" \u2022 "}
                  {formatSubmittedDate(piece.submittedAt)}
                </>
              )}
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
            isRiffMode={isRiffMode}
            activeHighlightIds={activeHighlightIds}
            pendingSelection={pendingSelection}
            currentUserId={currentUser.id}
            onSelection={(sel) => {
              if (disableCommentCompose) return;
              // Focus hidden input synchronously within the touchend gesture
              // so iOS opens the keyboard before the compose modal mounts
              if (isMobile) keyboardTriggerRef.current?.focus();
              setPendingSelection(sel);
            }}
            onHighlightClick={handleHighlightClick}
            onClearHighlight={handleClearHighlight}
            onImageComment={isMobile ? undefined : handleImageComment}
            onEditorReady={handleEditorReady}
          />

          {/* End sentinel for read tracking */}
          <div ref={endRef} style={{ height: "1px" }} />
        </div>

        {/* Sidebar — desktop riff mode only */}
        {isRiffMode && !isMobile && (
          <CommentSidebar
            comments={comments}
            activeHighlightIds={activeHighlightIds}
            currentUserId={currentUser.id}
            onDelete={handleDeleteComment}
            onUpdate={handleUpdateComment}
            onCommentClick={handleSidebarCommentClick}
            contentColumnRef={contentColumnRef}
            pendingSelection={pendingSelection}
            pendingCommentProps={
              pendingSelection
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

      {/* Mobile: compose modal for new comments */}
      {isMobile && pendingSelection && (
        <CommentComposeModal
          selection={pendingSelection}
          currentUser={currentUser}
          pieceId={piece.id}
          riffId={riffId}
          clubId={clubId}
          quoteColor={currentUserColor}
          onSubmit={handleNewComment}
          onClose={() => setPendingSelection(null)}
        />
      )}

      {/* Mobile: centered modal for viewing comments */}
      {isMobile && (
        <CommentModal
          comments={activeComments}
          currentUserId={currentUser.id}
          authorColorMap={authorColorMap}
          onClose={() => setActiveHighlightIds([])}
          onDelete={handleDeleteComment}
          onUpdate={handleUpdateComment}
        />
      )}
    </div>
  );
}
