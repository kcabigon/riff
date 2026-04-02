"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import CommentPopover from "./CommentPopover";
import { AUTHOR_COLORS, buildAuthorColorMap } from "./ReadOnlyEditor";

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

interface PendingCommentProps {
  selection: PendingSelection;
  currentUser: CommentAuthor;
  pieceId: string;
  riffId: string | null;
  clubId: string;
  onSubmit: (comment: CommentData) => void;
  onClose: () => void;
}

interface CommentSidebarProps {
  comments: CommentData[];
  activeHighlightId: string | null;
  currentUserId: string;
  onDelete: (commentId: string) => void;
  onCommentClick?: (commentId: string) => void;
  contentColumnRef: React.RefObject<HTMLDivElement | null>;
  pendingSelection?: PendingSelection | null;
  pendingCommentProps?: PendingCommentProps | null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(author: CommentAuthor): string {
  if (author.name) return author.name[0].toUpperCase();
  if (author.username) return author.username[0].toUpperCase();
  return "?";
}

function CommentCard({
  comment,
  isActive,
  isOwn,
  onDelete,
  color,
}: {
  comment: CommentData;
  isActive: boolean;
  isOwn: boolean;
  onDelete: () => void;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      onDelete();
    } catch (err) {
      console.error("Error deleting comment:", err);
      setDeleting(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: isActive || hovered ? "2px solid #000000" : "2px solid #E6E6E6",
        backgroundColor: "#FFFFFF",
        boxShadow: isActive ? `4px 4px 0 ${color}` : "none",
        padding: "12px",
        transition:
          "border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "#01EFFC",
            border: "1px solid #000",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 700,
            color: "#000000",
            overflow: "hidden",
          }}
        >
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials(comment.author)
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#000000",
            }}
          >
            {comment.author.name || comment.author.username || "Unknown"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "11px",
              fontWeight: 300,
              color: "#808080",
              marginLeft: "6px",
            }}
          >
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        {isOwn && hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={deleting}
            title="Delete comment"
            style={{
              background: "none",
              border: "none",
              cursor: deleting ? "not-allowed" : "pointer",
              padding: "2px",
              color: "#808080",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3.5 3.5l.5 8h6l.5-8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Comment content */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "13px",
          fontWeight: 300,
          color: "#000000",
          margin: 0,
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {comment.content}
      </p>
    </div>
  );
}

export default function CommentSidebar({
  comments,
  activeHighlightId,
  currentUserId,
  onDelete,
  onCommentClick,
  contentColumnRef,
  pendingSelection,
  pendingCommentProps,
}: CommentSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const authorColors = useMemo(() => buildAuthorColorMap(comments), [comments]);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [minHeight, setMinHeight] = useState(0);

  // Measure actual rendered height of a comment card
  const getCardHeight = (id: string) => {
    const el = cardRefs.current[id];
    return el ? el.offsetHeight : 90;
  };

  // Bidirectional positioning algorithm:
  // 1. Pin the priority item (active/pending) to its highlight's Y position
  // 2. Position items BELOW the priority working downward
  // 3. Position items ABOVE the priority working upward
  const updatePositions = useCallback(() => {
    if (!contentColumnRef?.current || !sidebarRef.current) return;

    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const sidebarScrollTop = sidebarRect.top + window.scrollY;

    const GAP = 8;

    // Build items list with mark positions
    const items: { id: string; markTop: number }[] = [];

    for (const comment of comments) {
      // Check both text highlights (mark) and image highlights (img)
      const el = document.querySelector(
        `mark[data-comment-id="${comment.id}"], img[data-comment-id="${comment.id}"]`
      );
      if (el) {
        const elRect = el.getBoundingClientRect();
        const markTop = elRect.top + window.scrollY - sidebarScrollTop;
        items.push({ id: comment.id, markTop });
      } else if (comment.selectedText === "[Image]") {
        // Image comment whose data-comment-id was overwritten by another —
        // find the image that another comment on the same image is attached to
        const allCommentedImgs = document.querySelectorAll(
          "img[data-comment-id]"
        );
        // Find the image whose sibling comments share a similar selectionStart
        let bestImg: Element | null = null;
        let bestDist = Infinity;
        for (const img of allCommentedImgs) {
          const imgRect = img.getBoundingClientRect();
          // Use vertical position as a proxy — all comments on the same image
          // will have similar selectionStart values
          const otherCommentId = img.getAttribute("data-comment-id");
          const otherComment = comments.find((c) => c.id === otherCommentId);
          if (otherComment) {
            const dist = Math.abs(
              otherComment.selectionStart - comment.selectionStart
            );
            if (dist < bestDist) {
              bestDist = dist;
              bestImg = img;
            }
          }
        }
        if (bestImg) {
          const elRect = bestImg.getBoundingClientRect();
          const markTop = elRect.top + window.scrollY - sidebarScrollTop;
          items.push({ id: comment.id, markTop });
        }
      }
    }

    // Add pending selection
    if (pendingSelection && pendingSelection.start >= 0) {
      // Check for text highlight or image highlight
      const pendingEl = document.querySelector(
        `mark[data-comment-id="__pending__"], img[data-comment-id="__pending__"]`
      );
      if (pendingEl) {
        const elRect = pendingEl.getBoundingClientRect();
        const markTop = elRect.top + window.scrollY - sidebarScrollTop;
        items.push({ id: "__pending__", markTop });
      } else {
        const markTop =
          pendingSelection.rect.top + window.scrollY - sidebarScrollTop;
        items.push({ id: "__pending__", markTop });
      }
    }

    // Sort by markTop (document order)
    items.sort((a, b) => a.markTop - b.markTop);

    if (items.length === 0) {
      setPositions({});
      setMinHeight(0);
      return;
    }

    // Find the priority item (pending or active)
    const priorityId = pendingSelection ? "__pending__" : activeHighlightId;
    const priorityIndex = priorityId
      ? items.findIndex((i) => i.id === priorityId)
      : -1;

    const newPositions: Record<string, number> = {};

    if (priorityIndex >= 0) {
      // Pin the priority item to its ideal position
      const priority = items[priorityIndex];
      newPositions[priority.id] = priority.markTop;

      // Position items BELOW the priority (working downward)
      let nextTop = priority.markTop + getCardHeight(priority.id) + GAP;
      for (let i = priorityIndex + 1; i < items.length; i++) {
        const item = items[i];
        const idealTop = item.markTop;
        const top = Math.max(idealTop, nextTop);
        newPositions[item.id] = top;
        nextTop = top + getCardHeight(item.id) + GAP;
      }

      // Position items ABOVE the priority (working upward)
      let nextBottom = priority.markTop - GAP;
      for (let i = priorityIndex - 1; i >= 0; i--) {
        const item = items[i];
        const idealTop = item.markTop;
        const height = getCardHeight(item.id);
        // The card's bottom edge must not exceed nextBottom
        const top = Math.min(idealTop, nextBottom - height);
        newPositions[item.id] = top;
        nextBottom = top - GAP;
      }
    } else {
      // No priority — simple top-down layout
      let nextTop = 0;
      for (const item of items) {
        const top = Math.max(item.markTop, nextTop);
        newPositions[item.id] = top;
        nextTop = top + getCardHeight(item.id) + GAP;
      }
    }

    setPositions(newPositions);

    // Calculate min height from the lowest positioned item
    let maxBottom = 0;
    for (const item of items) {
      const top = newPositions[item.id] ?? 0;
      maxBottom = Math.max(maxBottom, top + getCardHeight(item.id));
    }
    setMinHeight(maxBottom + 40);
  }, [comments, contentColumnRef, pendingSelection, activeHighlightId]);

  // Recalculate on mount, scroll, resize, and when comments change
  useEffect(() => {
    updatePositions();

    // Use a small delay to let highlights render first
    const timer = setTimeout(updatePositions, 200);

    window.addEventListener("scroll", updatePositions, { passive: true });
    window.addEventListener("resize", updatePositions);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", updatePositions);
      window.removeEventListener("resize", updatePositions);
    };
  }, [updatePositions]);

  // Recalculate when active highlight or pending selection changes
  useEffect(() => {
    // Run twice — once immediately for fast response, once after render for measured heights
    updatePositions();
    const timer = setTimeout(updatePositions, 150);
    return () => clearTimeout(timer);
  }, [activeHighlightId, pendingSelection, updatePositions]);

  return (
    <div
      ref={sidebarRef}
      style={{
        width: "300px",
        flexShrink: 0,
        position: "relative",
        minHeight: `${Math.max(minHeight, 100)}px`,
        overflow: "visible",
      }}
    >
      {comments.length === 0 && !pendingCommentProps && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#AFAFAF",
            margin: 0,
            paddingTop: "32px",
            textAlign: "center",
          }}
        >
          No comments yet.
          <br />
          Select text to comment.
        </p>
      )}

      {comments.map((comment) => {
        const isActive = comment.id === activeHighlightId;
        const top = positions[comment.id];

        return (
          <div
            key={comment.id}
            ref={(el) => {
              cardRefs.current[comment.id] = el;
            }}
            data-sidebar-comment-id={comment.id}
            onClick={() => onCommentClick?.(comment.id)}
            style={{
              position: "absolute",
              top: `${top ?? 0}px`,
              left: 0,
              right: 0,
              cursor: "pointer",
              transition: "top 0.2s ease",
            }}
          >
            <CommentCard
              comment={comment}
              isActive={isActive}
              isOwn={comment.authorId === currentUserId}
              onDelete={() => onDelete(comment.id)}
              color={authorColors[comment.authorId] || AUTHOR_COLORS[0]}
            />
          </div>
        );
      })}

      {/* Pending comment compose — positioned among other comments */}
      {pendingCommentProps && (
        <div
          ref={(el) => {
            cardRefs.current["__pending__"] = el;
          }}
          style={{
            position: "absolute",
            top: `${positions["__pending__"] ?? 0}px`,
            left: 0,
            right: 0,
            transition: "top 0.2s ease",
          }}
        >
          <CommentPopover
            selection={pendingCommentProps.selection}
            currentUser={pendingCommentProps.currentUser}
            pieceId={pendingCommentProps.pieceId}
            riffId={pendingCommentProps.riffId}
            clubId={pendingCommentProps.clubId}
            onSubmit={pendingCommentProps.onSubmit}
            onClose={pendingCommentProps.onClose}
          />
        </div>
      )}
    </div>
  );
}
