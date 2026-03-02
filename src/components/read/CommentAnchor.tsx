"use client";

import { useRef, useEffect, useCallback } from "react";

interface CommentData {
  id: string;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
}

interface PendingSelection {
  text: string;
  start: number;
  end: number;
  rect: DOMRect;
}

interface CommentAnchorProps {
  content: string;
  comments: CommentData[];
  isRiffMode: boolean;
  onSelection: (selection: PendingSelection) => void;
  onHighlightClick: (commentId: string) => void;
}

// Inject <mark> tags into HTML string for each comment anchor.
// Works backwards from largest selectionEnd to avoid offset drift.
function injectHighlights(html: string, comments: CommentData[]): string {
  if (comments.length === 0) return html;

  // Sort descending by selectionEnd to inject from back to front
  const sorted = [...comments]
    .filter((c) => c.selectionStart != null && c.selectedText)
    .sort((a, b) => b.selectionEnd - a.selectionEnd);

  let result = html;

  for (const comment of sorted) {
    const idx = result.indexOf(comment.selectedText);
    if (idx === -1) continue;

    const before = result.slice(0, idx);
    const after = result.slice(idx + comment.selectedText.length);
    result =
      before +
      `<mark data-comment-id="${comment.id}" style="background:rgba(0,255,102,0.25);cursor:pointer;border-radius:2px;padding:0;">` +
      comment.selectedText +
      `</mark>` +
      after;
  }

  return result;
}

// Get character offset of a node+offset relative to a root element.
function getCharOffset(root: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;

  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (current === node) {
      return total + offset;
    }
    total += (current.textContent || "").length;
  }

  return total;
}

export default function CommentAnchor({
  content,
  comments,
  isRiffMode,
  onSelection,
  onHighlightClick,
}: CommentAnchorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const injectedHtml = isRiffMode
    ? injectHighlights(content, comments)
    : content;

  // Handle clicks on injected <mark> elements
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest("mark[data-comment-id]") as HTMLElement | null;
      if (mark) {
        const commentId = mark.getAttribute("data-comment-id");
        if (commentId) {
          e.stopPropagation();
          onHighlightClick(commentId);
        }
      }
    },
    [onHighlightClick]
  );

  // Handle text selection (desktop mouseup)
  const handleMouseUp = useCallback(() => {
    if (!isRiffMode || !containerRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) return;

    // Ensure selection is within our content container
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    const start = getCharOffset(
      containerRef.current,
      range.startContainer,
      range.startOffset
    );
    const end = getCharOffset(
      containerRef.current,
      range.endContainer,
      range.endOffset
    );

    const rect = range.getBoundingClientRect();
    onSelection({ text, start, end, rect });
  }, [isRiffMode, onSelection]);

  // Handle mobile double-tap → select sentence
  const handleDblClick = useCallback(
    (e: MouseEvent) => {
      if (!isRiffMode || !containerRef.current) return;

      // Get caret position at tap point (browser compat)
      const doc = document as any;
      let range: Range | null = null;
      if (typeof doc.caretRangeFromPoint === "function") {
        range = doc.caretRangeFromPoint(e.clientX, e.clientY) as Range | null;
      } else if (typeof doc.caretPositionFromPoint === "function") {
        const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          range = doc.createRange() as Range;
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }

      if (!range) return;

      const textNode = range.startContainer;
      if (textNode.nodeType !== Node.TEXT_NODE) return;

      const text = textNode.textContent || "";
      const caretOffset = range.startOffset;

      // Find sentence boundaries
      const sentenceEndRegex = /[.!?]\s|$/g;
      let sentenceStart = 0;
      let sentenceEnd = text.length;

      // Walk backward to find start of sentence
      for (let i = caretOffset; i >= 0; i--) {
        if (i === 0) {
          sentenceStart = 0;
          break;
        }
        if (/[.!?]/.test(text[i - 1]) && /\s/.test(text[i])) {
          sentenceStart = i;
          break;
        }
      }

      // Walk forward to find end of sentence
      sentenceEndRegex.lastIndex = caretOffset;
      const match = sentenceEndRegex.exec(text);
      if (match) {
        sentenceEnd = match.index + match[0].length;
      }

      const selected = text.slice(sentenceStart, sentenceEnd).trim();
      if (!selected) return;

      // Programmatically select the sentence
      const sel = window.getSelection();
      if (!sel) return;

      const newRange = document.createRange();
      const startIdx = text.indexOf(selected, sentenceStart);
      if (startIdx === -1) return;

      if (textNode.nodeType === Node.TEXT_NODE) {
        newRange.setStart(textNode, startIdx);
        newRange.setEnd(textNode, startIdx + selected.length);
      }
      sel.removeAllRanges();
      sel.addRange(newRange);

      const rect = newRange.getBoundingClientRect();
      const charStart = getCharOffset(containerRef.current!, textNode, startIdx);
      const charEnd = charStart + selected.length;

      onSelection({ text: selected, start: charStart, end: charEnd, rect });
    },
    [isRiffMode, onSelection]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("click", handleClick);
    el.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("dblclick", handleDblClick);

    return () => {
      el.removeEventListener("click", handleClick);
      el.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("dblclick", handleDblClick);
    };
  }, [handleClick, handleMouseUp, handleDblClick]);

  return (
    <div
      ref={containerRef}
      className="prose-content"
      dangerouslySetInnerHTML={{ __html: injectedHtml }}
      style={{
        fontFamily: "var(--font-playfair)",
        fontSize: "18px",
        lineHeight: 1.8,
        color: "#1a1a1a",
        userSelect: isRiffMode ? "text" : "text",
      }}
    />
  );
}
