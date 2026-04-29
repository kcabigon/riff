"use client";

import {
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  type ComponentType,
} from "react";
import dynamic from "next/dynamic";
import type { Area, CropperProps } from "react-easy-crop";

// react-easy-crop declares these as required but provides runtime defaults via
// static defaultProps. React 19 no longer merges class defaultProps into prop
// types, so we mark the defaulted props optional here.
type DefaultedCropperProp =
  | "rotation"
  | "minZoom"
  | "maxZoom"
  | "zoomSpeed"
  | "style"
  | "classes"
  | "restrictPosition"
  | "mediaProps"
  | "cropperProps"
  | "keyboardStep";

type CropperComponentProps = Omit<CropperProps, DefaultedCropperProp> &
  Partial<Pick<CropperProps, DefaultedCropperProp>>;

const Cropper = dynamic(() => import("react-easy-crop"), {
  ssr: false,
}) as ComponentType<CropperComponentProps>;
import PrimaryButton from "@/components/PrimaryButton";
import Image from "next/image";
import { getCroppedImg } from "@/lib/crop-image";
import { convertHeicToJpeg, isHeicFile } from "@/lib/convert-heic";
import ImageDropZone from "@/components/shared/ImageDropZone";

export interface ImageUploadFlowHandle {
  saveCrop: () => Promise<string | null>;
  hasPendingCrop: () => boolean;
}

interface ImageUploadFlowProps {
  onSelect: (url: string) => void;
  onClose?: () => void;
  currentImage?: string | null;
  removeLabel?: string;
  aspectRatio?: number;
  cropShape?: "rect" | "round";
  existingImages?: string[];
  existingImagesLabel?: string;
  inlinePreview?: boolean;
  onSkip?: () => void;
  cropperHeight?: string;
  hideSaveButton?: boolean;
}

function isGif(url: string): boolean {
  return /\.gif(\?|$)/i.test(url);
}

const ImageUploadFlow = forwardRef<ImageUploadFlowHandle, ImageUploadFlowProps>(
  function ImageUploadFlow(
    {
      onSelect,
      onClose,
      currentImage = null,
      removeLabel = "Remove image",
      aspectRatio = 16 / 9,
      cropShape = "rect",
      existingImages,
      existingImagesLabel = "Choose existing",
      inlinePreview = false,
      onSkip,
      cropperHeight,
      hideSaveButton = false,
    },
    ref
  ) {
    const showTabs = existingImages && existingImages.length > 0;
    type Tab = "upload" | "existing";

    const [tab, setTab] = useState<Tab>("upload");
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [cropSize, setCropSize] = useState<
      { width: number; height: number } | undefined
    >(undefined);
    const cropContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = cropContainerRef.current;
      if (!el || !cropSrc) return;
      const update = () => {
        const w = el.clientWidth;
        const h = Math.round(w / aspectRatio);
        const containerH = el.clientHeight;
        // For portrait ratios the crop box can be taller than the container.
        // Constrain by height in that case so the selection stays visible.
        if (h > containerH) {
          const constrainedW = Math.round(containerH * aspectRatio);
          setCropSize({ width: constrainedW, height: containerH });
        } else {
          setCropSize({ width: w, height: h });
        }
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }, [cropSrc, aspectRatio]);

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

    const handleSaveCrop = async (): Promise<string | null> => {
      if (!cropSrc || !croppedArea) return null;
      setIsUploading(true);
      try {
        const blob = await getCroppedImg(cropSrc, croppedArea);
        const url = await uploadBlob(blob);
        if (url) {
          onSelect(url);
          resetCropper();
          return url;
        }
        return null;
      } catch {
        alert("Failed to save image. Please try again.");
        return null;
      } finally {
        setIsUploading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      saveCrop: handleSaveCrop,
      hasPendingCrop: () => cropSrc !== null,
    }));

    const handleExistingImageClick = (imageUrl: string) => {
      if (isGif(imageUrl)) {
        onSelect(imageUrl);
        return;
      }
      setCropSrc(imageUrl);
      setTab("upload");
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

    // Cropper container height. cropperHeight overrides if provided.
    // Portrait ratios (< 1) need more vertical space than landscape.
    const computedCropperHeight =
      cropperHeight ||
      (aspectRatio >= 2 ? "240px" : aspectRatio >= 1 ? "300px" : "380px");

    return (
      <div style={{ width: "100%" }}>
        {!cropSrc && currentImage && !inlinePreview && (
          <div style={{ marginBottom: "8px" }}>
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
          </div>
        )}

        {/* Upload area */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
            ...(inlinePreview && currentImage && !cropSrc
              ? {
                  width: "fit-content",
                  marginLeft: "auto",
                  marginRight: "auto",
                }
              : {}),
          }}
        >
          {/* Tabs */}
          {showTabs && !(inlinePreview && currentImage) && (
            <div
              style={{
                display: "flex",
                gap: "0",
                borderBottom: "1px solid #E6E6E6",
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
                    fontSize: "12px",
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
                ref={cropContainerRef}
                style={{
                  position: "relative",
                  width: "100%",
                  height: computedCropperHeight,
                  background: "#F5F5F5",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  cropShape={cropShape}
                  objectFit="contain"
                  cropSize={cropSize}
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
              {/* Save/actions bar */}
              {!hideSaveButton && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <PrimaryButton onClick={handleSaveCrop} loading={isUploading}>
                    {isUploading ? "Saving..." : "Save"}
                  </PrimaryButton>
                </div>
              )}
            </div>
          ) : inlinePreview && currentImage ? (
            /* Inline image preview */
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "240px",
                  aspectRatio: "4 / 5",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Image
                  src={currentImage}
                  alt="Cover preview"
                  fill
                  sizes="240px"
                  style={{
                    objectFit: "cover",
                  }}
                />
              </div>
              <button
                onClick={() => {
                  onSelect("");
                  resetCropper();
                }}
                style={{
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/icons/trash.png"
                  alt="Remove image"
                  width={28}
                  height={30}
                />
              </button>
            </div>
          ) : tab === "upload" ? (
            <ImageDropZone
              onFileSelected={handleFileSelected}
              isUploading={isUploading}
            />
          ) : (
            /* Existing images tab */
            <>
              {existingImages && existingImages.length === 0 ? (
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
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
                        position: "relative",
                        aspectRatio: "1",
                        border:
                          currentImage === url
                            ? "2px solid #00FF66"
                            : "1px solid #E6E6E6",
                        padding: 0,
                        background: "none",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 33vw, 200px"
                        style={{
                          objectFit: "cover",
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!cropSrc && inlinePreview && currentImage && onClose && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "16px",
            }}
          >
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
        )}
        {!cropSrc && !currentImage && skipLink && (
          <div style={{ marginTop: "16px" }}>{skipLink}</div>
        )}
      </div>
    );
  }
);

export default ImageUploadFlow;
