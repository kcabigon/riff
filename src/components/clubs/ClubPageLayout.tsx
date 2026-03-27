"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/clubs/NavBar";
import AvatarStack from "@/components/shared/AvatarStack";
import RiffCard from "@/components/riffs/RiffCard";
import EmptyRiffState from "@/components/riffs/EmptyRiffState";
import CompletedRiffCard from "@/components/riffs/CompletedRiffCard";
import CreateRiffModal from "@/components/riffs/CreateRiffModal";
import RevealConfirmModal from "@/components/riffs/RevealConfirmModal";
import ReadyToRevealCard from "@/components/riffs/ReadyToRevealCard";
import OnboardingChecklist from "@/components/clubs/OnboardingChecklist";
import ClubSettingsModal from "@/components/clubs/ClubSettingsModal";
import InviteOptions from "@/components/clubs/InviteOptions";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";

interface ClubMember {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

interface RiffPiece {
  piece: {
    id: string;
    title: string;
    authorId: string;
    currentContent: string;
    coverImage?: string | null;
    wordCount: number;
  };
}

interface RiffParticipant {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

interface Riff {
  id: string;
  title: string | null;
  prompt: string | null;
  deadline: string | null;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  participants: RiffParticipant[];
  pieces: RiffPiece[];
}

interface ClubPageLayoutProps {
  club: {
    id: string;
    name: string;
    description: string | null;
    bannerImage: string | null;
    adminId: string;
    members: ClubMember[];
  };
  userClubs: Array<{ id: string; name: string }>;
  currentUserId: string;
  isAdmin: boolean;
  activeRiff: Riff | null;
  revealedRiffs: Riff[];
  readCounts: Record<string, number>;
  completedRiffs: Riff[];
  stats: {
    riffCount: number;
    pieceCount: number;
    wordCount: number;
  };
}

export default function ClubPageLayout({
  club,
  userClubs,
  currentUserId,
  isAdmin,
  activeRiff,
  revealedRiffs,
  readCounts,
  completedRiffs,
  stats,
}: ClubPageLayoutProps) {
  const router = useRouter();
  const [clubName, setClubName] = useState(club.name);
  const [clubDescription, setClubDescription] = useState(club.description);
  const [clubBannerImage, setClubBannerImage] = useState(club.bannerImage);
  const [isCreateRiffModalOpen, setIsCreateRiffModalOpen] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isClubDetailsModalOpen, setIsClubDetailsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSettingsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [currentActiveRiff, setCurrentActiveRiff] = useState<Riff | null>(
    activeRiff
  );
  const handleAvatarClick = useProfileNavigation();

  // After joining a riff, refresh the page to get updated state
  const handleJoinRiff = useCallback(() => {
    router.refresh();
  }, []);

  // After creating a riff, refresh the page
  const handleRiffCreated = useCallback(() => {
    setIsCreateRiffModalOpen(false);
    router.refresh();
  }, []);

  // Handle reveal confirmation
  const handleRevealConfirm = useCallback(async () => {
    if (!activeRiff) return;
    setIsRevealing(true);
    try {
      const res = await fetch(`/api/riffs/${activeRiff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVEALED" }),
      });
      if (res.ok) {
        setIsRevealModalOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Error revealing riff:", err);
    } finally {
      setIsRevealing(false);
    }
  }, [activeRiff]);

  // Compute joined/submitted state for active riff
  const isJoined = activeRiff
    ? activeRiff.participants.some((p) => p.user.id === currentUserId)
    : false;
  const hasSubmitted = activeRiff
    ? activeRiff.pieces.some((p) => p.piece.authorId === currentUserId)
    : false;

  // Format word count with commas
  const formatNumber = (n: number): string => {
    return n.toLocaleString();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Sticky NavBar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <NavBar
          user={
            club.members.find((m) => m.user.id === currentUserId)?.user || {
              id: currentUserId,
              name: null,
              username: null,
              avatarUrl: null,
            }
          }
          clubs={userClubs}
          currentClub={{ id: club.id, name: clubName }}
        />
      </div>

      {/* Banner with overlay — full width, 320px height (180px on mobile) */}
      {clubBannerImage && (
        <div
          className="club-banner"
          style={{
            width: "100%",
            height: "320px",
            backgroundImage: `url(${clubBannerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.66)",
            }}
          />
          {/* Club info overlaid on banner */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#FFFFFF",
                  margin: 0,
                }}
              >
                {clubName}
              </h1>
              {isAdmin && (
                <div ref={settingsDropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setIsSettingsDropdownOpen((o) => !o)}
                    aria-label="Club settings"
                    style={{
                      background: "transparent",
                      border: "2px solid transparent",
                      cursor: "pointer",
                      padding: "4px 6px",
                      color: "#FFFFFF",
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                      opacity: 0.7,
                      transition:
                        "opacity 0.15s ease, background-color 0.15s ease, box-shadow 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.backgroundColor = "#01EFFC";
                      e.currentTarget.style.borderColor = "#000000";
                      e.currentTarget.style.color = "#000000";
                      e.currentTarget.style.boxShadow =
                        "3px 3px 0px 0px #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.7";
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.color = "#FFFFFF";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <svg
                      width="12"
                      height="3"
                      viewBox="0 0 12 3"
                      fill="currentColor"
                    >
                      <circle cx="1.5" cy="1.5" r="1.5" />
                      <circle cx="6" cy="1.5" r="1.5" />
                      <circle cx="10.5" cy="1.5" r="1.5" />
                    </svg>
                  </button>
                  {isSettingsDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        backgroundColor: "#FFFFFF",
                        border: "2px solid #000000",
                        boxShadow: "4px 4px 0px 0px #000000",
                        minWidth: "160px",
                        zIndex: 10,
                      }}
                    >
                      <button
                        onClick={() => {
                          setIsSettingsDropdownOpen(false);
                          setIsClubDetailsModalOpen(true);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "14px",
                          fontWeight: 300,
                          color: "#000000",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F5F5F5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        Club details
                      </button>
                      <button
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "14px",
                          fontWeight: 300,
                          color: "#000000",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F5F5F5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        onClick={() => {
                          setIsSettingsDropdownOpen(false);
                          setIsInviteModalOpen(true);
                        }}
                      >
                        Invite friends
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 12px",
                alignItems: "start",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#FFFFFF",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: 700 }}>{stats.riffCount}</span> riffs
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#FFFFFF",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span>{" "}
                pieces
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#FFFFFF",
                  margin: 0,
                }}
              >
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
              onAvatarClick={handleAvatarClick}
            />

            {clubDescription && (
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
                {clubDescription}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main content — max-width 1000px, centered */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        {/* Club frame — only shown when no banner image */}
        {!clubBannerImage && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#000000",
                  margin: 0,
                }}
              >
                {clubName}
              </h1>
              {isAdmin && (
                <div ref={settingsDropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setIsSettingsDropdownOpen((o) => !o)}
                    aria-label="Club settings"
                    style={{
                      background: "transparent",
                      border: "2px solid transparent",
                      cursor: "pointer",
                      padding: "4px 6px",
                      color: "#000000",
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                      opacity: 0.4,
                      transition:
                        "opacity 0.15s ease, background-color 0.15s ease, box-shadow 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.backgroundColor = "#01EFFC";
                      e.currentTarget.style.borderColor = "#000000";
                      e.currentTarget.style.boxShadow =
                        "3px 3px 0px 0px #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.4";
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <svg
                      width="12"
                      height="3"
                      viewBox="0 0 12 3"
                      fill="currentColor"
                    >
                      <circle cx="1.5" cy="1.5" r="1.5" />
                      <circle cx="6" cy="1.5" r="1.5" />
                      <circle cx="10.5" cy="1.5" r="1.5" />
                    </svg>
                  </button>
                  {isSettingsDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        backgroundColor: "#FFFFFF",
                        border: "2px solid #000000",
                        boxShadow: "4px 4px 0px 0px #000000",
                        minWidth: "160px",
                        zIndex: 10,
                      }}
                    >
                      <button
                        onClick={() => {
                          setIsSettingsDropdownOpen(false);
                          setIsClubDetailsModalOpen(true);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "14px",
                          fontWeight: 300,
                          color: "#000000",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F5F5F5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        Club details
                      </button>
                      <button
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "14px",
                          fontWeight: 300,
                          color: "#000000",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F5F5F5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        onClick={() => {
                          setIsSettingsDropdownOpen(false);
                          setIsInviteModalOpen(true);
                        }}
                      >
                        Invite friends
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 12px",
                alignItems: "start",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: 700 }}>{stats.riffCount}</span> riffs
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span>{" "}
                pieces
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
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
              onAvatarClick={handleAvatarClick}
            />

            {clubDescription && (
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
                {clubDescription}
              </p>
            )}
          </div>
        )}

        {/* Onboarding checklist for admin of new clubs */}
        {isAdmin && (
          <OnboardingChecklist
            clubId={club.id}
            hasMembers={club.members.length > 1}
            hasActiveRiff={!!activeRiff}
            hasCompletedRiff={completedRiffs.length > 0}
            onStartRiff={() => setIsCreateRiffModalOpen(true)}
            onInvite={() => setIsInviteModalOpen(true)}
          />
        )}

        {/* Current Riff section */}
        <div style={{ marginBottom: "48px" }}>
          {/* Section header — only show if there's an active riff OR user is admin */}
          {(activeRiff || isAdmin) && (
            <h2
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "20px",
                fontWeight: 300,
                color: "#000000",
                margin: "0 0 16px 0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Current Riff
            </h2>
          )}

          {activeRiff ? (
            <RiffCard
              riff={{
                id: activeRiff.id,
                title: activeRiff.title,
                prompt: activeRiff.prompt,
                deadline: activeRiff.deadline
                  ? new Date(activeRiff.deadline)
                  : null,
                createdAt: new Date(activeRiff.createdAt),
                participants: activeRiff.participants,
                pieces: activeRiff.pieces,
              }}
              isJoined={isJoined}
              hasSubmitted={hasSubmitted}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onJoin={handleJoinRiff}
              onReveal={() => setIsRevealModalOpen(true)}
            />
          ) : (
            <EmptyRiffState
              onStartNewRiff={() => setIsCreateRiffModalOpen(true)}
              isAdmin={isAdmin}
            />
          )}
        </div>

        {/* Ready to Reveal section */}
        {(() => {
          // Revealed riffs where user hasn't read all pieces yet
          const unfinishedRevealed = revealedRiffs.filter(
            (r) => (readCounts[r.id] || 0) < r.pieces.length
          );
          if (unfinishedRevealed.length === 0) return null;
          return (
            <div style={{ marginBottom: "48px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "20px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: "0 0 16px 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Ready to Reveal
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "32px",
                }}
              >
                {unfinishedRevealed.map((riff) => (
                  <ReadyToRevealCard
                    key={riff.id}
                    riff={riff}
                    readCount={readCounts[riff.id] || 0}
                    totalPieces={riff.pieces.length}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Completed Riffs section — includes COMPLETED + fully-read REVEALED riffs */}
        {(() => {
          // Revealed riffs where user has read all pieces
          const fullyReadRevealed = revealedRiffs.filter(
            (r) =>
              r.pieces.length > 0 && (readCounts[r.id] || 0) >= r.pieces.length
          );
          const allCompleted = [...completedRiffs, ...fullyReadRevealed];
          return allCompleted.length > 0;
        })() && (
          <div>
            <h2
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "20px",
                fontWeight: 300,
                color: "#000000",
                margin: "0 0 16px 0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Completed Riffs
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "40px",
                overflowX: "auto",
                paddingBottom: "16px",
              }}
            >
              {[
                ...completedRiffs,
                ...revealedRiffs.filter(
                  (r) =>
                    r.pieces.length > 0 &&
                    (readCounts[r.id] || 0) >= r.pieces.length
                ),
              ].map((riff) => (
                <CompletedRiffCard
                  key={riff.id}
                  riff={{
                    id: riff.id,
                    title: riff.title,
                    createdAt: new Date(riff.createdAt),
                    deadline: riff.deadline ? new Date(riff.deadline) : null,
                  }}
                  clubName={clubName}
                  pieces={riff.pieces.map((p) => ({
                    id: p.piece.id,
                    title: p.piece.title,
                    currentContent: p.piece.currentContent,
                    coverImage: p.piece.coverImage,
                    wordCount: p.piece.wordCount,
                  }))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .club-banner {
            height: 180px !important;
          }
        }
      `}</style>

      {/* Club Settings Modal */}
      <ClubSettingsModal
        isOpen={isClubDetailsModalOpen}
        onClose={() => setIsClubDetailsModalOpen(false)}
        onUpdated={(updated) => {
          setClubName(updated.name);
          setClubDescription(updated.description);
          setClubBannerImage(updated.bannerImage);
        }}
        club={{
          id: club.id,
          name: clubName,
          description: clubDescription,
          bannerImage: clubBannerImage,
        }}
      />

      {/* Invite Friends Modal */}
      {isInviteModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              padding: "32px",
              width: "100%",
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "20px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
                Invite friends
              </h2>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#000000",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <InviteOptions
              clubId={club.id}
              clubName={clubName}
              inviteUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/clubs/${club.id}/join`}
            />
          </div>
        </div>
      )}

      {/* Create Riff Modal */}
      <CreateRiffModal
        clubId={club.id}
        isOpen={isCreateRiffModalOpen}
        onClose={() => setIsCreateRiffModalOpen(false)}
        onCreated={handleRiffCreated}
      />

      {/* Reveal Confirm Modal */}
      {activeRiff && (
        <RevealConfirmModal
          isOpen={isRevealModalOpen}
          onClose={() => setIsRevealModalOpen(false)}
          onConfirm={handleRevealConfirm}
          isRevealing={isRevealing}
          riffTitle={activeRiff.title}
          waitingUsers={activeRiff.participants
            .filter(
              (p) =>
                !activeRiff.pieces.some(
                  (piece) => piece.piece.authorId === p.user.id
                )
            )
            .map((p) => ({
              id: p.user.id,
              name: p.user.name,
              avatarUrl: p.user.avatarUrl,
            }))}
          submittedCount={
            activeRiff.participants.filter((p) =>
              activeRiff.pieces.some(
                (piece) => piece.piece.authorId === p.user.id
              )
            ).length
          }
          totalParticipants={activeRiff.participants.length}
        />
      )}
    </div>
  );
}
