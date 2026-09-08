"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/clubs/NavBar";
import AvatarStack from "@/components/shared/AvatarStack";
import EmptyRiffState from "@/components/riffs/EmptyRiffState";
import ProgressCard from "@/components/riffs/ProgressCard";
import RiffCTAButton from "@/components/riffs/RiffCTAButton";
import RevealRiffButton, {
  shouldShowReveal,
} from "@/components/riffs/RevealRiffButton";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import Tagline from "@/components/Tagline";
import CreateRiffModal from "@/components/riffs/CreateRiffModal";
import RevealConfirmModal from "@/components/riffs/RevealConfirmModal";
import ClubSettingsModal from "@/components/clubs/ClubSettingsModal";
import InviteOptions from "@/components/clubs/InviteOptions";
import CloseButton from "@/components/CloseButton";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useRevealRiff } from "@/hooks/useRevealRiff";
import {
  getRiffDisplayTitle,
  getSubmittedPieces,
  hasUnreadPieces,
  isRiffFullyRead,
  isPastDeadline,
  getWaitingParticipants,
  getSubmittedParticipants,
} from "@/lib/riff-utils";
import DeleteClubConfirmModal from "@/components/clubs/DeleteClubConfirmModal";
import LeaveClubConfirmModal from "@/components/clubs/LeaveClubConfirmModal";
import TransferHostModal from "@/components/clubs/TransferHostModal";
import AssignCoHostModal from "@/components/clubs/AssignCoHostModal";

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
    coverImage?: string | null;
    wordCount: number;
    createdAt: string;
    updatedAt: string;
    // Plain-text preview, truncated to 500 chars — populated for every
    // piece (see page.tsx's serializer), including other participants'
    // unrevealed drafts, which the club page blurs client-side.
    preview: string;
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
    moderatorId: string | null;
    members: ClubMember[];
  };
  userClubs: Array<{ id: string; name: string }>;
  currentUserId: string;
  isAdmin: boolean;
  activeRiff: Riff | null;
  revealedRiffs: Riff[];
  pastRevealedRiffs: Riff[];
  readCounts: Record<string, number>;
  readPieceIds: string[];
  completedRiffs: Riff[];
  stats: {
    riffCount: number;
    pieceCount: number;
    wordCount: number;
  };
  initialWelcome?: "host" | "member";
  predictedVolumeNumber?: number;
}

// Same tagline-heading treatment as the My Riffs page's section headers —
// used here for "CURRENT RIFF" / "PAST RIFFS" instead of a plain <h2>.
function SectionHeading({
  text,
  color,
  width,
}: {
  text: string;
  color: string;
  width: number;
}) {
  return (
    <Tagline
      text={text}
      color={color}
      width={width}
      fontSize={16}
      fontFamily="var(--font-dm-sans)"
      fontWeight={700}
      align="left"
      heightPadding={9}
    />
  );
}

// The date badge from RiffEventCard (white card, black border, thin red
// strip at the top, month + day) — reused here to show the current riff's
// real deadline next to its title.
function DeadlineBadge({ date }: { date: Date }) {
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();

  return (
    <div
      style={{
        flexShrink: 0,
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "2px 2px 0px 0px #000000",
        overflow: "hidden",
      }}
    >
      <div style={{ height: "8px", backgroundColor: "#DC2626" }} />
      <div
        style={{
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "11px",
            fontWeight: 700,
            color: "#808080",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {month}
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "22px",
            fontWeight: 400,
            color: "#000000",
          }}
        >
          {date.getDate()}
        </span>
      </div>
    </div>
  );
}

// Whole days remaining until the deadline, clamped at 0.
const daysUntilDeadline = (deadline: string): number => {
  const diffMs = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

// Groups a riff's pieces by author id for quick per-participant lookup.
// submittedAt is narrowed to string here — pieces reaching this client
// component are always pre-serialized by the server (see page.tsx).
const pieceByAuthor = (
  riff: Riff
): Record<
  string,
  RiffPiece["piece"] & {
    submittedAt: string | null;
  }
> =>
  Object.fromEntries(
    riff.pieces.map((pr) => [
      pr.piece.authorId,
      { ...pr.piece, submittedAt: pr.submittedAt as string | null },
    ])
  );

// Every participant gets a card — sort so submitted rises above in-progress
// above not-started, matching the individual riff page's ordering.
const sortedParticipants = (
  participants: RiffParticipant[],
  authorPieces: Record<
    string,
    RiffPiece["piece"] & {
      submittedAt: string | null;
    }
  >
) =>
  [...participants].sort((a, b) => {
    const pa = authorPieces[a.user.id];
    const pb = authorPieces[b.user.id];
    const tierA = !pa ? 2 : pa.submittedAt ? 0 : 1;
    const tierB = !pb ? 2 : pb.submittedAt ? 0 : 1;
    if (tierA !== tierB) return tierA - tierB;
    if (tierA === 0)
      return (
        new Date(pb.submittedAt!).getTime() -
        new Date(pa.submittedAt!).getTime()
      );
    if (tierA === 1)
      return (
        new Date(pb.updatedAt).getTime() - new Date(pa.updatedAt).getTime()
      );
    return 0;
  });

// Current Riff grid only — the viewer's own card always leads, then
// whoever's furthest along (by word count) rises to the top, ties broken by
// most recent activity. Distinct from `sortedParticipants` (used for
// Current Read / Past Riffs, which group by submitted vs. not instead).
const sortedByProgress = (
  participants: RiffParticipant[],
  authorPieces: Record<
    string,
    RiffPiece["piece"] & {
      submittedAt: string | null;
    }
  >,
  currentUserId: string
) =>
  [...participants].sort((a, b) => {
    if (a.user.id === currentUserId) return -1;
    if (b.user.id === currentUserId) return 1;
    const pa = authorPieces[a.user.id];
    const pb = authorPieces[b.user.id];
    const wcA = pa?.wordCount ?? 0;
    const wcB = pb?.wordCount ?? 0;
    if (wcA !== wcB) return wcB - wcA;
    const timeA = pa ? new Date(pa.updatedAt).getTime() : 0;
    const timeB = pb ? new Date(pb.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

export default function ClubPageLayout({
  club,
  userClubs,
  currentUserId,
  isAdmin,
  activeRiff,
  revealedRiffs,
  pastRevealedRiffs,
  readCounts,
  readPieceIds,
  completedRiffs,
  stats,
  initialWelcome,
  predictedVolumeNumber,
}: ClubPageLayoutProps) {
  const router = useRouter();
  const [clubName, setClubName] = useState(club.name);
  const [clubDescription, setClubDescription] = useState(club.description);
  const [clubBannerImage, setClubBannerImage] = useState(club.bannerImage);
  const [isCreateRiffModalOpen, setIsCreateRiffModalOpen] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const { revealRiff, isRevealing } = useRevealRiff();
  const { createDraft } = useDraftCreation();
  const [isClubDetailsModalOpen, setIsClubDetailsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteClubModalOpen, setIsDeleteClubModalOpen] = useState(false);
  const [isLeaveClubModalOpen, setIsLeaveClubModalOpen] = useState(false);
  const [isTransferHostModalOpen, setIsTransferHostModalOpen] = useState(false);
  const [isAssignCoHostModalOpen, setIsAssignCoHostModalOpen] = useState(false);
  const [currentActiveRiff, setCurrentActiveRiff] = useState<Riff | null>(
    activeRiff
  );
  const handleAvatarClick = useProfileNavigation();
  const isMobile = useIsMobile();

  const isCoHost = club.moderatorId === currentUserId;

  const adminMenuItems = [
    {
      type: "action" as const,
      label: "Club details",
      onClick: () => setIsClubDetailsModalOpen(true),
    },
    {
      type: "action" as const,
      label: "Invite friends",
      onClick: () => setIsInviteModalOpen(true),
    },
    {
      type: "action" as const,
      label: "Assign co-host",
      onClick: () => setIsAssignCoHostModalOpen(true),
    },
    { type: "divider" as const },
    {
      type: "action" as const,
      label: "Transfer host",
      color: "#DC2626",
      onClick: () => setIsTransferHostModalOpen(true),
    },
    {
      type: "action" as const,
      label: "Delete club",
      color: "#DC2626",
      onClick: () => setIsDeleteClubModalOpen(true),
    },
  ];

  const coHostMenuItems = [
    {
      type: "action" as const,
      label: "Club details",
      onClick: () => setIsClubDetailsModalOpen(true),
    },
    {
      type: "action" as const,
      label: "Invite friends",
      onClick: () => setIsInviteModalOpen(true),
    },
    { type: "divider" as const },
    {
      type: "action" as const,
      label: "Leave club",
      color: "#DC2626",
      onClick: () => setIsLeaveClubModalOpen(true),
    },
  ];

  const memberMenuItems = [
    {
      type: "action" as const,
      label: "Leave club",
      color: "#DC2626",
      onClick: () => setIsLeaveClubModalOpen(true),
    },
  ];

  // Returns the count of submitted pieces authored by someone other than the current user.
  // Used to determine read progress — own pieces are never "unread" and don't need to be read.
  const otherSubmittedCount = (riff: Riff) =>
    getSubmittedPieces(riff.pieces).filter(
      (p) => p.piece.authorId !== currentUserId
    ).length;

  // A riff is fully read when the user has read every friend's piece.
  // Special case: if the user is the sole submitter there are no friend pieces to read —
  // treat as done as long as at least one piece exists (avoids the submittedCount=0 guard
  // in isRiffFullyRead incorrectly hiding the riff from Past Riffs).
  const isFullyReadForUser = (riff: Riff) => {
    const others = otherSubmittedCount(riff);
    if (others === 0) return getSubmittedPieces(riff.pieces).length > 0;
    return isRiffFullyRead(riff.id, readCounts, others);
  };

  const hasUnreadForUser = (riff: Riff) =>
    hasUnreadPieces(riff.id, readCounts, otherSubmittedCount(riff));

  // A piece is unread when it's someone else's submitted work the current
  // user hasn't opened yet — drives the per-card "Unread" badge.
  const isPieceUnread = (piece: { id: string; authorId: string }) =>
    piece.authorId !== currentUserId && !readPieceIds.includes(piece.id);

  // Past Riffs — COMPLETED + pre-join REVEALED + fully-read REVEALED riffs,
  // excluding any with no submitted pieces (e.g. the sole submission was deleted).
  const pastRiffs = [
    ...completedRiffs,
    ...pastRevealedRiffs,
    ...revealedRiffs.filter(isFullyReadForUser),
  ]
    .filter((riff) => getSubmittedPieces(riff.pieces).length > 0)
    .sort((a, b) => {
      if (a.volumeNumber != null && b.volumeNumber != null) {
        return b.volumeNumber - a.volumeNumber;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleRiffCreated = useCallback((_riffId: string) => {
    setIsCreateRiffModalOpen(false);
    router.refresh();
  }, []);

  // Handle reveal confirmation
  const handleRevealConfirm = useCallback(async () => {
    if (!activeRiff) return;
    const ok = await revealRiff(activeRiff.id);
    if (ok) {
      setIsRevealModalOpen(false);
      router.refresh();
    }
  }, [activeRiff, revealRiff, router]);

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
  const existingPieceId = activeRiff
    ? (activeRiff.pieces.find((p) => p.piece.authorId === currentUserId)?.piece
        .id ?? null)
    : null;
  const deadlinePassed = activeRiff
    ? isPastDeadline(activeRiff.deadline)
    : false;
  const piecesAllSubmitted = activeRiff
    ? getSubmittedPieces(activeRiff.pieces).length >=
      activeRiff.participants.length
    : false;

  // Format word count with commas
  const formatNumber = (n: number): string => {
    return n.toLocaleString();
  };

  // Card-grid layout responsive to club size — sized so cards land close to
  // their natural ~280-300px width whether the club has 2, 3, or 4+ members,
  // instead of a fixed-width container stretching 2 cards across the row or
  // leaving a big empty gap.
  const memberCount = club.members.length;
  const desktopContentWidth =
    memberCount <= 2 ? 680 : memberCount === 3 ? 1000 : 1240;
  // Matches the width a card lands at inside the wrapping grid above, so
  // fixed-width cards in the horizontally-scrolling Past Riffs rows look the
  // same size as the Current Riff grid at the same club size.
  const desktopCardWidth =
    memberCount <= 2 ? 304 : memberCount === 3 ? 301 : 280;

  const activeAuthorPieces = activeRiff ? pieceByAuthor(activeRiff) : {};
  const sortedActiveParticipants = activeRiff
    ? sortedByProgress(
        activeRiff.participants,
        activeAuthorPieces,
        currentUserId
      )
    : [];

  // Mobile Current Riff: the user's own unsubmitted draft leads as a fixed,
  // clickable card, everyone else scrolls as a peek carousel below it. If
  // the user has no draft to lead with, they just take their normal sorted
  // spot in the carousel like on desktop.
  const ownUser = activeRiff?.participants.find(
    (p) => p.user.id === currentUserId
  )?.user;
  const ownActivePiece = activeAuthorPieces[currentUserId] ?? null;
  const ownDraftPiece =
    ownActivePiece && ownActivePiece.submittedAt === null
      ? ownActivePiece
      : null;
  const mobileActiveParticipants = ownDraftPiece
    ? sortedActiveParticipants.filter((p) => p.user.id !== currentUserId)
    : sortedActiveParticipants;

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
          onNewRiff={
            (isAdmin || isCoHost) && !activeRiff
              ? () => setIsCreateRiffModalOpen(true)
              : undefined
          }
        />
      </div>

      {/* Banner — full width, 320px desktop / 200px mobile — KEEP IN SYNC WITH: JoinClubClient.tsx (banner header layout, avatar sizes, maxWidth) */}
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
                style={
                  club.members.length > 9
                    ? {
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        alignItems: "flex-start",
                        width: "100%",
                        maxWidth: "1000px",
                        padding: "0 24px",
                      }
                    : {
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        alignItems: "flex-start",
                        maxWidth: "396px",
                      }
                }
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
                  <ThreeDotButton
                    variant="dark"
                    items={
                      isAdmin
                        ? adminMenuItems
                        : isCoHost
                          ? coHostMenuItems
                          : memberMenuItems
                    }
                    align="right"
                  />
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
                  borderColor="#FFFFFF"
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
                      maxWidth: "600px",
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
                fontSize: "32px",
                fontWeight: 400,
                color: "#000000",
                margin: 0,
              }}
            >
              {clubName}
            </h1>
            <ThreeDotButton
              variant="light"
              items={
                isAdmin
                  ? adminMenuItems
                  : isCoHost
                    ? coHostMenuItems
                    : memberMenuItems
              }
              align="right"
            />
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
              <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span> pieces
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
            size={40}
            onAvatarClick={handleAvatarClick}
            style={{ overflowX: "auto" }}
          />

          {clubDescription && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
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

      {/* Main content — width responsive to club size (680/1000/1240 for 2/3/4+ members), centered */}
      <div
        style={{
          maxWidth: `${desktopContentWidth}px`,
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
              <ThreeDotButton
                variant="light"
                items={
                  isAdmin
                    ? adminMenuItems
                    : isCoHost
                      ? coHostMenuItems
                      : memberMenuItems
                }
                align="right"
              />
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
              size={isMobile ? 40 : 48}
              onAvatarClick={handleAvatarClick}
              style={isMobile ? { overflowX: "auto" } : undefined}
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
                  maxWidth: "600px",
                }}
              >
                {clubDescription}
              </p>
            )}
          </div>
        )}

        {/* Current Riff section — hidden for members when there's a current read and no active riff */}
        {(() => {
          const hasCurrentRead = revealedRiffs.some(hasUnreadForUser);
          const showSection =
            activeRiff || isAdmin || isCoHost || !hasCurrentRead;
          if (!showSection) return null;

          const hostName =
            club.members.find((m) => m.user.id === club.adminId)?.user.name ??
            null;

          const showReveal = activeRiff
            ? shouldShowReveal({
                deadlinePassed,
                isJoined,
                hasSubmitted,
                piecesAllSubmitted,
                isAdmin: isAdmin || isCoHost,
                status: activeRiff.status,
              })
            : false;

          return (
            <div style={{ marginBottom: "56px" }}>
              <SectionHeading text="CURRENT RIFF" color="#00FF66" width={121} />

              {activeRiff ? (
                <>
                  {/* Badge-left, title-column-right, CTA-right — mirrors
                      RiffEventCard's top row from My Riffs. */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    {activeRiff.deadline && (
                      <DeadlineBadge date={new Date(activeRiff.deadline)} />
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: "24px",
                          fontWeight: 400,
                          color: "#000000",
                          margin: 0,
                        }}
                      >
                        {getRiffDisplayTitle(activeRiff, predictedVolumeNumber)}
                      </h2>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "14px",
                          fontWeight: 300,
                          color: deadlinePassed ? "#DC2626" : "#808080",
                          margin: 0,
                        }}
                      >
                        {deadlinePassed
                          ? "Deadline passed"
                          : activeRiff.deadline
                            ? (() => {
                                const days = daysUntilDeadline(
                                  activeRiff.deadline
                                );
                                return `${days} ${days === 1 ? "day" : "days"} left`;
                              })()
                            : "No deadline"}
                      </p>
                    </div>

                    {showReveal ? (
                      <RevealRiffButton
                        onClick={() => setIsRevealModalOpen(true)}
                      />
                    ) : (
                      // Once the user has joined, the clickable card in the
                      // grid below covers both starting and continuing a
                      // draft — this button only needs to cover joining.
                      !isJoined && (
                        <RiffCTAButton
                          riffId={activeRiff.id}
                          isJoined={isJoined}
                          hasDraft={hasDraft}
                          hasSubmitted={hasSubmitted}
                          existingPieceId={existingPieceId}
                        />
                      )
                    )}
                  </div>

                  {/* Prompt row — own line below, when the riff was created with one.
                      Capped to a readable line length instead of spanning the
                      full (up to 1240px) grid width. */}
                  {activeRiff.prompt && (
                    <div
                      style={{
                        marginTop: "16px",
                        borderLeft: "2px solid #000000",
                        paddingLeft: "16px",
                        maxWidth: "780px",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "16px",
                          fontWeight: 300,
                          color: "#000000",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {activeRiff.prompt}
                      </p>
                    </div>
                  )}

                  {isMobile ? (
                    <div style={{ marginTop: "24px" }}>
                      {ownDraftPiece && ownUser && (
                        <div style={{ marginBottom: "16px" }}>
                          <ProgressCard
                            user={ownUser}
                            piece={ownDraftPiece}
                            variant="draft"
                            onClick={() =>
                              router.push(`/write/${ownDraftPiece.id}`)
                            }
                          />
                        </div>
                      )}
                      {mobileActiveParticipants.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            overflowX: "auto",
                            scrollSnapType: "x mandatory",
                            paddingBottom: "8px",
                          }}
                        >
                          {mobileActiveParticipants.map((p) => {
                            const piece = activeAuthorPieces[p.user.id] ?? null;
                            const isOwnNotStarted =
                              p.user.id === currentUserId && !piece;

                            return (
                              <div
                                key={p.user.id}
                                style={{
                                  width: "80%",
                                  flexShrink: 0,
                                  scrollSnapAlign: "start",
                                }}
                              >
                                <ProgressCard
                                  user={p.user}
                                  piece={piece}
                                  variant="draft"
                                  onClick={
                                    isOwnNotStarted
                                      ? () => createDraft(activeRiff.id)
                                      : undefined
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "24px",
                        marginTop: "24px",
                      }}
                    >
                      {sortedActiveParticipants.map((p) => {
                        const piece = activeAuthorPieces[p.user.id] ?? null;
                        const isOwnUser = p.user.id === currentUserId;
                        const isOwnDraft =
                          isOwnUser && piece && piece.submittedAt === null;
                        const isOwnNotStarted = isOwnUser && !piece;

                        return (
                          <ProgressCard
                            key={p.user.id}
                            user={p.user}
                            piece={piece}
                            variant="draft"
                            onClick={
                              isOwnDraft
                                ? () => router.push(`/write/${piece.id}`)
                                : isOwnNotStarted
                                  ? () => createDraft(activeRiff.id)
                                  : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ marginTop: "24px" }}>
                  <EmptyRiffState
                    onStartNewRiff={() => setIsCreateRiffModalOpen(true)}
                    isAdmin={isAdmin || isCoHost}
                    hostName={hostName}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Current Read section — revealed riffs the user hasn't fully read yet */}
        {(() => {
          const unfinishedRevealed = revealedRiffs.filter(hasUnreadForUser);
          if (unfinishedRevealed.length === 0) return null;

          return (
            <div style={{ marginBottom: "56px" }}>
              <SectionHeading text="CURRENT READ" color="#01EFFC" width={140} />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "32px",
                  marginTop: "16px",
                }}
              >
                {unfinishedRevealed.map((riff) => {
                  const authorPieces = pieceByAuthor(riff);
                  const piecesToShow = sortedParticipants(
                    riff.participants,
                    authorPieces
                  ).filter((p) => authorPieces[p.user.id]?.submittedAt);

                  return (
                    <div key={riff.id}>
                      <h3
                        onClick={() => router.push(`/riffs/${riff.id}`)}
                        className="riff-row-link"
                        style={{
                          cursor: "pointer",
                          display: "inline-block",
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: "20px",
                          fontWeight: 400,
                          color: "#000000",
                          margin: "0 0 12px 0",
                        }}
                      >
                        {getRiffDisplayTitle(riff)}
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "24px",
                        }}
                      >
                        {piecesToShow.map((p) => (
                          <ProgressCard
                            key={p.user.id}
                            user={p.user}
                            piece={authorPieces[p.user.id]}
                            revealed={true}
                            showDate={false}
                            isUnread={isPieceUnread(authorPieces[p.user.id])}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Past Riffs section — includes COMPLETED + pre-join REVEALED + fully-read REVEALED riffs */}
        {pastRiffs.length > 0 && (
          <div>
            <SectionHeading text="PAST RIFFS" color="#955CB5" width={96} />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "32px",
                marginTop: "16px",
              }}
            >
              {pastRiffs.map((riff) => {
                const authorPieces = pieceByAuthor(riff);
                return (
                  <div key={riff.id}>
                    <h3
                      onClick={() => router.push(`/riffs/${riff.id}`)}
                      className="riff-row-link"
                      style={{
                        cursor: "pointer",
                        display: "inline-block",
                        fontFamily: "var(--font-dm-serif-text)",
                        fontSize: "20px",
                        fontWeight: 400,
                        color: "#000000",
                        margin: "0 0 12px 0",
                      }}
                    >
                      {getRiffDisplayTitle(riff)}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: isMobile ? "12px" : "24px",
                        overflowX: "auto",
                        scrollSnapType: isMobile ? "x mandatory" : undefined,
                        paddingBottom: "8px",
                      }}
                    >
                      {sortedParticipants(riff.participants, authorPieces)
                        .filter((p) => authorPieces[p.user.id]?.submittedAt)
                        .map((p) => (
                          <div
                            key={p.user.id}
                            style={{
                              width: isMobile ? "80%" : `${desktopCardWidth}px`,
                              flexShrink: 0,
                              scrollSnapAlign: isMobile ? "start" : undefined,
                            }}
                          >
                            <ProgressCard
                              user={p.user}
                              piece={authorPieces[p.user.id]}
                              revealed={true}
                              showDate={false}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
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
        .riff-row-link:hover {
          text-decoration: underline;
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

      <DeleteClubConfirmModal
        isOpen={isDeleteClubModalOpen}
        onClose={() => setIsDeleteClubModalOpen(false)}
        onDeleted={() => {
          const otherClub = userClubs.find((c) => c.id !== club.id);
          if (otherClub) {
            router.push(`/clubs/${otherClub.id}`);
          } else {
            router.push("/my-riffs");
          }
        }}
        clubId={club.id}
        clubName={clubName}
      />

      <TransferHostModal
        isOpen={isTransferHostModalOpen}
        onClose={() => setIsTransferHostModalOpen(false)}
        onTransferred={() => router.refresh()}
        clubId={club.id}
        members={club.members
          .filter((m) => m.user.id !== currentUserId)
          .map((m) => ({ id: m.user.id, name: m.user.name }))}
      />

      <LeaveClubConfirmModal
        isOpen={isLeaveClubModalOpen}
        onClose={() => setIsLeaveClubModalOpen(false)}
        onLeft={() => {
          const otherClub = userClubs.find((c) => c.id !== club.id);
          if (otherClub) {
            router.push(`/clubs/${otherClub.id}`);
          } else {
            router.push("/my-riffs");
          }
        }}
        clubId={club.id}
        clubName={clubName}
        userId={currentUserId}
      />

      <AssignCoHostModal
        isOpen={isAssignCoHostModalOpen}
        onClose={() => setIsAssignCoHostModalOpen(false)}
        onUpdated={() => router.refresh()}
        clubId={club.id}
        currentCoHost={
          club.moderatorId
            ? (club.members.find((m) => m.user.id === club.moderatorId)?.user ??
              null)
            : null
        }
        members={club.members
          .filter(
            (m) => m.user.id !== currentUserId && m.user.id !== club.moderatorId
          )
          .map((m) => ({ id: m.user.id, name: m.user.name }))}
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
          riffTitle={getRiffDisplayTitle(activeRiff, predictedVolumeNumber)}
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
    </div>
  );
}
