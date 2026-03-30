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
        borderRadius: "6px",
        border: "0.5px solid transparent",
        background: isActive ? "#e5e7eb" : "transparent",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.border = "0.5px solid #ffffff";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.border = "0.5px solid transparent";
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
}: {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
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
        color: "#fff",
      }}
    >
      {text}
    </span>
  );
}
