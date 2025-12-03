'use client';

import { useState } from 'react';
import { CreateCommentInput } from '@/types';

interface CommentComposerProps {
  pieceId: string;
  versionId: string;
  circleId?: string;
  parentId?: string; // For replies
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  onSubmit: (comment: CreateCommentInput) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentComposer({
  pieceId,
  versionId,
  circleId,
  parentId,
  selectedText,
  selectionStart,
  selectionEnd,
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false,
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        content: content.trim(),
        pieceId,
        versionId,
        circleId,
        parentId,
        selectionStart,
        selectionEnd,
        selectedText,
      });

      // Reset form
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="comment-composer">
      {selectedText && (
        <div className="selected-text-preview" style={{
          padding: '8px 12px',
          background: '#f3f4f6',
          borderLeft: '3px solid #3b82f6',
          marginBottom: '8px',
          fontSize: '14px',
          color: '#6b7280',
          fontStyle: 'italic',
        }}>
          &ldquo;{selectedText}&rdquo;
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isSubmitting}
        rows={3}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          minHeight: '80px',
        }}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '8px',
      }}>
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          style={{
            padding: '6px 12px',
            background: content.trim() ? '#3b82f6' : '#d1d5db',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: content.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </button>
      </div>
    </form>
  );
}
