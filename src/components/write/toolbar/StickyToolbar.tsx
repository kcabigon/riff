"use client";

import { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";
import ToolbarButton from "./ToolbarButton";
import { allButtons } from "./toolbarButtons";

interface StickyToolbarProps {
  editor: Editor;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function StickyToolbar({
  editor,
  fileInputRef,
}: StickyToolbarProps) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // Difference between layout viewport and visual viewport = keyboard height
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 0 ? offset : 0);
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  return (
    <div
      className="write-sticky-toolbar"
      style={keyboardOffset > 0 ? { bottom: `${keyboardOffset}px` } : undefined}
    >
      <div className="write-sticky-toolbar-inner">
        {allButtons.map((btn) => (
          <ToolbarButton
            key={btn.key}
            isActive={btn.isActive(editor)}
            onClick={() => btn.action(editor, fileInputRef)}
            title={btn.title}
          >
            {btn.icon(btn.isActive(editor))}
          </ToolbarButton>
        ))}
      </div>
    </div>
  );
}
