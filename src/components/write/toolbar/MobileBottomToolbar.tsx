"use client";

import { Editor } from "@tiptap/react";
import ToolbarButton from "./ToolbarButton";
import { formattingButtons, insertButtons } from "./toolbarButtons";

interface MobileBottomToolbarProps {
  editor: Editor;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function MobileBottomToolbar({
  editor,
  fileInputRef,
}: MobileBottomToolbarProps) {
  const allButtons = [...formattingButtons, ...insertButtons];

  return (
    <div className="write-mobile-toolbar">
      <div className="write-mobile-toolbar-inner">
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
