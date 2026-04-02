"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { getSharedExtensions } from "@/components/editor/extensions/sharedExtensions";
import "@/app/write/[pieceId]/editor.css";
import Image from "next/image";

interface PublicReadLayoutProps {
  piece: {
    id: string;
    title: string;
    subtitle: string | null;
    currentContent: string;
    coverImage: string | null;
    wordCount: number;
    readLengthMin: number;
    author: {
      id: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
  };
}

function ReadOnlyContent({ content }: { content: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: getSharedExtensions(),
    content,
    editable: false,
  });

  if (!editor) return null;

  return (
    <div className="write-editor">
      <EditorContent editor={editor} style={{ cursor: "default" }} />
    </div>
  );
}

export default function PublicReadLayout({ piece }: PublicReadLayoutProps) {
  const authorName = piece.author.name || piece.author.username || "Anonymous";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Minimal header */}
      <div
        style={{
          borderBottom: "1px solid #E5E5E5",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src="/images/landing/riff_logo_dark.svg"
          alt="Riff"
          width={44}
          height={28}
          onError={(e) => {
            // Fallback if dark logo doesn't exist
            (e.target as HTMLImageElement).src =
              "/images/landing/riff_logo.svg";
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "48px 24px 96px",
        }}
      >
        {/* Cover image */}
        {piece.coverImage && (
          <div
            style={{
              width: "100%",
              marginBottom: "40px",
              border: "2px solid #000000",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={piece.coverImage}
              alt="Cover"
              style={{ width: "100%", display: "block" }}
            />
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 12px 0",
            lineHeight: 1.2,
          }}
        >
          {piece.title || "Untitled"}
        </h1>

        {/* Subtitle */}
        {piece.subtitle && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "18px",
              fontWeight: 300,
              color: "#555555",
              margin: "0 0 24px 0",
              lineHeight: 1.5,
            }}
          >
            {piece.subtitle}
          </p>
        )}

        {/* Author + metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
            paddingBottom: "24px",
            borderBottom: "1px solid #E5E5E5",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 400,
                color: "#000000",
                margin: "0 0 2px 0",
              }}
            >
              {authorName}
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
              }}
            >
              {piece.wordCount > 0
                ? `${piece.wordCount.toLocaleString()} words · ${piece.readLengthMin} min read`
                : `${piece.readLengthMin} min read`}
            </p>
          </div>
        </div>

        {/* Body */}
        <ReadOnlyContent content={piece.currentContent} />
      </div>
    </div>
  );
}
