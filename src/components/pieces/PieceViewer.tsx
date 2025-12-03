'use client';

import { useState, useRef } from 'react';
import PieceStatus from './PieceStatus';
import VersionTimeline from './VersionTimeline';
import ShareModal from './ShareModal';
import { CommentThread, CommentButton, CommentHighlights } from '@/components/comments';
import { useTextSelection } from '@/hooks/useTextSelection';
import { Comment } from '@/types';

interface Circle {
  id: string;
  name: string;
}

interface Version {
  id: string;
  versionNumber: number;
  title: string;
  content: string;
  excerpt: string | null;
  createdAt: string;
  shares: Array<{
    circle: Circle;
    prompt?: {
      title: string;
    } | null;
  }>;
  _count?: {
    comments: number;
  };
}

interface Piece {
  id: string;
  title: string;
  currentContent: string;
  versions: Version[];
}

interface PieceViewerProps {
  piece: Piece;
  userCircles: Circle[];
  isAuthor: boolean;
  currentUserId: string;
  circleId?: string; // Optional: If viewing in circle context
  onShare?: (pieceId: string, circleId: string, promptId?: string) => Promise<void>;
}

export default function PieceViewer({
  piece,
  userCircles,
  isAuthor,
  currentUserId,
  circleId,
  onShare,
}: PieceViewerProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showCommentComposer, setShowCommentComposer] = useState(false);
  const [versionComments, setVersionComments] = useState<Comment[]>([]);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const { selection, clearSelection } = useTextSelection(contentRef);

  const selectedVersion = selectedVersionId
    ? piece.versions.find((v) => v.id === selectedVersionId)
    : null;

  const displayContent = selectedVersion ? selectedVersion.content : piece.currentContent;
  const displayTitle = selectedVersion ? selectedVersion.title : piece.title;
  const isViewingDraft = !selectedVersion;

  // Get version ID for comments (can only comment on shared versions, not draft)
  const versionIdForComments = selectedVersion?.id;

  const handleCommentOnSelection = () => {
    setShowCommentComposer(true);
    // Selection will be passed to CommentThread which will handle it
  };

  const handleCommentClick = (commentId: string) => {
    setHighlightedCommentId(commentId);
    // Scroll to comment
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const sharedCircles = piece.versions.flatMap((v) =>
    v.shares.map((s) => s.circle)
  );
  const uniqueCircles = Array.from(
    new Map(sharedCircles.map((c) => [c.id, c])).values()
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {displayTitle}
            </h1>
            <div className="flex items-center gap-3">
              <PieceStatus
                isShared={piece.versions.length > 0}
                sharedCircles={uniqueCircles}
              />
              {isViewingDraft && (
                <span className="text-sm text-gray-500">Viewing draft</span>
              )}
              {selectedVersion && (
                <span className="text-sm text-gray-500">
                  Viewing Version {selectedVersion.versionNumber}
                </span>
              )}
            </div>
          </div>

          {isAuthor && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showVersions ? 'Hide' : 'Show'} Versions ({piece.versions.length})
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Share
              </button>
            </div>
          )}
        </div>

        {/* Version switcher */}
        {isAuthor && isViewingDraft && piece.versions.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              You&apos;re viewing your current draft. This is not what circle members see.{' '}
              <button
                onClick={() => setShowVersions(true)}
                className="underline font-medium"
              >
                View shared versions
              </button>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg p-8">
            <div
              ref={contentRef}
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />

            {/* Comment highlights */}
            {!isViewingDraft && versionIdForComments && versionComments.length > 0 && (
              <CommentHighlights
                comments={versionComments}
                containerRef={contentRef}
                onCommentClick={handleCommentClick}
              />
            )}

            {/* Floating comment button on text selection */}
            {selection && !isViewingDraft && versionIdForComments && (
              <CommentButton
                selection={selection}
                onComment={handleCommentOnSelection}
              />
            )}
          </div>

          {/* Comments section */}
          {!isViewingDraft && versionIdForComments && (
            <div className="mt-6">
              {isViewingDraft ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Comments are only available on shared versions. View a version to see comments.
                  </p>
                </div>
              ) : (
                <CommentThread
                  pieceId={piece.id}
                  versionId={versionIdForComments}
                  circleId={circleId}
                  currentUserId={currentUserId}
                  selectedText={showCommentComposer ? selection?.text : undefined}
                  selectionStart={showCommentComposer ? selection?.start : undefined}
                  selectionEnd={showCommentComposer ? selection?.end : undefined}
                  onClearSelection={() => {
                    setShowCommentComposer(false);
                    clearSelection();
                  }}
                  onCommentsChange={setVersionComments}
                  highlightedCommentId={highlightedCommentId}
                />
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showVersions && piece.versions.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Version History</h2>
              <VersionTimeline
                versions={piece.versions}
                currentVersionId={selectedVersionId || undefined}
                onVersionSelect={(versionId) => {
                  if (versionId === selectedVersionId) {
                    setSelectedVersionId(null); // Back to draft
                  } else {
                    setSelectedVersionId(versionId);
                  }
                }}
              />
              {selectedVersion && (
                <button
                  onClick={() => setSelectedVersionId(null)}
                  className="mt-4 w-full px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  Back to Current Draft
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {onShare && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShare={onShare}
          circles={userCircles}
          pieceId={piece.id}
          pieceTitle={piece.title}
        />
      )}
    </div>
  );
}
