"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Avatar from "@/components/shared/Avatar";
import CommentPopover from "./CommentPopover";
import ReplyThread, { ReplyData } from "./ReplyThread";
import AvatarStack from "@/components/shared/AvatarStack";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import CommentButton from "./CommentButton";
import DestructiveButton from "@/components/DestructiveButton";
import { AUTHOR_COLORS, buildAuthorColorMap } from "./ReadOnlyEditor";
import { timeAgo } from "@/lib/timeAgo";
import { CommentAuthor } from "@/types";

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
  replies: ReplyData[];
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
  riffId: string;
  clubId: string;
  onSubmit: (
    comment: Omit<CommentData, "replies"> & { replies?: ReplyData[] }
  ) => void;
  onClose: () => void;
}

interface CommentSidebarProps {
  comments: CommentData[];
  activeHighlightIds: string[];
  currentUserId: string;
  currentUser: CommentAuthor;
  pieceId: string;
  riffId: string;
  clubId: string;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, newContent: string) => Promise<void>;
  onReplyAdded: (commentId: string, reply: ReplyData) => void;
  onReplyUpdated: (
    commentId: string,
    replyId: string,
    newContent: string
  ) => void;
  onReplyDeleted: (commentId: string, replyId: string) => void;
  disableReplies?: boolean;
  onCommentClick?: (commentId: string) => void;
  contentColumnRef: React.RefObject<HTMLDivElement | null>;
  pendingSelection?: PendingSelection | null;
  pendingCommentProps?: PendingCommentProps | null;
}

function CommentCard({
  comment,
  isActive,
  isOwn,
  isEditing,
  isExpanded,
  onDelete,
  onEdit,
  onSave,
  onCancelEdit,
  onActivate,
  onToggleReplies,
  onReplyAdded,
  onReplyUpdated,
  onReplyDeleted,
  currentUser,
  pieceId,
  riffId,
  clubId,
  disableReplies = false,
  color,
}: {
  comment: CommentData;
  isActive: boolean;
  isOwn: boolean;
  isEditing: boolean;
  isExpanded: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onSave: (newContent: string) => Promise<void>;
  onCancelEdit: () => void;
  onActivate: () => void;
  onToggleReplies: () => void;
  onReplyAdded: (reply: ReplyData) => void;
  onReplyUpdated: (replyId: string, newContent: string) => void;
  onReplyDeleted: (replyId: string) => void;
  currentUser: CommentAuthor;
  pieceId: string;
  riffId: string;
  clubId: string;
  disableReplies?: boolean;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_REPLY_AVATARS = 3;

  const replyAuthors = useMemo(() => {
    const seen = new Set<string>();
    return comment.replies
      .filter((r) => {
        if (seen.has(r.authorId)) return false;
        seen.add(r.authorId);
        return true;
      })
      .map((r) => r.author);
  }, [comment.replies]);

  const visibleReplyAuthors = replyAuthors.slice(0, MAX_REPLY_AVATARS);
  const overflowCount = replyAuthors.length - MAX_REPLY_AVATARS;

  // Expand textarea to full content height when edit mode opens
  // Fix 8: wrap in requestAnimationFrame so layout is complete before measuring
  useEffect(() => {
    if (!isEditing || !textareaRef.current) return;
    const el = textareaRef.current;
    requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [isEditing]);

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

  const handleSave = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(trimmed);
    } catch (err) {
      console.error("Error updating comment:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    onCancelEdit();
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (!disableReplies && !isEditing && !confirmingDelete)
          onToggleReplies();
      }}
      style={{
        position: "relative",
        border: isActive || hovered ? "2px solid #000000" : "2px solid #E6E6E6",
        backgroundColor: "#FFFFFF",
        boxShadow: isActive ? `4px 4px 0 ${color}` : "none",
        padding: "12px",
        transition:
          "border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease",
        cursor:
          isEditing || confirmingDelete || disableReplies
            ? "default"
            : "pointer",
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
        <Avatar user={comment.author} size={32} />

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

        {isOwn && !isEditing && !confirmingDelete && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onActivate();
            }}
            style={{ flexShrink: 0 }}
          >
            <ThreeDotButton
              variant="light"
              align="right"
              items={[
                { type: "action", label: "Edit", onClick: onEdit },
                {
                  type: "action",
                  label: "Delete",
                  color: "#DC2626",
                  onClick: () => setConfirmingDelete(true),
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* Comment content or edit mode */}
      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
            rows={3}
            style={{
              width: "100%",
              resize: "none",
              overflow: "hidden",
              border: "1px solid #E6E6E6",
              padding: "6px 8px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
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
              marginTop: "8px",
            }}
          >
            <button
              onClick={handleCancel}
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
              onClick={handleSave}
              disabled={saving || !editContent.trim()}
              loading={saving}
            >
              Save
            </CommentButton>
          </div>
        </div>
      ) : (
        <>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              lineHeight: 1.5,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {comment.content}
          </p>
          {confirmingDelete && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(248,248,248,0.97)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Delete this comment?
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <button
                  onClick={() => setConfirmingDelete(false)}
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
                <DestructiveButton onClick={handleDelete} loading={deleting}>
                  Delete
                </DestructiveButton>
              </div>
            </div>
          )}
        </>
      )}

      {/* Expanded reply thread */}
      {!disableReplies && isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: "10px",
            borderTop: "1px solid #E6E6E6",
            paddingTop: "10px",
          }}
        >
          <ReplyThread
            replies={comment.replies}
            parentId={comment.id}
            pieceId={pieceId}
            riffId={riffId}
            clubId={clubId}
            currentUser={currentUser}
            onReplyAdded={onReplyAdded}
            onReplyUpdated={onReplyUpdated}
            onReplyDeleted={onReplyDeleted}
            onCancel={onToggleReplies}
          />
        </div>
      )}

      {/* Collapsed state: reply count always visible when replies exist */}
      {!disableReplies && !isExpanded && replyAuthors.length > 0 && (
        <div
          style={{
            marginTop: "10px",
            borderTop: "1px solid #E6E6E6",
            paddingTop: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <AvatarStack users={visibleReplyAuthors} size={24} />
          {overflowCount > 0 && (
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "11px",
                fontWeight: 300,
                color: "#808080",
              }}
            >
              +{overflowCount}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "11px",
              fontWeight: 300,
              color: "#808080",
            }}
          >
            {comment.replies.length}{" "}
            {comment.replies.length === 1 ? "reply" : "replies"}
          </span>
        </div>
      )}
    </div>
  );
}

export default function CommentSidebar({
  comments,
  activeHighlightIds,
  currentUserId,
  currentUser,
  pieceId,
  riffId,
  clubId,
  onDelete,
  onUpdate,
  onReplyAdded,
  onReplyUpdated,
  onReplyDeleted,
  disableReplies,
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

    // Find the priority item (pending, or topmost active highlight in document order)
    const priorityId = pendingSelection
      ? "__pending__"
      : (items.find((i) => activeHighlightIds.includes(i.id))?.id ?? null);
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
  }, [comments, contentColumnRef, pendingSelection, activeHighlightIds]);

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
  }, [activeHighlightIds, pendingSelection, updatePositions]);

  // Recalculate when a card enters/exits edit mode or reply thread (height changes)
  useEffect(() => {
    const timer = setTimeout(updatePositions, 50);
    return () => clearTimeout(timer);
  }, [editingId, expandedId, updatePositions]);

  // Collapse reply thread when clicking outside the expanded card
  useEffect(() => {
    if (!expandedId) return;
    function handleClickOutside(e: MouseEvent) {
      const el = cardRefs.current[expandedId!];
      if (el && !el.contains(e.target as Node)) {
        setExpandedId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedId]);

  // Recalculate whenever any card changes height (e.g. textarea expanding)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updatePositions, 50);
    });
    for (const el of Object.values(cardRefs.current)) {
      if (el) observer.observe(el);
    }
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [comments, updatePositions]);

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
        const isActive = activeHighlightIds.includes(comment.id);
        const top = positions[comment.id];

        // Don't render cards whose highlight mark couldn't be found in the DOM —
        // they'd stack at top:0 and obscure real comments
        if (top === undefined) return null;

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
              top: `${top}px`,
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
              isEditing={editingId === comment.id}
              isExpanded={expandedId === comment.id}
              onDelete={() => onDelete(comment.id)}
              onEdit={() => setEditingId(comment.id)}
              onSave={async (newContent) => {
                await onUpdate(comment.id, newContent);
                setEditingId(null);
              }}
              onCancelEdit={() => setEditingId(null)}
              onActivate={() => onCommentClick?.(comment.id)}
              onToggleReplies={() =>
                setExpandedId(expandedId === comment.id ? null : comment.id)
              }
              onReplyAdded={(reply) => onReplyAdded(comment.id, reply)}
              onReplyUpdated={(replyId, newContent) =>
                onReplyUpdated(comment.id, replyId, newContent)
              }
              onReplyDeleted={(replyId) => onReplyDeleted(comment.id, replyId)}
              currentUser={currentUser}
              pieceId={pieceId}
              riffId={riffId}
              clubId={clubId}
              disableReplies={disableReplies}
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
