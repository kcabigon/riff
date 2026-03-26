"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarStack from "@/components/shared/AvatarStack";
import LandingNavBar from "@/components/LandingNavBar";
import ConversionModal from "@/components/clubs/ConversionModal";

interface ClubMember {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

interface JoinClubClientProps {
  club: {
    id: string;
    name: string;
    description: string | null;
    bannerImage: string | null;
    members: ClubMember[];
  };
  stats: {
    riffCount: number;
    pieceCount: number;
    wordCount: number;
  };
  isLoggedIn: boolean;
}

export default function JoinClubClient({
  club,
  stats,
  isLoggedIn,
}: JoinClubClientProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatNumber = (n: number) => n.toLocaleString();

  const handleJoin = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/clubs/${club.id}/join`);
      return;
    }

    setIsJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/clubs/${club.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Try again.");
        setIsJoining(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setIsJoining(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      <LandingNavBar sticky />

      {/* Banner */}
      {club.bannerImage && (
        <div
          className="club-banner"
          style={{
            width: "100%",
            height: "320px",
            backgroundImage: `url(${club.bannerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.66)",
            }}
          />
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              alignItems: "flex-start",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "32px",
                fontWeight: 400,
                color: "#FFFFFF",
                margin: 0,
              }}
            >
              {club.name}
            </h1>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 12px",
                alignItems: "start",
              }}
            >
              <p style={statStyle("#FFFFFF")}>
                <span style={{ fontWeight: 700 }}>{stats.riffCount}</span> riffs
              </p>
              <p style={statStyle("#FFFFFF")}>
                <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span>{" "}
                pieces
              </p>
              <p style={statStyle("#FFFFFF")}>
                <span style={{ fontWeight: 700 }}>
                  {formatNumber(stats.wordCount)}
                </span>{" "}
                words
              </p>
            </div>

            <AvatarStack
              users={club.members.map((m) => m.user)}
              size={48}
              showBorder={true}
              borderColor="#FFFFFF"
              borderWidth={2}
            />

            {club.description && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#FFFFFF",
                  margin: 0,
                  lineHeight: "normal",
                }}
              >
                {club.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "64px 24px 64px",
        }}
      >
        {/* No-banner header */}
        {!club.bannerImage && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "48px",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "32px",
                fontWeight: 400,
                color: "#000000",
                margin: 0,
              }}
            >
              {club.name}
            </h1>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 12px",
                alignItems: "start",
              }}
            >
              <p style={statStyle("#000000")}>
                <span style={{ fontWeight: 700 }}>{stats.riffCount}</span> riffs
              </p>
              <p style={statStyle("#000000")}>
                <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span>{" "}
                pieces
              </p>
              <p style={statStyle("#000000")}>
                <span style={{ fontWeight: 700 }}>
                  {formatNumber(stats.wordCount)}
                </span>{" "}
                words
              </p>
            </div>

            <AvatarStack
              users={club.members.map((m) => m.user)}
              size={48}
              showBorder={true}
              borderColor="#000000"
              borderWidth={2}
            />

            {club.description && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                  lineHeight: "normal",
                }}
              >
                {club.description}
              </p>
            )}
          </div>
        )}

        {/* Join CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            marginTop: 0,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "18px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              textAlign: "center",
            }}
          >
            You&apos;ve been invited to join this write club.
          </p>

          <button
            onClick={handleJoin}
            disabled={isJoining}
            style={{
              backgroundColor: "#01EFFC",
              border: "2px solid #000000",
              boxShadow: "8px 8px 0px 0px #000000",
              padding: "12px 48px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              cursor: isJoining ? "not-allowed" : "pointer",
              opacity: isJoining ? 0.7 : 1,
              transition: "background-color 0.2s ease, box-shadow 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isJoining) {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
              }
            }}
            onMouseLeave={(e) => {
              if (!isJoining) {
                e.currentTarget.style.backgroundColor = "#01EFFC";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #000000";
              }
            }}
            onMouseDown={(e) => {
              if (!isJoining) {
                e.currentTarget.style.transform = "translate(4px, 4px)";
                e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
              }
            }}
            onMouseUp={(e) => {
              if (!isJoining) {
                e.currentTarget.style.transform = "translate(0, 0)";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
              }
            }}
          >
            {isJoining ? "Joining..." : `Join ${club.name}`}
          </button>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#FF0000",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#959595",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              textDecorationColor: "#959595",
            }}
          >
            Wait, what&apos;s a write club?
          </button>
        </div>
      </div>

      <ConversionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clubName={club.name}
        onJoin={handleJoin}
        isJoining={isJoining}
      />

      <style>{`
        @media (max-width: 767px) {
          .club-banner {
            height: 180px !important;
          }
        }
      `}</style>
    </div>
  );
}

const statStyle = (color: string): React.CSSProperties => ({
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  color,
  margin: 0,
});
