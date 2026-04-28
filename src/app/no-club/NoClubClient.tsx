"use client";

import { useRouter } from "next/navigation";
import NavBar from "@/components/clubs/NavBar";
import NoiseBackground from "@/components/NoiseBackground";
import PrimaryButton from "@/components/PrimaryButton";

interface NoClubClientProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export default function NoClubClient({ user }: NoClubClientProps) {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <NoiseBackground fillMode="cover" />
      <div
        style={{ position: "sticky", top: 0, zIndex: 50, isolation: "isolate" }}
      >
        <NavBar
          user={user}
          clubs={[]}
          currentClub={null}
          showClubDropdown={false}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "8px 8px 0px 0px #000000",
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "32px",
              fontWeight: 400,
              color: "#000000",
              margin: 0,
              textAlign: "center",
            }}
          >
            Clubless?
          </p>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            Ugh, as if!
          </p>

          <PrimaryButton onClick={() => router.push("/onboarding/create-club")}>
            Start a write club
          </PrimaryButton>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
              lineHeight: "1.5",
              textAlign: "center",
            }}
          >
            Want to join an existing write club? Have the club host send you an
            invite link to join.
          </p>
        </div>
      </div>
    </div>
  );
}
