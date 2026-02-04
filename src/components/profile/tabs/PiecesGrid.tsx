"use client";

interface Piece {
  id: string;
  title: string | null;
  coverImage: string | null;
  currentContent: string | null;
}

interface PiecesGridProps {
  pieces: Piece[];
}

/**
 * Extract the first <img> src from an HTML string.
 * Used as fallback when coverImage field is not set.
 */
function extractFirstImageSrc(html: string | null): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function getCoverImage(piece: Piece): string | null {
  if (piece.coverImage) return piece.coverImage;
  return extractFirstImageSrc(piece.currentContent);
}

export default function PiecesGrid({ pieces }: PiecesGridProps) {
  if (pieces.length === 0) {
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
          No pieces yet.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px 0",
        width: "100%",
      }}
    >
      <style>{`
        .pieces-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 0 24px;
        }
        @media (max-width: 1023px) {
          .pieces-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 639px) {
          .pieces-grid {
            grid-template-columns: 1fr;
            padding: 0 16px;
          }
        }
      `}</style>
      <div className="pieces-grid">
        {pieces.map((piece) => {
          const coverSrc = getCoverImage(piece);
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
                  position: "relative",
                  border: "1px solid #000000",
                  boxShadow: "8px 8px 0px #000000",
                  aspectRatio: "1 / 1.3",
                  overflow: "hidden",
                  backgroundColor: "#1a1a1a",
                }}
              >
                {/* Cover image or dark fallback */}
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt={piece.title || "Piece cover"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#1a1a1a",
                    }}
                  />
                )}

                {/* Dark overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.45)",
                  }}
                />

                {/* Title centered over overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 48px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "16px",
                      fontWeight: 400,
                      color: "#FFFFFF",
                      margin: 0,
                      textAlign: "center",
                      lineHeight: 1.4,
                    }}
                  >
                    {piece.title || "Untitled"}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
