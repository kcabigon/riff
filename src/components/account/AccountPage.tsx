"use client";

import ProfileSection from "@/components/settings/ProfileSection";
import EmailSection from "@/components/settings/EmailSection";
import DataSection from "@/components/settings/DataSection";
import NavBar from "@/components/clubs/NavBar";

interface AccountPageProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    email: string | null;
  };
  clubs: Array<{ id: string; name: string }>;
  currentClub: { id: string; name: string } | null;
}

export default function AccountPage({
  user,
  clubs,
  currentClub,
}: AccountPageProps) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      <NavBar
        user={user}
        clubs={clubs}
        currentClub={currentClub}
        showClubDropdown={false}
      />

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "48px 24px 64px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          <ProfileSection user={user} />
          <EmailSection />
          <DataSection />
        </div>
      </div>
    </div>
  );
}
