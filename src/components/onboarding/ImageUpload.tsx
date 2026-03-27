"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (imageUrl: string) => void;
  currentImage?: string | null;
  disabled?: boolean;
  uploadIcon?: React.ReactNode;
  uploadText?: string;
  hideRecommendedText?: boolean;
}

export default function ImageUpload({
  onUpload,
  currentImage,
  disabled = false,
  uploadIcon,
  uploadText = "Click or drag to upload",
  hideRecommendedText = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [throwing, setThrowing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onUpload(data.url);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = () => {
    setPreview(null);
    setError(null);
    onUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || uploading || throwing) return;
    setThrowing(true);
    setTimeout(() => {
      handleDelete();
      setThrowing(false);
    }, 1800);
  };

  return (
    <>
      <style>{`
        @keyframes throwPaper {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          20%  { transform: translate(30px, -200px) rotate(100deg) scale(1); opacity: 1; }
          45%  { transform: translate(90px, -245px) rotate(230deg) scale(1); opacity: 1; }
          70%  { transform: translate(160px, -178px) rotate(355deg) scale(1); opacity: 1; }
          88%  { transform: translate(195px, -148px) rotate(415deg) scale(1); opacity: 1; }
          95%  { transform: translate(204px, -140px) rotate(432deg) scale(0.5); opacity: 1; }
          100% { transform: translate(208px, -136px) rotate(440deg) scale(0); opacity: 0; }
        }
        @keyframes shakeTrash {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20%      { transform: rotate(-14deg) scale(1.15); }
          45%      { transform: rotate(11deg) scale(1.08); }
          65%      { transform: rotate(-7deg) scale(1.03); }
          80%      { transform: rotate(4deg) scale(1.01); }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Upload area */}
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            width: "100%",
            height: "320px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "24px",
            backgroundColor: isDragging ? "#F0FFF4" : "#FFFFFF",
            border: `2px dashed ${isDragging ? "#00FF66" : "#000000"}`,
            cursor: disabled || uploading ? "not-allowed" : "pointer",
            opacity: disabled || uploading ? 0.5 : 1,
            boxSizing: "border-box",
            position: "relative",
            overflow: "visible",
          }}
        >
          {preview ? (
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
                  src={preview}
                  alt="Banner preview"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>

              {/* Flying paper ball */}
              {throwing && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(50% - 16px)",
                    left: "calc(50% - 16px)",
                    width: "32px",
                    height: "32px",
                    zIndex: 3,
                    pointerEvents: "none",
                    animation:
                      "throwPaper 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Drop shadow */}
                    <ellipse
                      cx="18"
                      cy="34"
                      rx="10"
                      ry="2"
                      fill="#BBBBBB"
                      opacity="0.6"
                    />
                    {/* Facets — light from upper-left */}
                    {/* Upper-left highlight */}
                    <polygon points="18,18 11,4 16,2" fill="#F4F4F4" />
                    {/* Top */}
                    <polygon points="18,18 16,2 24,3" fill="#EBEBEB" />
                    {/* Top-right */}
                    <polygon points="18,18 24,3 31,10" fill="#D0D0D0" />
                    {/* Right — deep shadow */}
                    <polygon points="18,18 31,10 30,21" fill="#A0A0A0" />
                    {/* Lower-right shadow */}
                    <polygon points="18,18 30,21 23,31" fill="#B8B8B8" />
                    {/* Bottom */}
                    <polygon points="18,18 23,31 13,32" fill="#CCCCCC" />
                    {/* Bottom-left */}
                    <polygon points="18,18 13,32 5,23" fill="#DEDEDE" />
                    {/* Left */}
                    <polygon points="18,18 5,23 6,12" fill="#D4D4D4" />
                    {/* Upper-left */}
                    <polygon points="18,18 6,12 11,4" fill="#EFEFEF" />
                    {/* Outer silhouette */}
                    <polygon
                      points="16,2 24,3 31,10 30,21 23,31 13,32 5,23 6,12 11,4"
                      fill="none"
                      stroke="#888888"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    {/* Crease lines radiating from center */}
                    <line
                      x1="18"
                      y1="18"
                      x2="16"
                      y2="2"
                      stroke="#AAAAAA"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="18"
                      y1="18"
                      x2="24"
                      y2="3"
                      stroke="#AAAAAA"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="18"
                      y1="18"
                      x2="31"
                      y2="10"
                      stroke="#888888"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="18"
                      y1="18"
                      x2="30"
                      y2="21"
                      stroke="#888888"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="18"
                      y1="18"
                      x2="23"
                      y2="31"
                      stroke="#AAAAAA"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="18"
                      y1="18"
                      x2="13"
                      y2="32"
                      stroke="#AAAAAA"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="18"
                      y1="18"
                      x2="5"
                      y2="23"
                      stroke="#BBBBBB"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="18"
                      y1="18"
                      x2="6"
                      y2="12"
                      stroke="#BBBBBB"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="18"
                      y1="18"
                      x2="11"
                      y2="4"
                      stroke="#CCCCCC"
                      strokeWidth="0.8"
                    />
                  </svg>
                </div>
              )}

              {/* Trash icon button */}
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={disabled || uploading}
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
                  cursor: disabled || uploading ? "not-allowed" : "pointer",
                  opacity: disabled || uploading ? 0.5 : 1,
                  zIndex: 2,
                  animation: throwing
                    ? "shakeTrash 0.35s ease 1.3s"
                    : undefined,
                }}
              >
                <Image
                  src="/icons/trash.svg"
                  alt="Delete image"
                  width={28}
                  height={30}
                />
              </button>
            </>
          ) : (
            // Show upload prompt
            <>
              {uploadIcon || (
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {uploading ? "Uploading..." : uploadText}
              </p>
              {!hideRecommendedText && (
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#959595",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  Recommended: 1200x400px • JPG, PNG, or WebP • Max 5MB
                </p>
              )}
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          disabled={disabled || uploading}
          style={{ display: "none" }}
        />

        {/* Error message */}
        {error && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#FF0000",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </>
  );
}
