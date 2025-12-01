'use client';

interface Circle {
  id: string;
  name: string;
}

interface Version {
  id: string;
  versionNumber: number;
  title: string;
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

interface VersionTimelineProps {
  versions: Version[];
  currentVersionId?: string;
  onVersionSelect?: (versionId: string) => void;
}

export default function VersionTimeline({
  versions,
  currentVersionId,
  onVersionSelect,
}: VersionTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No versions yet. Share this piece to a circle to create a version.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {versions.map((version, index) => {
        const isLatest = index === 0;
        const isCurrent = version.id === currentVersionId;

        return (
          <div
            key={version.id}
            className={`border rounded-lg p-4 ${
              isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            } ${onVersionSelect ? 'cursor-pointer hover:border-blue-300' : ''}`}
            onClick={() => onVersionSelect?.(version.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  Version {version.versionNumber}
                </span>
                {isLatest && (
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                    Latest
                  </span>
                )}
                {isCurrent && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    Viewing
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(version.createdAt)}
              </span>
            </div>

            {version.title && (
              <h3 className="font-medium text-gray-900 mb-1">{version.title}</h3>
            )}

            {version.excerpt && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {version.excerpt}
              </p>
            )}

            {/* Show which circles this version is shared to */}
            {version.shares.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {version.shares.map((share) => (
                  <div
                    key={share.circle.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                  >
                    <span>{share.circle.name}</span>
                    {share.prompt && (
                      <span className="text-blue-600">
                        • {share.prompt.title}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Comment count */}
            {version._count && version._count.comments > 0 && (
              <div className="text-sm text-gray-500">
                {version._count.comments} comment
                {version._count.comments !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
