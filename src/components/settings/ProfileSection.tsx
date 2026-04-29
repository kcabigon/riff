"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/shared/Avatar";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import ImageUploadModal from "@/components/shared/ImageUploadModal";

interface ProfileSectionProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    email: string | null;
  };
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          avatarUrl: avatarUrl || null,
        }),
      });

      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUser = {
    id: user.id,
    name: [firstName, lastName].filter(Boolean).join(" ") || user.name || null,
    username: null,
    avatarUrl: avatarUrl || null,
  };

  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "24px",
          fontWeight: 400,
          color: "#000000",
          margin: "0 0 24px 0",
        }}
      >
        Profile
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Avatar upload */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#000000",
            }}
          >
            Photo
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              style={{
                cursor: "pointer",
                position: "relative",
                width: "72px",
                height: "72px",
                flexShrink: 0,
                padding: 0,
                background: "none",
                border: "none",
              }}
            >
              <Avatar
                user={avatarUser}
                size={48}
                style={{ width: "72px", height: "72px" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "64px",
                  backgroundColor: "rgba(0,0,0,0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)";
                }}
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "11px",
                    fontWeight: 500,
                    opacity: 0,
                    transition: "opacity 0.15s",
                  }}
                  className="avatar-upload-label"
                >
                  Edit
                </span>
              </div>
              <style>{`
                div:hover .avatar-upload-label { opacity: 1 !important; }
              `}</style>
            </button>
            <ImageUploadModal
              isOpen={isAvatarModalOpen}
              onClose={() => setIsAvatarModalOpen(false)}
              onSelect={(url) => setAvatarUrl(url)}
              title="Avatar upload"
              aspectRatio={1}
              cropShape="round"
              currentImage={avatarUrl || null}
              removeLabel="Remove photo"
            />
            {avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#9C9C9C",
                  padding: 0,
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Email (read-only) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#000000",
            }}
          >
            Email
          </label>
          <TextInput value={user.email || ""} disabled />
        </div>

        {/* Name fields */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              First name
            </label>
            <TextInput
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              Last name
            </label>
            <TextInput
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Save button */}
        <PrimaryButton onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </PrimaryButton>
      </div>
    </section>
  );
}
