"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import ImageUpload from "@/components/onboarding/ImageUpload";
import Tagline from "@/components/Tagline";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Club details"
      size="md"
      noiseBackground
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Club name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Tagline
              text="Club name"
              color="#01EFFC"
              textColor="#000000"
              fontSize={14}
              width={105}
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
                fontSize={14}
                width={115}
              />
              <span
                style={{
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
                fontSize={14}
                width={125}
              />
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#959595",
                }}
              >
                (optional)
              </span>
            </div>
            <div style={{ backgroundColor: "#FFFFFF", padding: "12px" }}>
              <ImageUpload
                onUpload={setBannerImage}
                currentImage={bannerImage}
                disabled={isSubmitting}
                uploadText="Upload a banner photo"
                hideRecommendedText={true}
              />
            </div>
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

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            style={{
              backgroundColor:
                isSubmitting || !name.trim() ? "#E6E6E6" : "#FFFFFF",
              border: "2px solid #000000",
              boxShadow:
                isSubmitting || !name.trim()
                  ? "none"
                  : "8px 8px 0px 0px #00FF66",
              padding: "12px 48px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              cursor: isSubmitting || !name.trim() ? "not-allowed" : "pointer",
              transition: "none",
              width: "100%",
            }}
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
