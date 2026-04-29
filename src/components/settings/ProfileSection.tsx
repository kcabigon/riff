"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/shared/Avatar";
import PrimaryButton from "@/components/PrimaryButton";
import ImageUploadModal from "@/components/shared/ImageUploadModal";

interface ProfileSectionProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    email: string | null;
  };
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [bio, setBio] = useState(user.bio || "");
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
          bio: bio.trim() || null,
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

  const inputStyle = {
    fontFamily: "var(--font-dm-sans)",
    fontSize: "16px",
    fontWeight: 300 as const,
    color: "#000000",
    backgroundColor: "#FFFFFF",
    border: "2px solid #000000",
    padding: "12px 16px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  // Build an AvatarUser for the Avatar component preview
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
          fontFamily: "var(--font-dm-sans)",
          fontSize: "20px",
          fontWeight: 300,
          color: "#000000",
          margin: "0 0 24px 0",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
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
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
            }}
          >
            Photo
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              style={{
                cursor: "pointer",
                position: "relative",
                width: "72px",
                height: "72px",
                flexShrink: 0,
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
            </div>
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
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#959595",
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
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
            }}
          >
            Email
          </label>
          <input
            type="text"
            value={user.email || ""}
            disabled
            style={{
              ...inputStyle,
              color: "#808080",
              backgroundColor: "#F5F5F5",
              cursor: "not-allowed",
            }}
          />
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
                fontSize: "14px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#00FF66";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#000000";
              }}
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
                fontSize: "14px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#00FF66";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#000000";
              }}
            />
          </div>
        </div>

        {/* Bio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
            }}
          >
            Bio <span style={{ color: "#959595" }}>(optional)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#00FF66";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#000000";
            }}
          />
        </div>

        {/* Save button */}
        <PrimaryButton onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </PrimaryButton>
      </div>
    </section>
  );
}
