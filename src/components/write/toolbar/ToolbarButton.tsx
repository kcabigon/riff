import React from "react";

interface ToolbarButtonProps {
  isActive?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ToolbarButton({
  isActive,
  onClick,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: isActive ? "none" : "1px solid transparent",
        background: isActive ? "#000000" : "transparent",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.border = "2px solid #000000";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.border = "1px solid transparent";
      }}
      title={title}
    >
      {children}
    </button>
  );
}

export function TextLabel({
  text,
  bold,
  italic,
  underline,
  strikethrough,
  color = "#000",
}: {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-playfair), serif",
        fontSize: "14px",
        fontWeight: bold ? "bold" : "normal",
        fontStyle: italic ? "italic" : "normal",
        textDecoration: underline
          ? "underline"
          : strikethrough
            ? "line-through"
            : "none",
        color,
      }}
    >
      {text}
    </span>
  );
}
