"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import ImageUploadModal from "@/components/shared/ImageUploadModal";
import Image from "next/image";
import Tagline from "@/components/Tagline";
import PrimaryButton from "@/components/PrimaryButton";

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
  const [error, setError] = useState<string | null>(null);
  const [showBannerUpload, setShowBannerUpload] = useState(false);

  // Reset form to current saved values each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setName(club.name);
      setDescription(club.description || "");
      setBannerImage(club.bannerImage);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          bannerImage: bannerImage || null,
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
        bannerImage: bannerImage || null,
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
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                backgroundColor: "#FFFFFF",
                border: "2px solid #000000",
                padding: "12px 16px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#00FF66";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#000000";
              }}
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
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                backgroundColor: "#FFFFFF",
                border: "2px solid #000000",
                padding: "12px 16px",
                outline: "none",
                width: "100%",
                resize: "vertical",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#00FF66";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#000000";
              }}
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
              {bannerImage && (
                <button
                  type="button"
                  onClick={() => setBannerImage(null)}
                  disabled={isSubmitting}
                  style={{
                    marginLeft: "auto",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  <Image
                    src="/icons/trash.png"
                    alt="Remove banner"
                    width={28}
                    height={30}
                  />
                </button>
              )}
            </div>
            {bannerImage ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "3 / 1",
                  overflow: "hidden",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
                onClick={() => !isSubmitting && setShowBannerUpload(true)}
              >
                <Image
                  src={bannerImage}
                  alt="Banner preview"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBannerUpload(true)}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  aspectRatio: "3 / 1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "2px dashed #CCCCCC",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#CCCCCC"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="0" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#808080",
                  }}
                >
                  Upload a banner photo
                </span>
              </button>
            )}
            <ImageUploadModal
              isOpen={showBannerUpload}
              onClose={() => setShowBannerUpload(false)}
              onSelect={(url) => {
                setBannerImage(url || null);
                setShowBannerUpload(false);
              }}
              title="Banner image"
              currentImage={bannerImage}
              removeLabel="Remove banner"
              aspectRatio={3 / 1}
            />
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
