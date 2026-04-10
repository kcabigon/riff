"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PrimaryButton from "@/components/PrimaryButton";

interface ClubInfo {
  id: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  memberCount: number;
}

interface InviteInfo {
  club: ClubInfo;
  invitedBy: {
    name: string;
  };
  expiresAt: string;
}

export default function JoinClubPage({
  params,
}: {
  params: { token: string };
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Fetch invite information
  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const response = await fetch(`/api/clubs/invites/${params.token}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load invite");
        }

        const data = await response.json();
        setInviteInfo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, [params.token]);

  // Handle join club
  const handleJoinClub = async () => {
    // Redirect to login if not authenticated
    if (!session) {
      router.push(`/login?callbackUrl=/clubs/join/${params.token}`);
      return;
    }

    setJoining(true);
    setError("");

    try {
      const response = await fetch(`/api/clubs/join/${params.token}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join club");
      }

      const data = await response.json();

      // Redirect to the club page
      router.push(`/clubs/${data.clubId}`);
    } catch (err: any) {
      setError(err.message);
      setJoining(false);
    }
  };

  // Loading state
  if (loading || status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            padding: "48px",
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "8px 8px 0px 0px #000000",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "18px", color: "#000000" }}>
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            padding: "48px",
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "8px 8px 0px 0px #000000",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 300,
              color: "#FF0000",
              margin: 0,
            }}
          >
            Invitation Error
          </h1>
          <p
            style={{ fontSize: "18px", color: "#000000", textAlign: "center" }}
          >
            {error}
          </p>
          <PrimaryButton onClick={() => router.push("/")}>
            Go to Home
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // Success state - show club invite
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          padding: "48px",
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: "8px 8px 0px 0px #000000",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 12px 0",
            }}
          >
            You're Invited!
          </h1>
          <p style={{ fontSize: "16px", color: "#959595", margin: 0 }}>
            {inviteInfo?.invitedBy.name} has invited you to join
          </p>
        </div>

        {/* Club Info */}
        {inviteInfo && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              backgroundColor: "#F9F9F9",
              border: "2px solid #000000",
            }}
          >
            {inviteInfo.club.bannerUrl && (
              <img
                src={inviteInfo.club.bannerUrl}
                alt={inviteInfo.club.name}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  border: "2px solid #000000",
                }}
              />
            )}
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 500,
                color: "#000000",
                margin: 0,
              }}
            >
              {inviteInfo.club.name}
            </h2>
            {inviteInfo.club.description && (
              <p style={{ fontSize: "16px", color: "#000000", margin: 0 }}>
                {inviteInfo.club.description}
              </p>
            )}
            <p style={{ fontSize: "14px", color: "#959595", margin: 0 }}>
              {inviteInfo.club.memberCount}{" "}
              {inviteInfo.club.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        )}

        {/* Action Button */}
        <PrimaryButton onClick={handleJoinClub} loading={joining}>
          {session ? "Join Club" : "Sign in to Join"}
        </PrimaryButton>

        {/* TODO Note */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#FFF9E6",
            border: "2px dashed #FFD700",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "#000000",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            TODO: Design and refine this page UI later (currently a functional
            placeholder)
          </p>
        </div>
      </div>
    </div>
  );
}
