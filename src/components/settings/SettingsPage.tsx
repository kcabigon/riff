"use client";

import ProfileSection from "./ProfileSection";
import DataSection from "./DataSection";
import BackButton from "@/components/BackButton";

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
        <div style={{ marginBottom: "32px" }}>
          <BackButton label="Back" />
        </div>

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
