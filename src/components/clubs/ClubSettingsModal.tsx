"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/shared/Modal";
import ImageUploadFlow from "@/components/shared/ImageUploadFlow";
import type { ImageUploadFlowHandle } from "@/components/shared/ImageUploadFlow";
import Image from "next/image";
import Tagline from "@/components/Tagline";
import TextInput from "@/components/TextInput";
import PrimaryButton from "@/components/PrimaryButton";
import { CLUB_NAME_MAX, DESCRIPTION_MAX } from "@/lib/constants";

interface ClubUpdatedData {
  name: string;
  description: string | null;
  bannerImage: string | null;
}

interface ClubMember {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface ClubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: ClubUpdatedData) => void;
  onTransferred: () => void;
  club: {
    id: string;
    name: string;
    description: string | null;
    bannerImage: string | null;
  };
  members: ClubMember[];
}

export default function ClubSettingsModal({
  isOpen,
  onClose,
  onUpdated,
  onTransferred,
  club,
  members,
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

  // Transfer host state
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Reset form to current saved values each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setName(club.name);
      setDescription(club.description || "");
      setBannerImage(club.bannerImage);
      setShowBannerChange(false);
      setError(null);
      setSelectedMemberId("");
      setShowTransferConfirm(false);
      setTransferError(null);
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

  const handleTransfer = async () => {
    if (!selectedMemberId) return;
    setIsTransferring(true);
    setTransferError(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}/transfer-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: selectedMemberId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setTransferError(data.error || "Failed to transfer host");
        setIsTransferring(false);
        return;
      }

      onClose();
      onTransferred();
    } catch {
      setTransferError("Something went wrong. Please try again.");
      setIsTransferring(false);
    }
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

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
                  color: "#9C9C9C",
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
                  color: "#9C9C9C",
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
                color: "#DC2626",
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

      {/* Transfer host — only show if there are other members */}
      {members.length > 0 && (
        <div
          style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid #E6E6E6",
          }}
        >
          <Tagline
            text="Transfer host"
            color="#DC2626"
            textColor="#000000"
            fontSize={16}
            width={148}
            align="left"
          />
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#808080",
              margin: "8px 0 16px",
              lineHeight: 1.5,
            }}
          >
            Hand off host access to another member. This can&apos;t be undone
            without their help.
          </p>

          <select
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value);
              setShowTransferConfirm(false);
              setTransferError(null);
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: selectedMemberId ? "#000000" : "#9C9C9C",
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              borderRadius: 0,
              appearance: "none",
              cursor: "pointer",
              marginBottom: "12px",
            }}
          >
            <option value="">Choose a member...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || "Unknown"}
              </option>
            ))}
          </select>

          {selectedMemberId && !showTransferConfirm && (
            <button
              type="button"
              onClick={() => setShowTransferConfirm(true)}
              style={{
                backgroundColor: "#FFFFFF",
                border: "2px solid #DC2626",
                padding: "10px 24px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#DC2626",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Transfer host to {selectedMember?.name || "this member"}
            </button>
          )}

          {showTransferConfirm && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#DC2626",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Transfer host to{" "}
                <strong>{selectedMember?.name || "this member"}</strong>? You
                will become a regular member.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  style={{
                    flex: 1,
                    backgroundColor: isTransferring ? "#E6E6E6" : "#DC2626",
                    border: "2px solid #000000",
                    boxShadow: isTransferring
                      ? "none"
                      : "4px 4px 0px 0px #000000",
                    padding: "10px 16px",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: isTransferring ? "#9C9C9C" : "#FFFFFF",
                    cursor: isTransferring ? "not-allowed" : "pointer",
                  }}
                >
                  {isTransferring ? "Transferring..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferConfirm(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    border: "2px solid #000000",
                    padding: "10px 16px",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#000000",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {transferError && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#DC2626",
                margin: "8px 0 0",
              }}
            >
              {transferError}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
