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
  activeHighlightId: string | null;
  onSelection: (selection: PendingSelection) => void;
  onHighlightClick: (commentId: string) => void;
  onImageComment?: (rect: DOMRect) => void;
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

function buildTextNodeMap(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: { node: Text; start: number; end: number }[] = [];
  let offset = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = (node.textContent || "").length;
    nodes.push({ node, start: offset, end: offset + len });
    offset += len;
  }
  return nodes;
}

export default function ReadOnlyEditor({
  content,
  comments,
  isRiffMode,
  activeHighlightId,
  onSelection,
  onHighlightClick,
  onImageComment,
}: ReadOnlyEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getSharedExtensions(),
    content,
    editable: false,
  });

  // Inject comment highlights via DOM manipulation
  useEffect(() => {
    if (!editor || !containerRef.current) return;

    const proseMirror = containerRef.current.querySelector(".ProseMirror");
    if (!proseMirror) return;

    // Remove existing marks
    proseMirror.querySelectorAll("mark[data-comment-id]").forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
      }
    });
    // Normalize text nodes after unwrapping marks
    proseMirror.normalize();

    if (!isRiffMode || comments.length === 0) return;

    // Sort comments by selectionStart descending so we inject from back to front
    // This prevents offset drift when DOM is mutated
    const sorted = [...comments]
      .filter((c) => c.selectedText && c.selectionStart != null)
      .sort((a, b) => b.selectionStart - a.selectionStart);

    for (const comment of sorted) {
      // Rebuild text node map fresh for each comment (DOM may have changed)
      const textNodes = buildTextNodeMap(proseMirror);
      const fullText = textNodes.map((t) => t.node.textContent).join("");

      const idx = fullText.indexOf(
        comment.selectedText,
        Math.max(0, comment.selectionStart - 10)
      );
      if (idx === -1) continue;

      const selStart = idx;
      const selEnd = idx + comment.selectedText.length;
      const isActive = comment.id === activeHighlightId;

      // Find text nodes that overlap and wrap them
      for (const tn of textNodes) {
        if (tn.end <= selStart || tn.start >= selEnd) continue;

        const nodeStart = Math.max(0, selStart - tn.start);
        const nodeEnd = Math.min(
          (tn.node.textContent || "").length,
          selEnd - tn.start
        );
        if (nodeStart >= nodeEnd) continue;

        try {
          const range = document.createRange();
          range.setStart(tn.node, nodeStart);
          range.setEnd(tn.node, nodeEnd);

          const mark = document.createElement("mark");
          mark.setAttribute("data-comment-id", comment.id);
          mark.style.background = isActive
            ? "rgba(0,255,102,0.45)"
            : "rgba(0,255,102,0.2)";
          mark.style.cursor = "pointer";
          mark.style.padding = "0";
          mark.style.transition = "background 0.15s ease";

          range.surroundContents(mark);
        } catch {
          // surroundContents can throw if range crosses element boundaries
          continue;
        }

        break;
      }
    }
  }, [editor, comments, isRiffMode, activeHighlightId]);

  // Handle clicks on highlights and images
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check for comment highlight click
      const mark = target.closest(
        "mark[data-comment-id]"
      ) as HTMLElement | null;
      if (mark) {
        const commentId = mark.getAttribute("data-comment-id");
        if (commentId) {
          e.stopPropagation();
          onHighlightClick(commentId);
          return;
        }
      }

      // Check for image click in riff mode
      if (isRiffMode && target.tagName === "IMG" && onImageComment) {
        e.stopPropagation();
        const rect = target.getBoundingClientRect();
        onImageComment(rect);
      }
    },
    [onHighlightClick, isRiffMode, onImageComment]
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
