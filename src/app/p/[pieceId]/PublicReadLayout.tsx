"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { getSharedExtensions } from "@/components/editor/extensions/sharedExtensions";
import "@/app/write/[pieceId]/editor.css";
import Image from "next/image";
import Link from "next/link";

function formatSubmittedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PublicReadLayoutProps {
  piece: {
    id: string;
    title: string;
    subtitle: string | null;
    currentContent: string;
    wordCount: number;
    readLengthMin: number;
    submittedAt: string | null;
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
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Minimal header */}
      <div
        style={{
          borderBottom: "1px solid #E6E6E6",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link href="/" style={{ display: "flex" }}>
          <Image
            src="/images/riff_logo_black_shadow.svg"
            alt="Riff"
            width={44}
            height={28}
          />
        </Link>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "48px 24px 96px",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "clamp(32px, 5vw, 40px)",
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
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
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
            borderBottom: "1px solid #E6E6E6",
          }}
        >
          {piece.author.avatarUrl ? (
            <Image
              src={piece.author.avatarUrl}
              alt={authorName}
              width={32}
              height={32}
              style={{ borderRadius: "64px", border: "2px solid #000000" }}
            />
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "64px",
                border: "2px solid #000000",
                backgroundColor: "#E6E6E6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "12px",
                fontWeight: 400,
                color: "#000000",
                flexShrink: 0,
              }}
            >
              {authorName[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
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
              {piece.readLengthMin} min read
              {piece.wordCount > 0 &&
                ` · ${piece.wordCount.toLocaleString()} words`}
              {piece.submittedAt &&
                ` · ${formatSubmittedDate(piece.submittedAt)}`}
            </p>
          </div>
        </div>

        {/* Body */}
        <ReadOnlyContent content={piece.currentContent} />
      </div>
    </div>
  );
}
