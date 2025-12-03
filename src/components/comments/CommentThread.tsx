'use client';

import { useState, useEffect } from 'react';
import { Comment, CreateCommentInput } from '@/types';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';

interface CommentThreadProps {
  pieceId: string;
  versionId: string;
  circleId?: string;
  currentUserId: string;
  initialComments?: Comment[];
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
  onClearSelection?: () => void;
  onCommentsChange?: (comments: Comment[]) => void;
  highlightedCommentId?: string | null;
}

export function CommentThread({
  pieceId,
  versionId,
  circleId,
  currentUserId,
  initialComments = [],
  selectedText,
  selectionStart,
  selectionEnd,
  onClearSelection,
  onCommentsChange,
  highlightedCommentId,
}: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments
  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        pieceId,
        versionId,
        ...(circleId && { circleId }),
      });

      const response = await fetch(`/api/comments?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      const fetchedComments = data.comments || [];
      setComments(fetchedComments);
      onCommentsChange?.(fetchedComments);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load comments on mount
  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments();
    }
  }, [pieceId, versionId, circleId]);

  // Create new comment
  const handleCreateComment = async (commentInput: CreateCommentInput) => {
    try {
      const response = await fetch('/api/comments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentInput),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create comment');
      }

      // Clear selection after comment is created
      onClearSelection?.();

      // Refresh comments to get updated list with replies
      await fetchComments();
    } catch (err: any) {
      console.error('Error creating comment:', err);
      throw err;
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update comment');
      }

      // Update comment in state
      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, content, updatedAt: new Date() };
          }
          // Also check replies
          if (comment.replies) {
            comment.replies = comment.replies.map((reply) =>
              reply.id === commentId ? { ...reply, content, updatedAt: new Date() } : reply
            );
          }
          return comment;
        })
      );
    } catch (err: any) {
      console.error('Error updating comment:', err);
      throw err;
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      // Remove comment from state
      setComments((prevComments) =>
        prevComments.filter((comment) => {
          // Remove if it's the deleted comment
          if (comment.id === commentId) return false;

          // Also filter replies
          if (comment.replies) {
            comment.replies = comment.replies.filter((reply) => reply.id !== commentId);
          }

          return true;
        })
      );
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  };

  // Filter out replies (they're shown nested within parents)
  const topLevelComments = comments.filter((comment) => !comment.parentId);

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
        Comments ({comments.length})
      </h3>

      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* New comment composer */}
      <div style={{ marginBottom: '24px' }}>
        <CommentComposer
          pieceId={pieceId}
          versionId={versionId}
          circleId={circleId}
          onSubmit={handleCreateComment}
          selectedText={selectedText}
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          onCancel={onClearSelection}
          placeholder="Add a comment..."
        />
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
          Loading comments...
        </div>
      ) : topLevelComments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              pieceId={pieceId}
              versionId={versionId}
              circleId={circleId}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
              onReply={handleCreateComment}
              isHighlighted={comment.id === highlightedCommentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
