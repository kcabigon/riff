"use client";

import { useState } from "react";
import ProfileHeader from "./ProfileHeader";
import PiecesGrid from "./tabs/PiecesGrid";
import CollectionsList from "./tabs/CollectionsList";
import BackButton from "@/components/BackButton";

type TabId = "pieces" | "collections";

interface ProfilePageProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    username: string | null;
  };
  stats: {
    pieceCount: number;
    totalWordCount: number;
  };
  pieces: Array<{
    id: string;
    title: string | null;
    coverImage: string | null;
    currentContent: string | null;
  }>;
  collections: Array<{
    id: string;
    name: string;
    pieces: Array<{
      id: string;
      title: string | null;
      createdAt: string;
      updatedAt: string;
      isShared: boolean;
      riffs: Array<{ id: string; title: string | null; clubName: string }>;
    }>;
  }>;
  isOwnProfile: boolean;
  lastActiveClubId: string | null;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "pieces", label: "PIECES" },
  { id: "collections", label: "COLLECTIONS" },
];

export default function ProfilePage({
  user,
  stats,
  pieces,
  collections,
  isOwnProfile,
  lastActiveClubId,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("pieces");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Back to club */}
      {lastActiveClubId && (
        <div style={{ padding: "16px 24px 0" }}>
          <BackButton href={`/clubs/${lastActiveClubId}`} />
        </div>
      )}

      {/* Header */}
      <ProfileHeader user={user} stats={stats} />

      {/* Divider */}
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "#959595",
        }}
      />

      {/* Tab bar — own profile only */}
      {isOwnProfile && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            paddingTop: "0",
            paddingBottom: "0",
            backgroundColor: "#FFFFFF",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #000000"
                    : "2px solid transparent",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "20px",
                  fontWeight: isActive ? 700 : 300,
                  color: "#000000",
                  cursor: "pointer",
                  padding: "12px 24px",
                  letterSpacing: "0.02em",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Divider under tabs */}
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "#959595",
        }}
      />

      {/* Tab content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {isOwnProfile ? (
          <>
            {activeTab === "pieces" && <PiecesGrid pieces={pieces} />}
            {activeTab === "collections" && (
              <CollectionsList collections={collections} />
            )}
          </>
        ) : (
          <PiecesGrid pieces={pieces} />
        )}
      </div>
    </div>
  );
}
