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
    bio: string | null;
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

  const avatarUser = {
    id: user.id,
    name: [firstName, lastName].filter(Boolean).join(" ") || user.name || null,
    username: null,
    avatarUrl: avatarUrl || null,
  };

  return (
    <section>
      <h1
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "32px",
          fontWeight: 400,
          color: "#000000",
          margin: "0 0 24px 0",
        }}
      >
        Your info
      </h1>

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
            <Avatar
              user={avatarUser}
              size={48}
              style={{ width: "72px", height: "72px" }}
            />
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Edit
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

        {/* Bio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#000000",
            }}
          >
            Profile bio
          </label>
          <TextInput
            multiline
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Not your boring LinkedIn bio - have fun with it."
            maxLength={160}
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
