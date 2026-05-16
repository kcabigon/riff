"use client";

import { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";

interface LinkPopoverProps {
  editor: Editor;
}

export default function LinkPopover({ editor }: LinkPopoverProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [visible, setVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Force re-render when editor selection changes
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  const isActive = editor.isActive("link");
  const currentUrl = editor.getAttributes("link").href || "";

  // Show popover when cursor enters a link, hide when it leaves
  useEffect(() => {
    if (!isActive) {
      setVisible(false);
      setIsEditing(false);
      setPosition(null);
      return;
    }

    // Cursor just entered a link — show popover
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    const editorRect = editor.view.dom.getBoundingClientRect();

    // Clamp left so the popover never overflows the editor on narrow screens
    const POPOVER_MAX_WIDTH = 360;
    const MARGIN = 8;
    const rawLeft = coords.left - editorRect.left;
    const clampedLeft = Math.max(
      MARGIN,
      Math.min(rawLeft, editorRect.width - POPOVER_MAX_WIDTH - MARGIN)
    );

    setPosition({
      top: coords.bottom - editorRect.top + 8,
      left: clampedLeft,
    });
    setVisible(true);
  }, [isActive, editor.state.selection, editor]);

  // Click anywhere outside the popover → dismiss
  useEffect(() => {
    if (!visible) return;

    const handleClick = (e: PointerEvent) => {
      if (popoverRef.current && popoverRef.current.contains(e.target as Node))
        return;
      setVisible(false);
      setIsEditing(false);
    };

    // Delay so the click that triggered the popover doesn't immediately dismiss it
    const timer = setTimeout(() => {
      document.addEventListener("pointerdown", handleClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", handleClick);
    };
  }, [visible]);

  useEffect(() => {
    if (isEditing) {
      setEditUrl(currentUrl);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing, currentUrl]);

  if (!visible || !position) return null;

  const handleSave = () => {
    if (editUrl.trim()) {
      let finalUrl = editUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: finalUrl })
        .run();
    }
    setIsEditing(false);
    setVisible(false);
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsEditing(false);
    setVisible(false);
  };

  const buttonStyle = {
    background: "none",
    border: "none",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "13px",
    fontWeight: 500 as const,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  };

  return (
    <div
      ref={popoverRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 50,
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "4px 4px 0px #000000",
        padding: "10px 14px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "14px",
        maxWidth: "min(360px, calc(100% - 16px))",
      }}
    >
      {isEditing ? (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            ref={inputRef}
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setIsEditing(false);
                setVisible(false);
                editor.commands.focus();
              }
            }}
            style={{
              flex: 1,
              border: "1px solid #ccc",
              padding: "6px 8px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              fontWeight: 300,
              outline: "none",
              minWidth: "200px",
            }}
          />
          <button
            onClick={handleSave}
            style={{ ...buttonStyle, color: "#00AA44" }}
          >
            Save
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#0066CC",
              fontSize: "13px",
              fontWeight: 300,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "200px",
            }}
          >
            {currentUrl}
          </a>
          <button
            onClick={() => setIsEditing(true)}
            style={{ ...buttonStyle, color: "#000000" }}
          >
            Edit
          </button>
          <button
            onClick={handleRemove}
            style={{ ...buttonStyle, color: "#CC0000" }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
