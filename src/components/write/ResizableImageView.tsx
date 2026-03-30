"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useRef, useState, useCallback } from "react";

export default function ResizableImageView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const align = (node.attrs.textAlign as string) || "center";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = imgRef.current?.offsetWidth ?? 300;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(100, startWidth + diff);
        updateAttributes({ width: `${newWidth}px` });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [updateAttributes]
  );

  // Touch resize for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.touches[0].clientX;
      const startWidth = imgRef.current?.offsetWidth ?? 300;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        const diff = moveEvent.touches[0].clientX - startX;
        const newWidth = Math.max(100, startWidth + diff);
        updateAttributes({ width: `${newWidth}px` });
      };

      const handleTouchEnd = () => {
        setIsResizing(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper
      style={{
        display: "flex",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
        margin: "1em 0",
      }}
    >
      <div
        style={{
          display: "inline-block",
          position: "relative",
          maxWidth: "100%",
        }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          title={node.attrs.title || undefined}
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
            width: node.attrs.width || undefined,
            outline: selected ? "2px solid #00FF66" : "none",
            cursor: "pointer",
          }}
          draggable={false}
        />

        {/* Resize handle — bottom right corner */}
        {selected && (
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              position: "absolute",
              bottom: "-8px",
              right: "-8px",
              width: "20px",
              height: "20px",
              cursor: "nwse-resize",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/resize.svg"
              alt="Resize"
              width={16}
              height={16}
              draggable={false}
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
