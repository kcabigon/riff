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
  authorId: string;
}

// Design system colors for per-author highlights
const AUTHOR_COLORS = [
  "#01EFFC", // cyan
  "#00FF66", // green
  "#EECF01", // yellow
  "#FF6B35", // orange
  "#C01582", // pink
  "#955CB5", // purple
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export { AUTHOR_COLORS };

export function buildAuthorColorMap(
  comments: { authorId: string }[]
): Record<string, string> {
  const map: Record<string, string> = {};
  const seen: string[] = [];
  for (const c of comments) {
    if (!map[c.authorId]) {
      seen.push(c.authorId);
      map[c.authorId] = AUTHOR_COLORS[(seen.length - 1) % AUTHOR_COLORS.length];
    }
  }
  return map;
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
  activeHighlightIds: string[];
  pendingSelection: PendingSelection | null;
  currentUserId?: string;
  onSelection: (selection: PendingSelection) => void;
  onHighlightClick: (commentIds: string[]) => void;
  onClearHighlight?: () => void;
  onImageComment?: (rect: DOMRect, charOffset: number) => void;
  onEditorReady?: () => void;
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
  activeHighlightIds,
  pendingSelection,
  currentUserId,
  onSelection,
  onHighlightClick,
  onClearHighlight,
  onImageComment,
  onEditorReady,
}: ReadOnlyEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getSharedExtensions(),
    content,
    editable: false,
  });

  // Fire onEditorReady once when Tiptap finishes initializing.
  // Used by ReadPageLayout to defer riff mode activation until the editor
  // is ready, so marks are always in the DOM before the sidebar mounts.
  const editorReadyFiredRef = useRef(false);
  useEffect(() => {
    if (editor && !editorReadyFiredRef.current) {
      editorReadyFiredRef.current = true;
      onEditorReady?.();
    }
  }, [editor, onEditorReady]);

  // Inject comment highlights via DOM manipulation
  useEffect(() => {
    if (!editor || !containerRef.current) return;

    const proseMirror = containerRef.current.querySelector(".ProseMirror");
    if (!proseMirror) return;

    // Preserve scroll position during DOM manipulation
    const scrollY = window.scrollY;

    // ProseMirror's MutationObserver fires after this effect and tries to
    // restore its stored selection onto text nodes we've split via
    // surroundContents. Patch collapse to swallow the resulting
    // IndexSizeError for that one macrotask window.
    const origCollapse = Selection.prototype.collapse;
    Selection.prototype.collapse = function (
      node: Node | null,
      offset?: number
    ) {
      try {
        origCollapse.call(this, node, offset);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "IndexSizeError"))
          throw e;
      }
    };
    setTimeout(() => {
      Selection.prototype.collapse = origCollapse;
    }, 50);

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

    // Reset image comment styles
    proseMirror.querySelectorAll("img[data-comment-id]").forEach((img) => {
      const el = img as HTMLElement;
      el.removeAttribute("data-comment-id");
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.style.cursor = "";
    });

    if (!isRiffMode) return;

    // Build author → color map
    const authorColors = buildAuthorColorMap(comments);

    // Build all items to highlight: existing comments + pending selection
    const allHighlights: {
      id: string;
      selectedText: string;
      selectionStart: number;
      isActive: boolean;
      isPending: boolean;
      color: string;
    }[] = comments
      .filter((c) => c.selectedText && c.selectionStart != null)
      .map((c) => ({
        id: c.id,
        selectedText: c.selectedText,
        selectionStart: c.selectionStart,
        isActive: activeHighlightIds.includes(c.id),
        isPending: false,
        color: authorColors[c.authorId] || AUTHOR_COLORS[0],
      }));

    // Add pending selection as a temporary highlight
    if (
      pendingSelection &&
      pendingSelection.text &&
      pendingSelection.start >= 0
    ) {
      // Use current user's color, or next available color if they haven't commented yet
      const pendingColor =
        currentUserId && authorColors[currentUserId]
          ? authorColors[currentUserId]
          : AUTHOR_COLORS[
              Object.keys(authorColors).length % AUTHOR_COLORS.length
            ];

      allHighlights.push({
        id: "__pending__",
        selectedText: pendingSelection.text,
        selectionStart: pendingSelection.start,
        isActive: false,
        isPending: true,
        color: pendingColor,
      });
    }

    if (allHighlights.length === 0) return;

    // Sort by selectionStart descending so we inject from back to front
    // This prevents offset drift when DOM is mutated
    const sorted = [...allHighlights].sort(
      (a, b) => b.selectionStart - a.selectionStart
    );

    for (const highlight of sorted) {
      const textNodes = buildTextNodeMap(proseMirror);
      const fullText = textNodes.map((t) => t.node.textContent).join("");

      // Try exact position first, then nearby window, then full search as last resort
      let idx = -1;
      const text = highlight.selectedText;
      const pos = highlight.selectionStart;

      // 1. Exact match at stored position
      if (fullText.substring(pos, pos + text.length) === text) {
        idx = pos;
      }
      // 2. Small window around stored position (handles minor drift)
      if (idx === -1) {
        const windowStart = Math.max(0, pos - 30);
        const windowEnd = Math.min(fullText.length, pos + text.length + 30);
        const window = fullText.substring(windowStart, windowEnd);
        const windowIdx = window.indexOf(text);
        if (windowIdx !== -1) {
          idx = windowStart + windowIdx;
        }
      }
      // 3. Full document search — only if text is unique
      if (idx === -1) {
        const firstIdx = fullText.indexOf(text);
        if (firstIdx !== -1 && fullText.indexOf(text, firstIdx + 1) === -1) {
          idx = firstIdx;
        }
      }
      if (idx === -1) continue;

      const selStart = idx;
      const selEnd = idx + highlight.selectedText.length;

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
          mark.setAttribute("data-comment-id", highlight.id);
          mark.style.background =
            highlight.isActive || highlight.isPending
              ? hexToRgba(highlight.color, 0.4)
              : hexToRgba(highlight.color, 0.2);
          mark.style.cursor = "pointer";
          mark.style.padding = "0";
          mark.style.transition = "background 0.15s ease";

          range.surroundContents(mark);
        } catch {
          // surroundContents can throw if range crosses element boundaries
          continue;
        }
      }
    }

    // Highlight images that have comments
    const images = proseMirror.querySelectorAll("img");
    const imageTextOffsets: { img: HTMLElement; offset: number }[] = [];
    if (images.length > 0) {
      const textNodes = buildTextNodeMap(proseMirror);
      for (const img of images) {
        // Find the text offset just before this image
        let offset = 0;
        for (const tn of textNodes) {
          if (
            img.compareDocumentPosition(tn.node) &
            Node.DOCUMENT_POSITION_FOLLOWING
          ) {
            break;
          }
          offset = tn.end;
        }
        imageTextOffsets.push({ img: img as HTMLElement, offset });
      }
    }

    for (const highlight of allHighlights) {
      if (highlight.selectedText !== "[Image]") continue;
      // Find the closest image to this offset
      let closestImg: HTMLElement | null = null;
      let closestDist = Infinity;
      for (const { img, offset } of imageTextOffsets) {
        const dist = Math.abs(offset - highlight.selectionStart);
        if (dist < closestDist) {
          closestDist = dist;
          closestImg = img;
        }
      }
      if (closestImg) {
        closestImg.setAttribute("data-comment-id", highlight.id);
        closestImg.style.outline = `3px solid ${highlight.isActive || highlight.isPending ? highlight.color : hexToRgba(highlight.color, 0.5)}`;
        closestImg.style.outlineOffset = "2px";
        closestImg.style.cursor = "pointer";
      }
    }

    // Restore scroll position after DOM manipulation
    window.scrollTo(0, scrollY);
  }, [
    editor,
    comments,
    isRiffMode,
    activeHighlightIds,
    pendingSelection,
    currentUserId,
  ]);

  // Handle clicks on highlights and images
  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Bug fix: if the user has text selected they're drag-selecting —
      // let handleSelectionEnd take over instead of firing a highlight click
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;

      const target = e.target as HTMLElement;

      // Collect ALL marks at this click point (not just the innermost one).
      // elementsFromPoint returns elements top-to-bottom in z-order, so we get
      // every mark that overlaps at this pixel, covering nested/overlapping highlights.
      const marksAtPoint = document
        .elementsFromPoint(e.clientX, e.clientY)
        .filter((el): el is HTMLElement => el.matches("mark[data-comment-id]"));

      if (marksAtPoint.length > 0) {
        const commentIds = [
          ...new Set(
            marksAtPoint
              .map((m) => m.getAttribute("data-comment-id"))
              .filter((id): id is string => id !== null && id !== "__pending__")
          ),
        ];
        if (commentIds.length > 0) {
          e.stopPropagation();
          onHighlightClick(commentIds);
          return;
        }
      }

      // Click on non-highlighted content — clear active highlights
      if (isRiffMode && activeHighlightIds.length > 0) {
        onClearHighlight?.();
      }

      // Check for image click in riff mode
      if (isRiffMode && target.tagName === "IMG") {
        e.stopPropagation();
        const existingCommentId = target.getAttribute("data-comment-id");
        // First click: activate existing comment. Second click: open new compose
        if (
          existingCommentId &&
          !activeHighlightIds.includes(existingCommentId)
        ) {
          onHighlightClick([existingCommentId]);
          return;
        }
        if (!onImageComment) return;
        const rect = target.getBoundingClientRect();
        // Calculate the character offset of the image in the text flow
        const proseMirror = containerRef.current?.querySelector(".ProseMirror");
        let charOffset = 0;
        if (proseMirror) {
          const walker = document.createTreeWalker(
            proseMirror,
            NodeFilter.SHOW_TEXT
          );
          // Walk text nodes until we pass the image's position in the DOM
          while (walker.nextNode()) {
            const textNode = walker.currentNode;
            // Check if this text node comes after the image
            if (
              target.compareDocumentPosition(textNode) &
              Node.DOCUMENT_POSITION_FOLLOWING
            ) {
              break;
            }
            charOffset += (textNode.textContent || "").length;
          }
        }
        onImageComment(rect, charOffset);
      }
    },
    [
      onHighlightClick,
      onClearHighlight,
      isRiffMode,
      onImageComment,
      activeHighlightIds,
    ]
  );

  // Handle text selection (fires on both mouse and touch)
  const handleSelectionEnd = useCallback(() => {
    if (!isRiffMode || !containerRef.current) return;

    const proseMirror = containerRef.current.querySelector(".ProseMirror");
    if (!proseMirror) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0)
      return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) return;

    // Check that at least part of the selection is within our editor
    if (
      !proseMirror.contains(range.startContainer) &&
      !proseMirror.contains(range.endContainer)
    )
      return;

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
    document.addEventListener("mouseup", handleSelectionEnd);
    document.addEventListener("touchend", handleSelectionEnd);

    return () => {
      el.removeEventListener("click", handleClick);
      document.removeEventListener("mouseup", handleSelectionEnd);
      document.removeEventListener("touchend", handleSelectionEnd);
    };
  }, [handleClick, handleSelectionEnd]);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="write-editor">
      <EditorContent editor={editor} style={{ cursor: "default" }} />
    </div>
  );
}
