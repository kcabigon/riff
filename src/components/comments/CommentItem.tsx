'use client';

import { useState } from 'react';
import { Comment } from '@/types';
import { CommentComposer } from './CommentComposer';
import { CreateCommentInput } from '@/types';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  pieceId: string;
  versionId: string;
  circleId?: string;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReply: (comment: CreateCommentInput) => Promise<void>;
  depth?: number; // For nesting visual indication
  isHighlighted?: boolean; // For highlighting when clicked from text
}

export function CommentItem({
  comment,
  currentUserId,
  pieceId,
  versionId,
  circleId,
  onUpdate,
  onDelete,
  onReply,
  depth = 0,
  isHighlighted = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = comment.authorId === currentUserId;
  const isEdited = comment.updatedAt && comment.updatedAt.getTime() !== comment.createdAt.getTime();

  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    try {
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setIsDeleting(false);
    }
  };

  const handleReply = async (commentInput: CreateCommentInput) => {
    try {
      await onReply(commentInput);
      setIsReplying(false);
    } catch (error) {
      console.error('Error replying to comment:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (isDeleting) {
    return null;
  }

  return (
    <div
      id={`comment-${comment.id}`}
      style={{
        marginLeft: depth > 0 ? '24px' : '0',
        borderLeft: depth > 0 ? '2px solid #e5e7eb' : 'none',
        paddingLeft: depth > 0 ? '12px' : '0',
      }}
    >
      <div style={{
        padding: '12px',
        background: isHighlighted ? '#dbeafe' : '#f9fafb',
        borderRadius: '8px',
        marginBottom: '8px',
        border: isHighlighted ? '2px solid #3b82f6' : 'none',
        transition: 'all 0.3s',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {comment.author?.name || 'Unknown User'}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {formatDate(comment.createdAt)}
              {isEdited && ' (edited)'}
            </span>
          </div>

          {isAuthor && !isEditing && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Selected text preview (if exists) */}
        {comment.selectedText && (
          <div style={{
            padding: '6px 10px',
            background: '#e0e7ff',
            borderLeft: '3px solid #3b82f6',
            marginBottom: '8px',
            fontSize: '13px',
            color: '#4b5563',
            fontStyle: 'italic',
          }}>
            &ldquo;{comment.selectedText}&rdquo;
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                marginBottom: '8px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditContent(comment.content);
                  setIsEditing(false);
                }}
                style={{
                  padding: '4px 12px',
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!editContent.trim()}
                style={{
                  padding: '4px 12px',
                  background: editContent.trim() ? '#3b82f6' : '#d1d5db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: editContent.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 8px 0', whiteSpace: 'pre-wrap' }}>
              {comment.content}
            </p>
            <button
              onClick={() => setIsReplying(!isReplying)}
              style={{
                fontSize: '13px',
                color: '#3b82f6',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                fontWeight: '500',
              }}
            >
              Reply
            </button>
          </div>
        )}
      </div>

      {/* Reply composer */}
      {isReplying && (
        <div style={{ marginBottom: '12px', marginLeft: '24px' }}>
          <CommentComposer
            pieceId={pieceId}
            versionId={versionId}
            circleId={circleId}
            parentId={comment.id}
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            placeholder="Write a reply..."
            autoFocus
          />
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              pieceId={pieceId}
              versionId={versionId}
              circleId={circleId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
