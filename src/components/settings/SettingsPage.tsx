"use client";

import { useRouter } from "next/navigation";
import ProfileSection from "./ProfileSection";
import DataSection from "./DataSection";

interface SettingsPageProps {
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

export default function SettingsPage({ user }: SettingsPageProps) {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "48px 24px 64px",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>

        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "32px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 48px 0",
          }}
        >
          Settings
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          <ProfileSection user={user} />
          <DataSection />
        </div>
      </div>
    </div>
  );
}
