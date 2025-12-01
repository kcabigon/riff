'use client';

interface Circle {
  id: string;
  name: string;
}

interface PieceStatusProps {
  isShared: boolean;
  sharedCircles?: Circle[];
}

export default function PieceStatus({ isShared, sharedCircles = [] }: PieceStatusProps) {
  if (!isShared || sharedCircles.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        <span>Draft</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
      <div className="w-2 h-2 bg-blue-500 rounded-full" />
      <span>
        Shared to {sharedCircles.length} circle{sharedCircles.length !== 1 ? 's' : ''}
      </span>
      {sharedCircles.length > 0 && (
        <span className="text-blue-600">
          ({sharedCircles.map(c => c.name).join(', ')})
        </span>
      )}
    </div>
  );
}
