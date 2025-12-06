'use client';

import { useState, useRef } from 'react';
import { CommentComposer, CommentItem, CommentButton, CommentHighlights } from '@/components/comments';
import { useTextSelection } from '@/hooks/useTextSelection';
import { Comment, CreateCommentInput } from '@/types';

// Mock data for testing
const mockPiece = {
  id: 'test-piece-1',
  title: 'A Test Piece for Comments',
  authorId: 'user-1',
  currentContent: `
    <h1>The Art of Writing</h1>
    <p>Writing is a journey of discovery. Every word we choose shapes the narrative, and every sentence builds upon the last to create meaning.</p>
    <p>The most important part of writing is revision. It's in the editing process that we refine our ideas and clarify our thoughts.</p>
    <p>Great writers understand that the first draft is just the beginning. The real magic happens when you return to your work with fresh eyes.</p>
  `,
  versions: [
    {
      id: 'version-1',
      versionNumber: 1,
      title: 'A Test Piece for Comments',
      content: `
        <h1>The Art of Writing</h1>
        <p>Writing is a journey of discovery. Every word we choose shapes the narrative, and every sentence builds upon the last to create meaning.</p>
        <p>The most important part of writing is revision. It's in the editing process that we refine our ideas and clarify our thoughts.</p>
        <p>Great writers understand that the first draft is just the beginning. The real magic happens when you return to your work with fresh eyes.</p>
      `,
      excerpt: 'Writing is a journey of discovery...',
      createdAt: new Date().toISOString(),
      shares: [],
    }
  ]
};

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
};

// Initial mock comments
const initialMockComments: Comment[] = [
  {
    id: 'comment-1',
    content: 'This is a great opening! Really draws the reader in.',
    pieceId: 'test-piece-1',
    versionId: 'version-1',
    authorId: 'user-1',
    author: {
      id: 'user-1',
      name: 'Test User',
      username: 'testuser',
      avatarUrl: null,
    },
    createdAt: new Date('2024-12-03T10:00:00'),
    updatedAt: new Date('2024-12-03T10:00:00'),
    selectionStart: 54,
    selectionEnd: 95,
    selectedText: 'Every word we choose shapes the narrative',
    replies: [],
  },
];

export default function TestCommentsPage() {
  const [selectedVersionId] = useState<string>('version-1');
  const [comments, setComments] = useState<Comment[]>(initialMockComments);
  const [showComposer, setShowComposer] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const { selection, clearSelection } = useTextSelection(contentRef);

  const selectedVersion = mockPiece.versions.find(v => v.id === selectedVersionId);

  // Recursive helper to add reply at any nesting level
  const addReplyRecursively = (
    comments: Comment[],
    parentId: string,
    newReply: Comment
  ): Comment[] => {
    return comments.map(comment => {
      // Found the parent - add reply
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      }

      // Search in nested replies
      if (comment.replies && comment.replies.length > 0) {
        const updatedReplies = addReplyRecursively(comment.replies, parentId, newReply);
        // Only update if something changed
        if (updatedReplies !== comment.replies) {
          return { ...comment, replies: updatedReplies };
        }
      }

      return comment;
    });
  };

  // Handle creating new comment
  const handleCreateComment = async (input: CreateCommentInput) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      content: input.content,
      pieceId: input.pieceId,
      versionId: input.versionId,
      circleId: input.circleId,
      authorId: mockUser.id,
      author: {
        id: mockUser.id,
        name: mockUser.name,
        username: 'testuser',
        avatarUrl: null,
      },
      parentId: input.parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      selectionStart: input.selectionStart,
      selectionEnd: input.selectionEnd,
      selectedText: input.selectedText,
      replies: [],
    };

    if (input.parentId) {
      // Add as reply to parent (supports any nesting level)
      setComments(prev => addReplyRecursively(prev, input.parentId, newComment));
    } else {
      // Add as top-level comment
      setComments(prev => [...prev, newComment]);
    }

    setShowComposer(false);
    clearSelection();
  };

  // Recursive helper to update comment at any nesting level
  const updateCommentRecursively = (
    comments: Comment[],
    commentId: string,
    content: string
  ): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          content,
          updatedAt: new Date(),
        };
      }

      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentRecursively(comment.replies, commentId, content),
        };
      }

      return comment;
    });
  };

  // Handle updating comment
  const handleUpdateComment = async (commentId: string, content: string) => {
    setComments(prev => updateCommentRecursively(prev, commentId, content));
  };

  // Recursive helper to delete comment at any nesting level
  const deleteCommentRecursively = (
    comments: Comment[],
    commentId: string
  ): Comment[] => {
    return comments
      .filter(comment => comment.id !== commentId)
      .map(comment => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: deleteCommentRecursively(comment.replies, commentId),
          };
        }
        return comment;
      });
  };

  // Handle deleting comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setComments(prev => deleteCommentRecursively(prev, commentId));
  };

  // Handle comment button click
  const handleCommentOnSelection = () => {
    setShowComposer(true);
  };

  // Handle clicking on highlighted text
  const handleCommentClick = (commentId: string) => {
    setHighlightedCommentId(commentId);

    // Scroll to comment
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedCommentId(null);
    }, 3000);
  };

  // Filter top-level comments
  const topLevelComments = comments.filter(comment => !comment.parentId);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '40px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '24px',
            color: '#111827',
          }}>
            Comment System Test
          </h1>

          <div style={{
            padding: '20px',
            background: '#eff6ff',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#1e40af',
          }}>
            <strong>Testing Instructions:</strong>
            <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
              <li>Select text below to see the comment button appear</li>
              <li>Click "Add Comment" to create a comment on selected text</li>
              <li>Click "Reply" on any comment to test nested replies</li>
              <li>Click "Edit" or "Delete" on your own comments</li>
              <li>Highlighted text (yellow) indicates commented passages</li>
              <li>Click highlighted text to scroll to the comment</li>
            </ul>
          </div>

          <div
            ref={contentRef}
            id="test-content"
            style={{
              fontSize: '18px',
              lineHeight: '1.8',
              color: '#374151',
              position: 'relative',
            }}
            dangerouslySetInnerHTML={{ __html: selectedVersion?.content || '' }}
          />

          {/* Comment highlights - shows yellow highlighting on commented text */}
          {comments.length > 0 && (
            <CommentHighlights
              comments={comments}
              containerRef={contentRef}
              onCommentClick={handleCommentClick}
            />
          )}

          {/* Floating comment button on text selection */}
          {selection && (
            <CommentButton
              selection={selection}
              onComment={handleCommentOnSelection}
            />
          )}
        </div>

        {/* Comments section */}
        {selectedVersion && (
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '40px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '24px',
              color: '#111827',
            }}>
              Comments ({comments.length})
            </h2>

            {/* Comment composer (shown when user selects text and clicks "Add Comment") */}
            {showComposer && (
              <div style={{ marginBottom: '24px' }}>
                <CommentComposer
                  pieceId={mockPiece.id}
                  versionId={selectedVersion.id}
                  selectedText={selection?.text}
                  selectionStart={selection?.start}
                  selectionEnd={selection?.end}
                  onSubmit={handleCreateComment}
                  onCancel={() => {
                    setShowComposer(false);
                    clearSelection();
                  }}
                  placeholder="Write a comment..."
                  autoFocus
                />
              </div>
            )}

            {/* Display all comments */}
            {topLevelComments.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px',
              }}>
                No comments yet. Select text above to add the first comment!
              </div>
            ) : (
              <div>
                {topLevelComments.map((comment) => (
                  <div key={comment.id} style={{ marginBottom: '16px' }}>
                    <CommentItem
                      comment={comment}
                      currentUserId={mockUser.id}
                      pieceId={mockPiece.id}
                      versionId={selectedVersion.id}
                      onUpdate={handleUpdateComment}
                      onDelete={handleDeleteComment}
                      onReply={handleCreateComment}
                      isHighlighted={highlightedCommentId === comment.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          padding: '20px',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#92400e',
        }}>
          <strong>Note:</strong> This is a test page using mock data only. No API calls are made - all interactions are client-side only.
          In production, this would connect to real API endpoints at:
          <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
            <li><code>/api/comments</code> - GET comments</li>
            <li><code>/api/comments/create</code> - POST new comment</li>
            <li><code>/api/comments/[id]</code> - PATCH/DELETE comment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
