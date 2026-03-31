"use client";

import { useRef, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getSharedExtensions } from "@/components/editor/extensions/sharedExtensions";
import "@/app/write/[pieceId]/editor.css";

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

interface ReadOnlyEditorProps {
  content: string;
  comments: CommentData[];
  isRiffMode: boolean;
  onSelection: (selection: PendingSelection) => void;
  onHighlightClick: (commentId: string) => void;
}

function getCharOffset(root: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  while (walker.nextNode()) {
    if (walker.currentNode === node) return total + offset;
    total += (walker.currentNode.textContent || "").length;
  }
  return total;
}

export default function ReadOnlyEditor({
  content,
  comments,
  isRiffMode,
  onSelection,
  onHighlightClick,
}: ReadOnlyEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getSharedExtensions(),
    content,
    editable: false,
  });

  // Inject comment highlights as <mark> decorations via DOM manipulation
  // after Tiptap renders the content
  useEffect(() => {
    if (!editor || !containerRef.current) return;

    const proseMirror = containerRef.current.querySelector(".ProseMirror");
    if (!proseMirror) return;

    // Remove any existing marks first
    proseMirror.querySelectorAll("mark[data-comment-id]").forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
      }
    });

    if (!isRiffMode || comments.length === 0) return;

    // Walk text nodes to build a char-offset map
    const walker = document.createTreeWalker(proseMirror, NodeFilter.SHOW_TEXT);
    const textNodes: { node: Text; start: number; end: number }[] = [];
    let charCount = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const len = (node.textContent || "").length;
      textNodes.push({ node, start: charCount, end: charCount + len });
      charCount += len;
    }

    // For each comment, find and wrap the matching text in <mark>
    for (const comment of comments) {
      if (!comment.selectedText || comment.selectionStart == null) continue;

      // Find the text by searching for it in the full text content
      const fullText = textNodes.map((t) => t.node.textContent).join("");
      const idx = fullText.indexOf(
        comment.selectedText,
        Math.max(0, comment.selectionStart - 10)
      );
      if (idx === -1) continue;

      const selStart = idx;
      const selEnd = idx + comment.selectedText.length;

      // Find text nodes that overlap with this selection
      for (const tn of textNodes) {
        if (tn.end <= selStart || tn.start >= selEnd) continue;

        const nodeStart = Math.max(0, selStart - tn.start);
        const nodeEnd = Math.min(
          (tn.node.textContent || "").length,
          selEnd - tn.start
        );

        if (nodeStart >= nodeEnd) continue;

        const range = document.createRange();
        range.setStart(tn.node, nodeStart);
        range.setEnd(tn.node, nodeEnd);

        const mark = document.createElement("mark");
        mark.setAttribute("data-comment-id", comment.id);
        mark.style.background = "rgba(0,255,102,0.25)";
        mark.style.cursor = "pointer";
        mark.style.borderRadius = "2px";
        mark.style.padding = "0";

        range.surroundContents(mark);

        // Re-walk since DOM changed
        break;
      }
    }
  }, [editor, comments, isRiffMode]);

  // Handle clicks on highlights
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest(
        "mark[data-comment-id]"
      ) as HTMLElement | null;
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

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    if (!isRiffMode || !containerRef.current) return;

    const proseMirror = containerRef.current.querySelector(".ProseMirror");
    if (!proseMirror) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0)
      return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) return;

    if (!proseMirror.contains(range.commonAncestorContainer)) return;

    const start = getCharOffset(
      proseMirror as HTMLElement,
      range.startContainer,
      range.startOffset
    );
    const end = getCharOffset(
      proseMirror as HTMLElement,
      range.endContainer,
      range.endOffset
    );

    const rect = range.getBoundingClientRect();
    onSelection({ text, start, end, rect });
  }, [isRiffMode, onSelection]);

  // Attach event listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("click", handleClick);
    el.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("click", handleClick);
      el.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleClick, handleMouseUp]);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="write-editor">
      <EditorContent editor={editor} style={{ cursor: "default" }} />
    </div>
  );
}
