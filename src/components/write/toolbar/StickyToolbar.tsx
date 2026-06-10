"use client";

import { Editor } from "@tiptap/react";
import ToolbarButton from "./ToolbarButton";
import { allButtons } from "./toolbarButtons";
import FontControl from "./FontControl";

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
    <div
      className={inline ? "write-inline-toolbar" : "write-sticky-toolbar"}
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      {/* Font picker — kept outside the scrolling row so its menu isn't clipped */}
      <FontControl editor={editor} openUp={!inline} />
      <div
        style={{
          width: "1px",
          height: "20px",
          background: "#E6E6E6",
          flexShrink: 0,
        }}
      />
      <div
        className="write-sticky-toolbar-inner"
        style={{ flex: 1, minWidth: 0 }}
      >
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
