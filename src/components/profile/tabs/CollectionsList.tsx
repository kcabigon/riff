"use client";

import { useState } from "react";

interface CollectionPiece {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  riffs: Array<{ id: string; title: string }>;
}

interface Collection {
  id: string;
  name: string;
  pieces: CollectionPiece[];
}

interface CollectionsListProps {
  collections: Collection[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CollectionsList({
  collections,
}: CollectionsListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleCollection = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (collections.length === 0) {
    return (
      <div
        style={{
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          No collections yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0", width: "100%" }}>
      {collections.map((collection, colIndex) => {
        const isExpanded = expandedIds.has(collection.id);

        return (
          <div key={collection.id}>
            {/* Collection row */}
            <button
              onClick={() => toggleCollection(collection.id)}
              style={{
                width: "100%",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingLeft: "24px",
                paddingRight: "24px",
                backgroundColor: "#FFFFFF",
                border: "none",
                borderBottom:
                  colIndex < collections.length - 1 || isExpanded
                    ? "1px solid #959595"
                    : "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "20px",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "#000000",
                }}
              >
                {collection.name}
              </span>

              {/* Chevron icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  transition: "transform 0.2s ease",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                <path
                  d="M9 6L15 12L9 18"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Expanded piece sub-rows */}
            {isExpanded &&
              collection.pieces.map((piece, pieceIndex) => {
                const hasTitle = piece.title && piece.title.trim().length > 0;
                const dateLabel = hasTitle
                  ? formatDate(piece.createdAt)
                  : `Last updated: ${formatDate(piece.updatedAt)}`;

                return (
                  <a
                    key={piece.id}
                    href={`/pieces/${piece.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                    }}
                  >
                    <div
                      style={{
                        height: "103px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        paddingLeft: "48px",
                        paddingRight: "24px",
                        paddingTop: "12px",
                        backgroundColor: "#FAFAFA",
                        borderBottom:
                          pieceIndex < collection.pieces.length - 1 ||
                          colIndex < collections.length - 1
                            ? "1px solid #959595"
                            : "none",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Title */}
                      <p
                        style={{
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: "20px",
                          fontWeight: 400,
                          color: "#000000",
                          margin: "0 0 4px 0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {piece.title || "Untitled"}
                      </p>

                      {/* Date */}
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "12px",
                          fontWeight: 300,
                          color: "#808080",
                          margin: "0 0 8px 0",
                        }}
                      >
                        {dateLabel}
                      </p>

                      {/* Status row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          {piece.isShared ? (
                            <path
                              d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5c-.28 0-1.48-.9-2.15-3.5H12.15c-.67 2.6-1.87 3.5-2.15 3.5zM7.6 11.5c-.03-.47-.1-1-.1-1.5s.07-1.03.1-1.5h4.8c.03.47.1 1 .1 1.5s-.07 1.03-.1 1.5H7.6zm.55-5.5c.67-2.6 1.87-3.5 2.15-3.5s1.48.9 2.15 3.5H8.15zM5.5 6c.6-.84 1.52-1.47 2.58-1.78-.58.93-1 2.2-1.1 3.28H5.5V6zm0 5.5h1.48c-.03.47-.08.96-.08 1.5s.05 1.03.08 1.5H5.5c0-1 0-2 0-3zm8.52-5.5V6c-1.06.31-1.98.94-2.58 1.78-.1-1.08-.52-2.35-1.1-3.28 1.06.31 1.98.94 2.58 1.78h1.1zm0 5.5h-1.48c.03.47.08.96.08 1.5s-.05 1.03-.08 1.5h1.48c0-1 0-2 0-3z"
                              fill="#808080"
                            />
                          ) : (
                            <path
                              d="M15 8h-1V6c0-2.21-1.79-4-4-4S6 3.79 6 6v2H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-6 0V6c0-1.1.9-2 2-2s2 .9 2 2v2H9z"
                              fill="#808080"
                            />
                          )}
                        </svg>
                        <span
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "12px",
                            fontWeight: 300,
                            color: "#808080",
                          }}
                        >
                          {piece.isShared ? "Shared" : "Draft"}
                        </span>
                        {piece.riffs.map((riff) => (
                          <span
                            key={riff.id}
                            style={{
                              fontFamily: "var(--font-dm-serif-text)",
                              fontSize: "12px",
                              fontWeight: 400,
                              color: "#000000",
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #00FF66",
                              borderRadius: "2px",
                              padding: "4px 12px",
                            }}
                          >
                            {riff.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </a>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
