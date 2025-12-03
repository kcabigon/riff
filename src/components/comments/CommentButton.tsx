'use client';

import { TextSelection } from '@/hooks/useTextSelection';

interface CommentButtonProps {
  selection: TextSelection;
  onComment: () => void;
}

export function CommentButton({ selection, onComment }: CommentButtonProps) {
  if (!selection.rect) return null;

  const { rect } = selection;

  // Position the button above the selected text
  const top = rect.top + window.scrollY - 40; // 40px above
  const left = rect.left + window.scrollX + rect.width / 2 - 50; // Centered (button width ~100px)

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 1000,
      }}
    >
      <button
        onClick={onComment}
        style={{
          padding: '8px 16px',
          background: '#3b82f6',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
        }}
        onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Add Comment
      </button>
    </div>
  );
}
