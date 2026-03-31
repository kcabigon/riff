"use client";

import ImageUploadModal from "@/components/shared/ImageUploadModal";
import { extractAllImages } from "@/lib/extract-first-image";

interface CoverImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  pieceId: string;
  pieceTitle: string;
  pieceContent: string;
  currentCoverImage: string | null;
}

export default function CoverImageModal({
  isOpen,
  onClose,
  onSelect,
  pieceId,
  pieceTitle,
  pieceContent,
  currentCoverImage,
}: CoverImageModalProps) {
  const pieceImages = extractAllImages(pieceContent);

  return (
    <ImageUploadModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      title="Cover image"
      currentImage={currentCoverImage}
      removeLabel="Remove cover image"
      aspectRatio={4 / 5}
      existingImages={pieceImages}
      existingImagesLabel="From your piece"
      piecePreview={{
        id: pieceId,
        title: pieceTitle,
        currentContent: pieceContent,
      }}
    />
  );
}
