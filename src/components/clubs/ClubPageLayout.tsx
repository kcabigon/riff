"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/clubs/NavBar";
import AvatarStack from "@/components/shared/AvatarStack";
import RiffCard from "@/components/riffs/RiffCard";
import EmptyRiffState from "@/components/riffs/EmptyRiffState";
import CompletedRiffCard from "@/components/riffs/CompletedRiffCard";
import CreateRiffModal from "@/components/riffs/CreateRiffModal";
import RevealConfirmModal from "@/components/riffs/RevealConfirmModal";
import ReadyToRevealCard from "@/components/riffs/ReadyToRevealCard";
import ClubSettingsModal from "@/components/clubs/ClubSettingsModal";
import HostMessageModal from "@/components/clubs/HostMessageModal";
import InviteOptions from "@/components/clubs/InviteOptions";
import CloseButton from "@/components/CloseButton";
import PrimaryButton from "@/components/PrimaryButton";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  getRiffDisplayTitle,
  getSubmittedPieces,
  hasUnreadPieces,
  isRiffFullyRead,
  getWaitingParticipants,
  getSubmittedParticipants,
} from "@/lib/riff-utils";
import WhatsNextModal, {
  type WhatsNextTrigger,
} from "@/components/shared/WhatsNextModal";

interface ClubMember {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

interface RiffPiece {
  submittedAt: Date | string | null;
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
  volumeNumber?: number | null;
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
  pastRevealedRiffs: Riff[];
  readCounts: Record<string, number>;
  completedRiffs: Riff[];
  stats: {
    riffCount: number;
    pieceCount: number;
    wordCount: number;
  };
  initialWelcome?: "host" | "member";
}

export default function ClubPageLayout({
  club,
  userClubs,
  currentUserId,
  isAdmin,
  activeRiff,
  revealedRiffs,
  pastRevealedRiffs,
  readCounts,
  completedRiffs,
  stats,
  initialWelcome,
}: ClubPageLayoutProps) {
  const router = useRouter();
  const [clubName, setClubName] = useState(club.name);
  const [clubDescription, setClubDescription] = useState(club.description);
  const [clubBannerImage, setClubBannerImage] = useState(club.bannerImage);
  const [isCreateRiffModalOpen, setIsCreateRiffModalOpen] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isClubDetailsModalOpen, setIsClubDetailsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isHostMessageModalOpen, setIsHostMessageModalOpen] = useState(false);
  const [currentActiveRiff, setCurrentActiveRiff] = useState<Riff | null>(
    activeRiff
  );
  const [whatsNextTrigger, setWhatsNextTrigger] =
    useState<WhatsNextTrigger | null>(() => {
      if (initialWelcome === "host") return "host_created_club";
      if (initialWelcome === "member") return "member_joined_club";
      return null;
    });
  const [newRiffId, setNewRiffId] = useState<string | null>(null);
  const handleAvatarClick = useProfileNavigation();
  const isMobile = useIsMobile();

  // After joining a riff, refresh the page to get updated state
  const handleJoinRiff = useCallback(() => {
    setWhatsNextTrigger("member_joined_riff");
    router.refresh();
  }, []);

  // After creating a riff, show the "what's next" modal then refresh
  const handleRiffCreated = useCallback((riffId: string) => {
    setIsCreateRiffModalOpen(false);
    setNewRiffId(riffId);
    setWhatsNextTrigger("host_started_riff");
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
  const hasDraft = activeRiff
    ? activeRiff.pieces.some((p) => p.piece.authorId === currentUserId)
    : false;
  const hasSubmitted = activeRiff
    ? activeRiff.pieces.some(
        (p) => p.piece.authorId === currentUserId && p.submittedAt !== null
      )
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

      {/* Banner — full width, 320px desktop / 200px mobile */}
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
          {/* Dark overlay + metadata — desktop only */}
          {!isMobile && (
            <>
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
                  maxWidth: "360px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
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
                    {clubName}
                  </h1>
                  {isAdmin && (
                    <Dropdown
                      trigger={
                        <button
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
                            e.currentTarget.style.backgroundColor =
                              "transparent";
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
                      }
                      items={
                        [
                          {
                            type: "action",
                            label: "Club details",
                            onClick: () => setIsClubDetailsModalOpen(true),
                          },
                          {
                            type: "action",
                            label: "Invite friends",
                            onClick: () => setIsInviteModalOpen(true),
                          },
                          { type: "divider" },
                          {
                            type: "action",
                            label: "Message members",
                            onClick: () => setIsHostMessageModalOpen(true),
                          },
                        ] as DropdownItem[]
                      }
                      align="left"
                    />
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
                    <span style={{ fontWeight: 700 }}>{stats.riffCount}</span>{" "}
                    riffs
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
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {clubDescription}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile metadata — shown below banner on small screens */}
      {clubBannerImage && isMobile && (
        <div
          style={{
            padding: "24px 24px 0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "28px",
                fontWeight: 400,
                color: "#000000",
                margin: 0,
              }}
            >
              {clubName}
            </h1>
            {isAdmin && (
              <Dropdown
                trigger={
                  <button
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
                }
                items={
                  [
                    {
                      type: "action",
                      label: "Club details",
                      onClick: () => setIsClubDetailsModalOpen(true),
                    },
                    {
                      type: "action",
                      label: "Invite friends",
                      onClick: () => setIsInviteModalOpen(true),
                    },
                    { type: "divider" },
                    {
                      type: "action",
                      label: "Message members",
                      onClick: () => setIsHostMessageModalOpen(true),
                    },
                  ] as DropdownItem[]
                }
                align="left"
              />
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
                fontSize: "14px",
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
                fontSize: "14px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
              }}
            >
              <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span> pieces
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
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
            size={40}
            showBorder={true}
            borderColor="#000000"
            borderWidth={2}
            onAvatarClick={handleAvatarClick}
          />

          {clubDescription && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "15px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                lineHeight: "1.4",
              }}
            >
              {clubDescription}
            </p>
          )}
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
                <Dropdown
                  trigger={
                    <button
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
                  }
                  items={
                    [
                      {
                        type: "action",
                        label: "Club details",
                        onClick: () => setIsClubDetailsModalOpen(true),
                      },
                      {
                        type: "action",
                        label: "Invite friends",
                        onClick: () => setIsInviteModalOpen(true),
                      },
                      { type: "divider" },
                      {
                        type: "action",
                        label: "Message members",
                        onClick: () => setIsHostMessageModalOpen(true),
                      },
                    ] as DropdownItem[]
                  }
                  align="left"
                />
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

        {/* Invite CTA — shown to host until at least one other member joins */}
        {isAdmin && club.members.length <= 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "48px",
            }}
          >
            <PrimaryButton
              onClick={() => setIsInviteModalOpen(true)}
              style={{ width: "auto" }}
            >
              Invite your crew
            </PrimaryButton>
          </div>
        )}

        {/* Current Read section — shown above Current Riff when there are unread revealed riffs */}
        {(() => {
          const unfinishedRevealed = revealedRiffs.filter((r) =>
            hasUnreadPieces(
              r.id,
              readCounts,
              getSubmittedPieces(r.pieces).length
            )
          );
          if (unfinishedRevealed.length === 0) return null;
          return (
            <div style={{ marginBottom: "48px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "24px",
                  fontWeight: 400,
                  color: "#000000",
                  margin: "0 0 16px 0",
                }}
              >
                Current Read
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
                    totalPieces={getSubmittedPieces(riff.pieces).length}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Current Riff section — hidden for members when there's a current read and no active riff */}
        {(() => {
          const hasCurrentRead = revealedRiffs.some((r) =>
            hasUnreadPieces(
              r.id,
              readCounts,
              getSubmittedPieces(r.pieces).length
            )
          );
          const showSection = activeRiff || isAdmin || !hasCurrentRead;
          if (!showSection) return null;

          const hostName =
            club.members.find((m) => m.user.id === club.adminId)?.user.name ??
            null;

          return (
            <div style={{ marginBottom: "48px" }}>
              {(activeRiff || isAdmin) && (
                <h2
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "#000000",
                    margin: "0 0 16px 0",
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
                    volumeNumber: activeRiff.volumeNumber,
                    status: activeRiff.status,
                    prompt: activeRiff.prompt,
                    deadline: activeRiff.deadline
                      ? new Date(activeRiff.deadline)
                      : null,
                    createdAt: new Date(activeRiff.createdAt),
                    participants: activeRiff.participants,
                    pieces: activeRiff.pieces,
                  }}
                  isJoined={isJoined}
                  hasDraft={hasDraft}
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
                  hostName={hostName}
                />
              )}
            </div>
          );
        })()}

        {/* Past Riffs section — includes COMPLETED + pre-join REVEALED + fully-read REVEALED riffs */}
        {(() => {
          const fullyReadRevealed = revealedRiffs.filter((r) =>
            isRiffFullyRead(
              r.id,
              readCounts,
              getSubmittedPieces(r.pieces).length
            )
          );
          const allPast = [
            ...completedRiffs,
            ...pastRevealedRiffs,
            ...fullyReadRevealed,
          ];
          return allPast.length > 0;
        })() && (
          <div>
            <h2
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "24px",
                fontWeight: 400,
                color: "#000000",
                margin: "0 0 16px 0",
              }}
            >
              Past Riffs
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
                ...pastRevealedRiffs,
                ...revealedRiffs.filter((r) =>
                  isRiffFullyRead(
                    r.id,
                    readCounts,
                    getSubmittedPieces(r.pieces).length
                  )
                ),
              ].map((riff) => (
                <CompletedRiffCard
                  key={riff.id}
                  riff={{
                    id: riff.id,
                    title: riff.title,
                    volumeNumber: riff.volumeNumber,
                    status: riff.status,
                    createdAt: new Date(riff.createdAt),
                    deadline: riff.deadline ? new Date(riff.deadline) : null,
                  }}
                  clubName={clubName}
                  pieces={getSubmittedPieces(riff.pieces).map((p) => ({
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
            height: 200px !important;
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
              <CloseButton onClick={() => setIsInviteModalOpen(false)} />
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
          riffTitle={getRiffDisplayTitle(activeRiff)}
          waitingUsers={getWaitingParticipants(
            activeRiff.participants,
            activeRiff.pieces
          ).map((p) => ({
            id: p.user.id,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
          }))}
          submittedCount={
            getSubmittedParticipants(activeRiff.participants, activeRiff.pieces)
              .length
          }
          totalParticipants={activeRiff.participants.length}
        />
      )}

      {/* Host Message Modal */}
      <HostMessageModal
        isOpen={isHostMessageModalOpen}
        onClose={() => setIsHostMessageModalOpen(false)}
        clubId={club.id}
        clubName={clubName}
        members={club.members.map((m) => m.user)}
        currentUserId={currentUserId}
      />

      {/* What's Next Modal */}
      {whatsNextTrigger && (
        <WhatsNextModal
          isOpen={true}
          onClose={() => {
            setWhatsNextTrigger(null);
            router.refresh();
          }}
          trigger={whatsNextTrigger}
          onCTAClick={
            whatsNextTrigger === "host_created_club"
              ? () => {
                  setWhatsNextTrigger(null);
                  setIsInviteModalOpen(true);
                }
              : whatsNextTrigger === "host_started_riff" && newRiffId
                ? () => {
                    setWhatsNextTrigger(null);
                    router.push(`/riffs/${newRiffId}`);
                  }
                : () => {
                    setWhatsNextTrigger(null);
                    router.refresh();
                  }
          }
        />
      )}
    </div>
  );
}
