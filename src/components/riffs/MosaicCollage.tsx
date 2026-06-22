"use client";

// Placeholder color palette for pieces without a cover image. Intentional
// pastel rotation, shared across multiple placeholder surfaces.
/* eslint-disable riff/no-non-palette-colors */
const PLACEHOLDER_COLORS = [
  "#E8E0D5",
  "#D5E0E8",
  "#E0E8D5",
  "#E8D5E0",
  "#D5E8E0",
  "#E0D5E8",
];
/* eslint-enable riff/no-non-palette-colors */

interface MosaicPiece {
  id: string;
  coverImage?: string | null;
}

interface MosaicCollageProps {
  pieces: MosaicPiece[];
  width: number;
  height: number;
}

export default function MosaicCollage({
  pieces,
  width,
  height,
}: MosaicCollageProps) {
  if (pieces.length === 0) {
    return (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: "#E6E6E6",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {pieces.map((piece, index) => {
        const imageUrl = piece.coverImage;
        const isPlaceholder = !imageUrl;
        const bgColor = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

        return (
          <div
            key={piece.id}
            style={{
              flex: "1 0 0",
              height: "100%",
              position: "relative",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            {isPlaceholder ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: bgColor,
                }}
              />
            ) : (
              <img
                src={imageUrl}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
