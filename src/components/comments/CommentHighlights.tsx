'use client';

import { useEffect } from 'react';
import { Comment } from '@/types';

interface CommentHighlightsProps {
  comments: Comment[];
  containerRef: React.RefObject<HTMLElement>;
  onCommentClick?: (commentId: string) => void;
}

/**
 * Component that highlights text ranges where comments are anchored
 * Shows visual indicators for commented text in the piece content
 */
export function CommentHighlights({
  comments,
  containerRef,
  onCommentClick,
}: CommentHighlightsProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Filter comments that have text selection anchors
    const anchoredComments = comments.filter(
      (comment) =>
        comment.selectionStart !== undefined &&
        comment.selectionEnd !== undefined &&
        comment.selectionStart !== null &&
        comment.selectionEnd !== null
    );

    if (anchoredComments.length === 0) return;

    // Store original HTML to restore on cleanup
    const originalHTML = container.innerHTML;

    // Apply highlights
    const applyHighlights = () => {
      // Get all text content
      const textContent = container.textContent || '';

      // Sort comments by start position (reverse for correct wrapping)
      const sortedComments = [...anchoredComments].sort(
        (a, b) => (b.selectionStart || 0) - (a.selectionStart || 0)
      );

      // Create a document fragment to build new content
      const fragment = document.createDocumentFragment();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = originalHTML;

      sortedComments.forEach((comment) => {
        const start = comment.selectionStart!;
        const end = comment.selectionEnd!;

        if (start >= 0 && end <= textContent.length) {
          try {
            highlightRange(tempDiv, start, end, comment.id, onCommentClick);
          } catch (e) {
            console.warn('Failed to highlight comment range:', e);
          }
        }
      });

      // Replace container content
      container.innerHTML = tempDiv.innerHTML;
    };

    applyHighlights();

    // Cleanup: restore original HTML
    return () => {
      if (container) {
        container.innerHTML = originalHTML;
      }
    };
  }, [comments, containerRef, onCommentClick]);

  return null; // This component doesn't render anything itself
}

/**
 * Highlight a specific text range in the container
 */
function highlightRange(
  container: HTMLElement,
  start: number,
  end: number,
  commentId: string,
  onClick?: (commentId: string) => void
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

  // Find start and end text nodes
  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode as Text;
    const nodeLength = node.textContent?.length || 0;
    const nodeEnd = charCount + nodeLength;

    if (!startNode && charCount <= start && start < nodeEnd) {
      startNode = node;
      startOffset = start - charCount;
    }

    if (!endNode && charCount < end && end <= nodeEnd) {
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

      // Create mark element for highlighting
      const mark = document.createElement('mark');
      mark.dataset.commentId = commentId;
      mark.style.backgroundColor = '#fef3c7'; // Light yellow
      mark.style.padding = '2px 0';
      mark.style.borderRadius = '2px';
      mark.style.cursor = 'pointer';
      mark.style.transition = 'background-color 0.2s';
      mark.title = 'Click to view comment';

      // Add hover effect
      mark.addEventListener('mouseenter', () => {
        mark.style.backgroundColor = '#fde68a'; // Darker yellow on hover
      });

      mark.addEventListener('mouseleave', () => {
        mark.style.backgroundColor = '#fef3c7';
      });

      // Add click handler
      if (onClick) {
        mark.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(commentId);
        });
      }

      // Wrap the range
      range.surroundContents(mark);
    } catch (e) {
      // If surroundContents fails (e.g., range spans multiple elements),
      // try a fallback approach
      console.warn('Failed to wrap range, trying fallback:', e);
    }
  }
}
