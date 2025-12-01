'use client';

import { useState, useEffect } from 'react';

interface Circle {
  id: string;
  name: string;
  prompts?: Array<{
    id: string;
    title: string;
    deadline: string | null;
  }>;
}

interface Piece {
  id: string;
  title: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (pieceId: string, circleId: string, promptId?: string) => Promise<void>;
  circles: Circle[];
  // For piece-view context (sharing from piece editor)
  pieceId?: string;
  pieceTitle?: string;
  // For circle-view context (sharing from circle page)
  pieces?: Piece[];
  preSelectedCircleId?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  onShare,
  circles,
  pieceId,
  pieceTitle,
  pieces,
  preSelectedCircleId,
}: ShareModalProps) {
  const [selectedPiece, setSelectedPiece] = useState<string>(pieceId || '');
  const [selectedCircle, setSelectedCircle] = useState<string>(preSelectedCircleId || '');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);

  // Update selections when props change
  useEffect(() => {
    if (pieceId) setSelectedPiece(pieceId);
    if (preSelectedCircleId) setSelectedCircle(preSelectedCircleId);
  }, [pieceId, preSelectedCircleId]);

  if (!isOpen) return null;

  const isCircleViewMode = !!pieces && !!preSelectedCircleId;
  const isPieceViewMode = !!pieceId && !!pieceTitle;

  const selectedCircleData = circles.find((c) => c.id === selectedCircle);
  const activePrompts = selectedCircleData?.prompts?.filter(
    (p) => !p.deadline || new Date(p.deadline) > new Date()
  ) || [];

  const selectedPieceData = pieces?.find((p) => p.id === selectedPiece);
  const displayTitle = pieceTitle || selectedPieceData?.title || '';

  const handleShare = async () => {
    if (!selectedCircle || !selectedPiece) return;

    setIsSharing(true);
    try {
      await onShare(selectedPiece, selectedCircle, selectedPrompt || undefined);
      onClose();
      // Reset state
      if (!pieceId) setSelectedPiece('');
      if (!preSelectedCircleId) setSelectedCircle('');
      setSelectedPrompt('');
    } catch (error) {
      console.error('Error sharing piece:', error);
      alert('Failed to share piece');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Share Piece</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isCircleViewMode
              ? `Share a piece to ${selectedCircleData?.name}`
              : `Share "${displayTitle}" to a circle`}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Sharing creates a frozen snapshot (version) of your piece. You can
              continue editing your draft afterward.
            </p>
          </div>

          {/* Piece selection (only in circle-view mode) */}
          {isCircleViewMode && pieces && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Piece
              </label>
              <select
                value={selectedPiece}
                onChange={(e) => setSelectedPiece(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a piece...</option>
                {pieces.map((piece) => (
                  <option key={piece.id} value={piece.id}>
                    {piece.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Circle selection (only in piece-view mode) */}
          {isPieceViewMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Circle
              </label>
              <select
                value={selectedCircle}
                onChange={(e) => {
                  setSelectedCircle(e.target.value);
                  setSelectedPrompt(''); // Reset prompt selection
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a circle...</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Circle display (in circle-view mode - disabled/locked) */}
          {isCircleViewMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Circle
              </label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-700">
                {selectedCircleData?.name}
              </div>
            </div>
          )}

          {/* Prompt selection (optional) */}
          {selectedCircle && activePrompts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Respond to Prompt (Optional)
              </label>
              <select
                value={selectedPrompt}
                onChange={(e) => setSelectedPrompt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No prompt</option>
                {activePrompts.map((prompt) => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.title}
                    {prompt.deadline &&
                      ` (Due: ${new Date(prompt.deadline).toLocaleDateString()})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview */}
          {selectedCircle && selectedPiece && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">This will:</span>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>
                  • Share &quot;{displayTitle}&quot; to{' '}
                  <span className="font-medium">{selectedCircleData?.name}</span>
                </li>
                <li>• Create a new frozen version</li>
                {selectedPrompt && (
                  <li>
                    • Link to prompt:{' '}
                    <span className="font-medium">
                      {activePrompts.find((p) => p.id === selectedPrompt)?.title}
                    </span>
                  </li>
                )}
                <li>• Members can comment on this version</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSharing}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedCircle || !selectedPiece || isSharing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? 'Sharing...' : 'Share to Circle'}
          </button>
        </div>
      </div>
    </div>
  );
}
