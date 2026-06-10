"use client";

import NavBar from "@/components/clubs/NavBar";
import GettingStartedSection from "@/components/tutorial/GettingStartedSection";

interface NoClubClientProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export default function NoClubClient({ user }: NoClubClientProps) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <NavBar
          user={user}
          clubs={[]}
          currentClub={null}
          showClubDropdown={false}
        />
      </div>

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        <GettingStartedSection
          variant="no-club"
          userId={user.id}
          avatarDone={!!user.avatarUrl}
        />
      </div>
    </div>
  );
}
