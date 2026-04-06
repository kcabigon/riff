"use client";

import { useState, useRef, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";
import CloseButton from "@/components/CloseButton";
import { getCroppedImg } from "@/lib/crop-image";
import { convertHeicToJpeg, isHeicFile } from "@/lib/convert-heic";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  currentImage?: string | null;
  removeLabel?: string;
  aspectRatio?: number;
  cropShape?: "rect" | "round";
  existingImages?: string[];
  existingImagesLabel?: string;
  inlinePreview?: boolean;
  onSkip?: () => void;
}

function isGif(url: string): boolean {
  return /\.gif(\?|$)/i.test(url);
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onSelect,
  title = "Upload image",
  currentImage = null,
  removeLabel = "Remove image",
  aspectRatio = 16 / 9,
  cropShape = "rect",
  existingImages,
  existingImagesLabel = "Choose existing",
  inlinePreview = false,
  onSkip,
}: ImageUploadModalProps) {
  const showTabs = existingImages && existingImages.length > 0;
  type Tab = "upload" | "existing";

  const [tab, setTab] = useState<Tab>("upload");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels);
  }, []);

  const resetCropper = () => {
    setCropSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  };

  const uploadBlob = async (blob: Blob): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", blob, "upload.jpg");
    const res = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert("Failed to upload image: " + (data.error || "Unknown error"));
      return null;
    }
    return data.url;
  };

  const handleFileSelected = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    // GIFs skip crop to preserve animation
    if (file.type === "image/gif") {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setIsUploading(false);
      if (data.success) {
        onSelect(data.url);
        resetCropper();
      }
      return;
    }

    // Convert HEIC/HEIF to JPEG client-side so the cropper can display it
    let processedFile = file;
    if (isHeicFile(file)) {
      setIsUploading(true);
      try {
        processedFile = await convertHeicToJpeg(file);
      } catch {
        alert("Could not process HEIC file");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const url = URL.createObjectURL(processedFile);
    setCropSrc(url);
  };

  const handleSaveCrop = async () => {
    if (!cropSrc || !croppedArea) return;
    setIsUploading(true);
    try {
      const blob = await getCroppedImg(cropSrc, croppedArea);
      const url = await uploadBlob(blob);
      if (url) {
        onSelect(url);
        resetCropper();
      }
    } catch {
      alert("Failed to save image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExistingImageClick = (imageUrl: string) => {
    if (isGif(imageUrl)) {
      onSelect(imageUrl);
      return;
    }
    setCropSrc(imageUrl);
    setTab("upload");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelected(file);
    }
  };

  const skipLink = onSkip && !cropSrc && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
        }}
      >
        Cover image recommended
      </span>
      <button
        onClick={onSkip}
        style={{
          background: "none",
          border: "none",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          cursor: "pointer",
          padding: 0,
          textDecoration: "underline",
        }}
      >
        Skip anyways
      </button>
    </div>
  );

  const footer =
    cropSrc && inlinePreview ? (
      /* Centered save during crop — no cancel, user can close via modal X */
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PrimaryButton onClick={handleSaveCrop} loading={isUploading}>
          {isUploading ? "Saving..." : "Save"}
        </PrimaryButton>
      </div>
    ) : !cropSrc && inlinePreview && currentImage ? (
      /* Centered "Use Image" — image already saved, closes modal */
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PrimaryButton
            onClick={() => {
              resetCropper();
              onClose();
            }}
          >
            Use Image
          </PrimaryButton>
        </div>
        {skipLink}
      </div>
    ) : cropSrc ? (
      /* Cropper active — full-width Save, modal X handles cancel */
      <PrimaryButton onClick={handleSaveCrop} loading={isUploading}>
        {isUploading ? "Saving..." : "Save"}
      </PrimaryButton>
    ) : (
      /* Default — remove link on left, skip below */
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {currentImage && !inlinePreview && (
          <button
            onClick={() => {
              onSelect("");
              resetCropper();
            }}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              color: "#DC2626",
              cursor: "pointer",
              padding: 0,
              textAlign: "left",
            }}
          >
            {removeLabel}
          </button>
        )}
        {skipLink}
      </div>
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetCropper();
        onClose();
      }}
      title={title}
      size="md"
      footer={footer}
    >
      {/* White upload area — floats on noise background as a contained component */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "20px",
          marginTop: "16px",
          ...(inlinePreview && currentImage && !cropSrc
            ? { width: "fit-content", marginLeft: "auto", marginRight: "auto" }
            : {}),
        }}
      >
        {/* Tabs — hidden when an inline preview image is set */}
        {showTabs && !(inlinePreview && currentImage) && (
          <div
            style={{
              display: "flex",
              gap: "0",
              borderBottom: "1px solid #E5E5E5",
              marginBottom: "24px",
            }}
          >
            {(["upload", "existing"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  resetCropper();
                }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: tab === t ? 500 : 300,
                  color: tab === t ? "#000" : "#808080",
                  background: "none",
                  border: "none",
                  borderBottom:
                    tab === t ? "2px solid #000" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
              >
                {t === "upload" ? "Upload" : existingImagesLabel}
              </button>
            ))}
          </div>
        )}

        {/* Cropper view */}
        {cropSrc ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "420px",
                background: "#000",
              }}
            >
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                cropShape={cropShape}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0 4px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  color: "#808080",
                }}
              >
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        ) : inlinePreview && currentImage ? (
          /* Inline image preview — portrait 4:5, X to remove */
          <div
            style={{
              position: "relative",
              width: "240px",
              aspectRatio: "4 / 5",
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <img
              src={currentImage}
              alt="Cover preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                zIndex: 2,
              }}
            >
              <CloseButton
                onClick={() => {
                  onSelect("");
                  resetCropper();
                }}
                size={28}
              />
            </div>
          </div>
        ) : tab === "upload" ? (
          /* Upload drop zone */
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              style={{ display: "none" }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? "#000" : "#CCCCCC"}`,
                padding: "48px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                background: dragOver ? "#F5F5F5" : "#FFFFFF",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              {isUploading ? (
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    color: "#808080",
                    margin: 0,
                  }}
                >
                  Uploading...
                </p>
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                      fill="#CCCCCC"
                    />
                  </svg>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "14px",
                      color: "#808080",
                      margin: 0,
                      textAlign: "center",
                    }}
                  >
                    Drop an image here or click to upload
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      color: "#AAAAAA",
                      margin: 0,
                    }}
                  >
                    JPEG, PNG, WebP, GIF, or HEIC (max 5MB)
                  </p>
                </>
              )}
            </div>
          </>
        ) : (
          /* Existing images tab */
          <>
            {existingImages && existingImages.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  color: "#808080",
                  textAlign: "center",
                  padding: "48px 0",
                  margin: 0,
                }}
              >
                No images available
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
                {existingImages?.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => handleExistingImageClick(url)}
                    style={{
                      aspectRatio: "1",
                      border:
                        currentImage === url
                          ? "2px solid #00FF66"
                          : "1px solid #E5E5E5",
                      padding: 0,
                      background: "none",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
