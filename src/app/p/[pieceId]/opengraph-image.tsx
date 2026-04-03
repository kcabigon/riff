import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ pieceId: string }>;
}) {
  const { pieceId } = await params;

  const publicShare = await prisma.share.findFirst({
    where: { pieceId, shareType: "PUBLIC", isPublic: true, isVisible: true },
    select: { id: true },
  });

  const piece = publicShare
    ? await prisma.piece.findUnique({
        where: { id: pieceId },
        select: {
          title: true,
          coverImage: true,
          author: { select: { name: true, username: true } },
        },
      })
    : null;

  const title = piece?.title || "Untitled";
  const authorName =
    piece?.author.name || piece?.author.username || "Anonymous";

  // Only use cover images that are absolute URLs (local dev images won't work in ImageResponse)
  const coverUrl = piece?.coverImage?.startsWith("http")
    ? piece.coverImage
    : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#000000",
        position: "relative",
      }}
    >
      {/* Cover image — absolute URLs only */}
      {coverUrl && (
         
        <img
          src={coverUrl}
          alt=""
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.45,
          }}
        />
      )}

      {/* Gradient overlay — darkens left side so text is legible over any cover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: coverUrl
            ? "linear-gradient(120deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 100%)"
            : "transparent",
          display: "flex",
        }}
      />

      {/* Content layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
        }}
      >
        {/* Riff wordmark — top left */}
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "36px",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
          }}
        >
          Riff
        </div>

        {/* Title + author — bottom left */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "880px",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: title.length > 50 ? "52px" : "68px",
              fontWeight: 400,
              color: "#FFFFFF",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: "28px",
              fontWeight: 300,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {authorName}
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
