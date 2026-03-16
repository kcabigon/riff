"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileSectionProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    email: string | null;
  };
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [bio, setBio] = useState(user.bio || "");
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
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
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
              onFocus={(e) => { e.target.style.borderColor = "#00FF66"; }}
              onBlur={(e) => { e.target.style.borderColor = "#000000"; }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
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
              onFocus={(e) => { e.target.style.borderColor = "#00FF66"; }}
              onBlur={(e) => { e.target.style.borderColor = "#000000"; }}
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
            onFocus={(e) => { e.target.style.borderColor = "#00FF66"; }}
            onBlur={(e) => { e.target.style.borderColor = "#000000"; }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            backgroundColor: saved ? "#00FF66" : "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: isSaving ? "none" : "8px 8px 0px 0px #00FF66",
            padding: "12px 48px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            cursor: isSaving ? "not-allowed" : "pointer",
            transition: "none",
            width: "100%",
          }}
        >
          {isSaving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </button>
      </div>
    </section>
  );
}
