"use client";

import { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import Dropdown, { DropdownItem } from "@/components/shared/Dropdown";

interface FontOption {
  name: string;
  // CSS font-family applied via the FontFamily mark. null = default (Playfair),
  // which we represent by clearing the mark so it falls back to the editor CSS.
  value: string | null;
}

const FONT_OPTIONS: FontOption[] = [
  { name: "Playfair", value: null },
  { name: "Roboto Slab", value: "var(--font-roboto-slab), serif" },
  { name: "Montserrat", value: "var(--font-montserrat), sans-serif" },
  { name: "Inter", value: "var(--font-inter), sans-serif" },
  { name: "Source Code Pro", value: "var(--font-source-code-pro), monospace" },
];

interface FontControlProps {
  editor: Editor;
  // Desktop toolbar is pinned to the bottom of the screen, so its menu opens
  // upward; the mobile inline toolbar sits up top and opens downward.
  openUp?: boolean;
}

export default function FontControl({
  editor,
  openUp = false,
}: FontControlProps) {
  // The toolbar doesn't re-render on its own when the cursor moves, so subscribe
  // to editor updates to keep the active font live (same pattern as LinkPopover).
  // "transaction" fires on every state change — cursor moves, edits, and applying
  // a font to a collapsed cursor (a stored-mark change) — so it covers everything.
  const [, setTick] = useState(0);
  useEffect(() => {
    const rerender = () => setTick((t) => t + 1);
    editor.on("transaction", rerender);
    return () => {
      editor.off("transaction", rerender);
    };
  }, [editor]);

  const current = editor.getAttributes("textStyle").fontFamily as
    | string
    | undefined;
  // Compare the primary family (the part before the fallback) by exact match, so
  // the active font stays correct if the stored string is reserialized on reload,
  // and so similar tokens (e.g. --font-source-code vs --font-source-code-pro)
  // can't false-match the way a substring check would.
  const primaryFamily = (value: string) => value.split(",")[0].trim();
  const currentPrimary = current ? primaryFamily(current) : undefined;
  const active =
    FONT_OPTIONS.find(
      (f) => f.value && primaryFamily(f.value) === currentPrimary
    ) ?? FONT_OPTIONS[0];

  // Apply to the highlighted text. With no selection, this sets a stored mark
  // so only the next characters typed use the font (like Bold) — never the whole doc.
  const applyFont = (value: string | null) => {
    const chain = editor.chain().focus();
    (value ? chain.setFontFamily(value) : chain.unsetFontFamily()).run();
  };

  const items: DropdownItem[] = FONT_OPTIONS.map((f) => ({
    type: "action",
    label: f.name,
    active: f.name === active.name,
    labelFontFamily: f.value ?? "var(--font-playfair), serif",
    onClick: () => applyFont(f.value),
  }));

  const trigger = (
    <button
      type="button"
      title="Font"
      aria-label="Font"
      onMouseDown={(e) => e.preventDefault()}
      style={{
        height: "32px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "0 8px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        flexShrink: 0,
        maxWidth: "132px",
        fontFamily: active.value ?? "var(--font-playfair), serif",
        fontSize: "14px",
        color: "#000000",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {active.name}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/arrow_down.svg" alt="" width={12} height={12} />
    </button>
  );

  return (
    <Dropdown
      trigger={trigger}
      items={items}
      align="left"
      openUp={openUp}
      minWidth={180}
      size="sm"
    />
  );
}
