"use client";

import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import ToolbarButton from "./ToolbarButton";
import { formattingButtons } from "./toolbarButtons";

interface DesktopBubbleToolbarProps {
  editor: Editor;
}

export default function DesktopBubbleToolbar({
  editor,
}: DesktopBubbleToolbarProps) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { from, to } = state.selection;
        // Only show on real text selections, not collapsed cursors or node selections
        if (from === to) return false;
        if ("node" in state.selection) return false;
        return true;
      }}
    >
      <div className="write-bubble-menu">
        {formattingButtons.map((btn) => (
          <ToolbarButton
            key={btn.key}
            isActive={btn.isActive(editor)}
            onClick={() => btn.action(editor)}
            title={btn.title}
          >
            {btn.icon(btn.isActive(editor))}
          </ToolbarButton>
        ))}
      </div>
    </BubbleMenu>
  );
}
