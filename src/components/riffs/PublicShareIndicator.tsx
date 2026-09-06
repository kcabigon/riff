"use client";

import { useState } from "react";

function CopyIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="9" y="9" width="12" height="12" rx="1" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function OpenLinkIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

// Same hover treatment as ThreeDotButton's "dark" variant — cyan fill,
// black border + shadow on hover, so the two share one interaction language.
function IconButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  ariaLabel: string;
  children: (color: string) => React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isHovered ? "#01EFFC" : "transparent",
        border: isHovered ? "2px solid #000000" : "2px solid transparent",
        boxShadow: isHovered ? "4px 4px 0px 0px #000000" : "none",
        opacity: isHovered ? 1 : 0.7,
        padding: "4px 6px",
        cursor: "pointer",
        transition:
          "opacity 0.15s ease, background-color 0.15s ease, box-shadow 0.1s ease",
      }}
    >
      {children(isHovered ? "#000000" : "#FFFFFF")}
    </button>
  );
}

export default function PublicShareIndicator({
  pieceId,
  interactive,
}: {
  pieceId: string;
  interactive: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/p/${pieceId}`
        : `/p/${pieceId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/p/${pieceId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "8px",
        left: "8px",
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "11px",
          fontWeight: 700,
          color: "#FFFFFF",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          marginRight: "4px",
        }}
      >
        Public
      </span>
      {interactive && (
        <>
          <IconButton
            onClick={handleCopy}
            ariaLabel={copied ? "Link copied" : "Copy public link"}
          >
            {(color) =>
              copied ? <CheckIcon color={color} /> : <CopyIcon color={color} />
            }
          </IconButton>
          <IconButton
            onClick={handleOpen}
            ariaLabel="Open public page in new tab"
          >
            {(color) => <OpenLinkIcon color={color} />}
          </IconButton>
        </>
      )}
    </div>
  );
}
