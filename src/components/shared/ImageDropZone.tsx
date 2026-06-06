"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageDropZoneProps {
  onFileSelected: (file: File) => void;
  currentImage?: string | null;
  onRemove?: () => void;
  uploadText?: string;
  subtitleText?: string;
  height?: string;
  disabled?: boolean;
  isUploading?: boolean;
  accept?: string;
}

export default function ImageDropZone({
  onFileSelected,
  currentImage,
  onRemove,
  uploadText = "Drop an image here or click to upload",
  subtitleText = "JPEG, PNG, WebP, GIF, or HEIC (max 10MB)",
  height = "200px",
  disabled = false,
  isUploading = false,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif",
}: ImageDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        style={{ display: "none" }}
      />
      <div
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          width: "100%",
          height,
          border: `2px dashed ${dragOver ? "#000000" : "#CCCCCC"}`,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          cursor: disabled || isUploading ? "not-allowed" : "pointer",
          background: dragOver ? "#F5F5F5" : "#FFFFFF",
          opacity: disabled || isUploading ? 0.5 : 1,
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {currentImage ? (
          <>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src={currentImage}
                alt="Preview"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                disabled={disabled || isUploading}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: disabled || isUploading ? "not-allowed" : "pointer",
                  zIndex: 2,
                }}
              >
                <Image
                  src="/icons/trash.svg"
                  alt="Remove image"
                  width={24}
                  height={24}
                />
              </button>
            )}
          </>
        ) : isUploading ? (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              color: "#808080",
              margin: 0,
            }}
          >
            Uploading...
          </p>
        ) : (
          <>
            <Image src="/icons/camera_icon.svg" alt="" width={56} height={42} />
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                color: "#808080",
                margin: 0,
                textAlign: "center",
              }}
            >
              {uploadText}
            </p>
            {subtitleText && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  color: "#9C9C9C",
                  margin: 0,
                }}
              >
                {subtitleText}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
