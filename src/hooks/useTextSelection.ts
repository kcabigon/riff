'use client';

import { useState, useEffect, RefObject } from 'react';

export interface TextSelection {
  text: string;
  start: number;
  end: number;
  rect?: DOMRect;
}

/**
 * Hook for detecting and tracking text selections within a container
 * Returns the selected text, character offsets, and position for floating UI
 */
export function useTextSelection(containerRef: RefObject<HTMLElement>) {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const windowSelection = window.getSelection();

      if (!windowSelection || windowSelection.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const range = windowSelection.getRangeAt(0);
      const selectedText = windowSelection.toString().trim();

      // Only process if there's selected text
      if (!selectedText || selectedText.length === 0) {
        setSelection(null);
        return;
      }

      // Check if selection is within our container
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      // Calculate character offsets relative to container
      const { start, end } = getCharacterOffsets(container, range);

      // Get bounding rect for positioning floating UI
      const rect = range.getBoundingClientRect();

      setSelection({
        text: selectedText,
        start,
        end,
        rect,
      });
    };

    // Listen to selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [containerRef]);

  const clearSelection = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return { selection, clearSelection };
}

/**
 * Calculate character offsets within a container element
 * This accounts for nested elements and text nodes
 */
function getCharacterOffsets(
  container: HTMLElement,
  range: Range
): { start: number; end: number } {
  let start = 0;
  let end = 0;

  const treeWalker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let charCount = 0;
  let foundStart = false;
  let foundEnd = false;

  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode as Text;
    const nodeLength = node.textContent?.length || 0;

    if (!foundStart) {
      if (node === range.startContainer) {
        start = charCount + range.startOffset;
        foundStart = true;
      } else {
        charCount += nodeLength;
      }
    }

    if (foundStart && !foundEnd) {
      if (node === range.endContainer) {
        end = charCount + range.endOffset;
        foundEnd = true;
        break;
      } else {
        charCount += nodeLength;
      }
    }
  }

  return { start, end };
}

/**
 * Hook for highlighting text ranges in a container
 * Useful for showing where comments are anchored
 */
export function useTextHighlight(
  containerRef: RefObject<HTMLElement>,
  highlights: Array<{ start: number; end: number; id: string; color?: string }>
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Store original HTML to restore later
    const originalHTML = container.innerHTML;

    // Clear any existing highlights
    const clearHighlights = () => {
      container.innerHTML = originalHTML;
    };

    // Apply highlights
    const applyHighlights = () => {
      clearHighlights();

      // Sort highlights by start position (reverse order for correct nesting)
      const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start);

      const text = container.textContent || '';

      sortedHighlights.forEach((highlight) => {
        const { start, end, id, color = '#fef3c7' } = highlight;

        if (start >= 0 && end <= text.length) {
          // Create mark element
          const mark = document.createElement('mark');
          mark.dataset.highlightId = id;
          mark.style.backgroundColor = color;
          mark.style.padding = '2px 0';
          mark.style.borderRadius = '2px';
          mark.style.cursor = 'pointer';

          // Find and wrap the text range
          wrapTextRange(container, start, end, mark);
        }
      });
    };

    if (highlights.length > 0) {
      applyHighlights();
    }

    return () => {
      clearHighlights();
    };
  }, [containerRef, highlights]);
}

/**
 * Wrap a text range with an element
 */
function wrapTextRange(
  container: HTMLElement,
  start: number,
  end: number,
  wrapElement: HTMLElement
) {
  const range = document.createRange();
  const treeWalker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let charCount = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode as Text;
    const nodeLength = node.textContent?.length || 0;
    const nodeEnd = charCount + nodeLength;

    // Find start node and offset
    if (!startNode && charCount <= start && start < nodeEnd) {
      startNode = node;
      startOffset = start - charCount;
    }

    // Find end node and offset
    if (!endNode && charCount <= end && end <= nodeEnd) {
      endNode = node;
      endOffset = end - charCount;
    }

    if (startNode && endNode) break;

    charCount += nodeLength;
  }

  if (startNode && endNode) {
    try {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      range.surroundContents(wrapElement);
    } catch (e) {
      // If surroundContents fails (e.g., range spans multiple elements),
      // fallback to a simpler approach
      console.warn('Failed to wrap text range:', e);
    }
  }
}
