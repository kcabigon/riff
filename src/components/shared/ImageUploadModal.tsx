"use client";

import { useRef, useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import ImageUploadFlow, {
  type ImageUploadFlowHandle,
} from "@/components/shared/ImageUploadFlow";
import PrimaryButton from "@/components/PrimaryButton";

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
  const flowRef = useRef<ImageUploadFlowHandle>(null);
  const [cropActive, setCropActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCropActive(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  const footer = cropActive ? (
    <PrimaryButton
      loading={isSaving}
      onClick={async () => {
        setIsSaving(true);
        try {
          await flowRef.current?.saveCrop();
        } finally {
          setIsSaving(false);
        }
      }}
    >
      Use this image
    </PrimaryButton>
  ) : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={footer}
    >
      <div style={{ marginTop: "16px" }}>
        <ImageUploadFlow
          ref={flowRef}
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
          hideSaveButton={true}
          onCropStateChange={setCropActive}
        />
      </div>
    </Modal>
  );
}
