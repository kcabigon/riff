"use client";

import ImageUploadModal from "@/components/shared/ImageUploadModal";
import { extractAllImages } from "@/lib/extract-first-image";

interface CoverImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  pieceContent: string;
  currentCoverImage: string | null;
}

export default function CoverImageModal({
  isOpen,
  onClose,
  onSelect,
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
      aspectRatio={16 / 9}
      existingImages={pieceImages}
      existingImagesLabel="From your piece"
    />
  );
}
