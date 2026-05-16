"use client";

import Modal from "@/components/shared/Modal";
import ImageUploadFlow from "@/components/shared/ImageUploadFlow";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div style={{ marginTop: "16px" }}>
        <ImageUploadFlow
          onSelect={(url) => {
            onSelect(url);
            if (url) onClose();
          }}
          onClose={onClose}
          currentImage={currentImage}
          removeLabel={removeLabel}
          aspectRatio={aspectRatio}
          cropShape={cropShape}
          existingImages={existingImages}
          existingImagesLabel={existingImagesLabel}
          inlinePreview={inlinePreview}
          onSkip={onSkip}
        />
      </div>
    </Modal>
  );
}
