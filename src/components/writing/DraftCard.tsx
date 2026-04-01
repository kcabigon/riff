"use client";

import { useState } from "react";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";

interface DraftCardProps {
  draft: {
    id: string;
    title: string;
    updatedAt: string;
    wordCount: number;
    riffs: Array<{
      riffId: string;
      riff: {
        id: string;
        title: string | null;
        volume: number;
        club: { id: string; name: string };
      };
    }>;
    isPublished: boolean;
  };
  onEdit: () => void;
  onAttach: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DraftCard({
  draft,
  onEdit,
  onAttach,
  onPublishToggle,
  onDelete,
}: DraftCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems: DropdownItem[] = [
    { type: "action", label: "Edit", onClick: onEdit },
    { type: "action", label: "Attach to Riff", onClick: onAttach },
    {
      type: "action",
      label: draft.isPublished ? "Unpublish" : "Publish",
      onClick: onPublishToggle,
    },
    { type: "divider" },
    {
      type: "action",
      label: "Delete",
      color: "#DC2626",
      onClick: onDelete,
    },
  ];

  const subtitle = [
    formatDate(draft.updatedAt),
    draft.wordCount > 0 ? `${draft.wordCount.toLocaleString()} words` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: "2px solid #000000",
        padding: "20px 24px",
        backgroundColor: "#FFFFFF",
        boxShadow: isHovered ? "4px 4px 0px 0px #000000" : "none",
        transition: "box-shadow 0.1s ease",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Top row: title + kebab */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "20px",
            fontWeight: 400,
            color: "#000000",
            margin: 0,
            lineHeight: 1.3,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {draft.title || "Untitled"}
        </h3>
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <div
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "20px",
                  fontWeight: 300,
                  color: "#808080",
                  lineHeight: 1,
                  padding: "0 4px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                ⋮
              </div>
            }
            items={menuItems}
            align="right"
          />
        </div>
      </div>

      {/* Subtitle: date · word count */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "13px",
          fontWeight: 300,
          color: "#808080",
          margin: 0,
        }}
      >
        {subtitle}
        {draft.isPublished && (
          <span
            style={{
              marginLeft: "8px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#000000",
              backgroundColor: "#EECF01",
              border: "1px solid #000000",
              padding: "1px 6px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Published
          </span>
        )}
      </p>

      {/* Riff pills */}
      {draft.riffs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {draft.riffs.map((r) => (
            <span
              key={r.riffId}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "11px",
                fontWeight: 700,
                color: "#000000",
                backgroundColor: "#00FF66",
                border: "1px solid #000000",
                padding: "2px 8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              {r.riff.title || `Vol. ${r.riff.volume}`} · {r.riff.club.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
