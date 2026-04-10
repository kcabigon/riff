"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/shared/Avatar";
import PrimaryButton from "@/components/PrimaryButton";

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
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.url);
      }
    } catch {
      // silent
    } finally {
      setIsUploading(false);
    }
  };

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
              onClick={handleAvatarClick}
              style={{
                cursor: isUploading ? "wait" : "pointer",
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
                  backgroundColor: isUploading
                    ? "rgba(0,0,0,0.4)"
                    : "rgba(0,0,0,0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isUploading)
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  if (!isUploading)
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)";
                }}
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "11px",
                    fontWeight: 500,
                    opacity: isUploading ? 1 : 0,
                    transition: "opacity 0.15s",
                  }}
                  className="avatar-upload-label"
                >
                  {isUploading ? "..." : "Edit"}
                </span>
              </div>
              <style>{`
                div:hover .avatar-upload-label { opacity: 1 !important; }
              `}</style>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
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
