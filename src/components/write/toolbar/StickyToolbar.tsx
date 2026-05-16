"use client";

import { Editor } from "@tiptap/react";
import ToolbarButton from "./ToolbarButton";
import { allButtons } from "./toolbarButtons";

interface StickyToolbarProps {
  editor: Editor;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  inline?: boolean;
  onOpenLinkModal?: () => void;
  onOpenYoutubeModal?: () => void;
  onOpenSpotifyModal?: () => void;
}

export default function StickyToolbar({
  editor,
  fileInputRef,
  inline = false,
  onOpenLinkModal,
  onOpenYoutubeModal,
  onOpenSpotifyModal,
}: StickyToolbarProps) {
  return (
    <div className={inline ? "write-inline-toolbar" : "write-sticky-toolbar"}>
      <div className="write-sticky-toolbar-inner">
        {allButtons.map((btn) => (
          <ToolbarButton
            key={btn.key}
            isActive={btn.isActive(editor)}
            onClick={() =>
              btn.action(editor, fileInputRef, {
                onOpenLinkModal,
                onOpenYoutubeModal,
                onOpenSpotifyModal,
              })
            }
            title={btn.title}
          >
            {btn.icon(btn.isActive(editor))}
          </ToolbarButton>
        ))}
      </div>
    </div>
  );
}
