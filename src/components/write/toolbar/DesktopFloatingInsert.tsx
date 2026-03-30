"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { FloatingMenu } from "@tiptap/react/menus";
import ToolbarButton from "./ToolbarButton";
import { insertButtons } from "./toolbarButtons";

interface DesktopFloatingInsertProps {
  editor: Editor;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function DesktopFloatingInsert({
  editor,
  fileInputRef,
}: DesktopFloatingInsertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <FloatingMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { $from } = state.selection;
        const currentNode = $from.node();
        // Show on empty paragraphs only
        const show =
          currentNode.type.name === "paragraph" &&
          currentNode.content.size === 0;
        if (!show) setIsExpanded(false);
        return show;
      }}
    >
      <div className="write-floating-insert">
        {!isExpanded ? (
          <button
            className="write-floating-insert-trigger"
            onClick={() => setIsExpanded(true)}
            onMouseDown={(e) => e.preventDefault()}
            title="Insert media"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#ffffff" />
            </svg>
          </button>
        ) : (
          <div className="write-floating-insert-buttons">
            {insertButtons.map((btn) => (
              <ToolbarButton
                key={btn.key}
                isActive={false}
                onClick={() => {
                  btn.action(editor, fileInputRef);
                  setIsExpanded(false);
                }}
                title={btn.title}
              >
                {btn.icon(false)}
              </ToolbarButton>
            ))}
          </div>
        )}
      </div>
    </FloatingMenu>
  );
}
