"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, OpenLinkIcon } from "@/components/shared/icons";
import IconButton from "@/components/shared/IconButton";

// Author-only, same as ThreeDotButton — gate rendering at the call site.
export default function PublicShareIndicator({ pieceId }: { pieceId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/p/${pieceId}`
        : `/p/${pieceId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied or unavailable — nothing to recover from.
    }
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
      <IconButton
        variant="dark"
        onClick={handleCopy}
        ariaLabel={copied ? "Link copied" : "Copy public link"}
      >
        {(color) =>
          copied ? <CheckIcon color={color} /> : <CopyIcon color={color} />
        }
      </IconButton>
      <IconButton
        variant="dark"
        onClick={handleOpen}
        ariaLabel="Open public page in new tab"
      >
        {(color) => <OpenLinkIcon color={color} />}
      </IconButton>
    </div>
  );
}
