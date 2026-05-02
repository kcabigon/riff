"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/shared/Modal";
import ImageUploadFlow from "@/components/shared/ImageUploadFlow";
import type { ImageUploadFlowHandle } from "@/components/shared/ImageUploadFlow";
import Image from "next/image";
import Tagline from "@/components/Tagline";
import TextInput from "@/components/TextInput";
import PrimaryButton from "@/components/PrimaryButton";

const CLUB_NAME_MAX = 42;
const DESCRIPTION_MAX = 200;

interface ClubUpdatedData {
  name: string;
  description: string | null;
  bannerImage: string | null;
}

interface ClubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: ClubUpdatedData) => void;
  club: {
    id: string;
    name: string;
    description: string | null;
    bannerImage: string | null;
  };
}

export default function ClubSettingsModal({
  isOpen,
  onClose,
  onUpdated,
  club,
}: ClubSettingsModalProps) {
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description || "");
  const [bannerImage, setBannerImage] = useState<string | null>(
    club.bannerImage
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBannerChange, setShowBannerChange] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadFlowRef = useRef<ImageUploadFlowHandle>(null);

  // Reset form to current saved values each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setName(club.name);
      setDescription(club.description || "");
      setBannerImage(club.bannerImage);
      setShowBannerChange(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // If the user has an unsaved crop, save it first
    let finalBannerImage = bannerImage;
    if (uploadFlowRef.current?.hasPendingCrop()) {
      const url = await uploadFlowRef.current.saveCrop();
      if (!url) {
        // Crop/upload failed — don't submit the form
        setIsSubmitting(false);
        return;
      }
      finalBannerImage = url;
    }

    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          bannerImage: finalBannerImage || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save changes");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onUpdated({
        name: name.trim(),
        description: description.trim() || null,
        bannerImage: finalBannerImage || null,
      });
      onClose();
    } catch (err) {
      console.error("Error updating club:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Club details" size="md">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Club name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Tagline
              text="Club name"
              color="#01EFFC"
              textColor="#000000"
              fontSize={16}
              width={120}
              align="left"
            />
            <TextInput
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={CLUB_NAME_MAX}
              error={name.length >= CLUB_NAME_MAX ? " " : undefined}
            />
          </div>

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tagline
                text="Description"
                color="#00FF66"
                textColor="#000000"
                fontSize={16}
                width={132}
                align="left"
              />
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#FFFFFF",
                  padding: "2px 8px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#959595",
                }}
              >
                (optional)
              </span>
            </div>
            <TextInput
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESCRIPTION_MAX}
              error={description.length >= DESCRIPTION_MAX ? " " : undefined}
            />
          </div>

          {/* Banner image */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tagline
                text="Banner image"
                color="#EECF01"
                textColor="#000000"
                fontSize={16}
                width={144}
                align="left"
              />
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#FFFFFF",
                  padding: "2px 8px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#959595",
                }}
              >
                (optional)
              </span>
            </div>
            {bannerImage && !showBannerChange ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "3 / 1",
                  overflow: "hidden",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
                onClick={() => !isSubmitting && setShowBannerChange(true)}
              >
                <Image
                  src={bannerImage}
                  alt="Banner preview"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : (
              <ImageUploadFlow
                ref={uploadFlowRef}
                onSelect={(url) => {
                  setBannerImage(url || null);
                  setShowBannerChange(false);
                }}
                currentImage={bannerImage}
                removeLabel="Remove banner"
                aspectRatio={3 / 1}
                hideSaveButton
              />
            )}
          </div>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#FF4444",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <PrimaryButton
            type="submit"
            loading={isSubmitting}
            disabled={!name.trim()}
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
