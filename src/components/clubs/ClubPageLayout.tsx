"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/clubs/NavBar";
import AvatarStack from "@/components/shared/AvatarStack";
import MobileCardCarousel from "@/components/shared/MobileCardCarousel";
import HorizontalScrollRow from "@/components/shared/HorizontalScrollRow";
import ProgressCard from "@/components/riffs/ProgressCard";
import PieceCard from "@/components/riffs/PieceCard";
import DraftChoiceTrigger from "@/components/riffs/DraftChoiceTrigger";
import RevealRiffButton, {
  shouldShowReveal,
} from "@/components/riffs/RevealRiffButton";
import SectionHeading from "@/components/shared/SectionHeading";
import CreateRiffModal from "@/components/riffs/CreateRiffModal";
import EditRiffModal from "@/components/riffs/EditRiffModal";
import DeleteRiffConfirmModal from "@/components/riffs/DeleteRiffConfirmModal";
import RevealConfirmModal from "@/components/riffs/RevealConfirmModal";
import ClubSettingsModal from "@/components/clubs/ClubSettingsModal";
import ShareLinkOptions from "@/components/shared/ShareLinkOptions";
import CloseButton from "@/components/CloseButton";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import RiffMark from "@/components/shared/RiffMark";
import type { DropdownItem } from "@/components/shared/Dropdown";
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
  allPiecesSubmitted,
  daysUntil,
  formatDateLong,
  formatDateShort,
} from "@/lib/riff-utils";
import DeleteClubConfirmModal from "@/components/clubs/DeleteClubConfirmModal";
import LeaveClubConfirmModal from "@/components/clubs/LeaveClubConfirmModal";
import TransferHostModal from "@/components/clubs/TransferHostModal";
import AssignCoHostModal from "@/components/clubs/AssignCoHostModal";
import CadenceSettingsModal from "@/components/clubs/CadenceSettingsModal";
import ClubStatsRow from "@/components/clubs/ClubStatsRow";
import ClubCadenceLine from "@/components/clubs/ClubCadenceLine";
import RiffPromptEditor from "@/components/clubs/RiffPromptEditor";
import { isIntervalCadence, type CadenceValue } from "@/lib/cadence";

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
    // Plain-text preview, truncated to 500 chars — only populated for the
    // viewer's own piece (see page.tsx's serializer); "" for everyone else's,
    // since ProgressCard fakes their blurred preview from wordCount alone.
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
  // Stands in for the reveal date once a riff is REVEALED — the same proxy
  // page.tsx (Current Read vs Past Riffs split) and the riff page header use.
  updatedAt: string;
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
    cadence: CadenceValue;
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
  newCommentCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  completedRiffs: Riff[];
  stats: {
    riffCount: number;
    pieceCount: number;
    wordCount: number;
  };
  predictedVolumeNumber?: number;
  hasStandaloneDrafts: boolean;
}

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

// Current Riff grid only — same tiering as `sortedParticipants` (submitted
// → in-progress → not-started, matching the individual riff page's grid),
// but with the viewer's own card always pulled to the front regardless of
// their own progress.
const sortedByProgress = (
  participants: RiffParticipant[],
  authorPieces: Record<
    string,
    RiffPiece["piece"] & {
      submittedAt: string | null;
    }
  >,
  currentUserId: string
) => {
  const sorted = sortedParticipants(participants, authorPieces);
  const ownIndex = sorted.findIndex((p) => p.user.id === currentUserId);
  if (ownIndex > 0) {
    const [own] = sorted.splice(ownIndex, 1);
    sorted.unshift(own);
  }
  return sorted;
};

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
  newCommentCounts,
  commentCounts,
  completedRiffs,
  stats,
  predictedVolumeNumber,
  hasStandaloneDrafts,
}: ClubPageLayoutProps) {
  const router = useRouter();
  const [clubName, setClubName] = useState(club.name);
  const [clubDescription, setClubDescription] = useState(club.description);
  const [clubBannerImage, setClubBannerImage] = useState(club.bannerImage);
  const [clubCadence, setClubCadence] = useState(club.cadence);
  const [isCadenceModalOpen, setIsCadenceModalOpen] = useState(false);
  const [isCreateRiffModalOpen, setIsCreateRiffModalOpen] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isEditRiffModalOpen, setIsEditRiffModalOpen] = useState(false);
  const [isDeleteRiffModalOpen, setIsDeleteRiffModalOpen] = useState(false);
  const { revealRiff, isRevealing } = useRevealRiff();
  const [isClubDetailsModalOpen, setIsClubDetailsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteClubModalOpen, setIsDeleteClubModalOpen] = useState(false);
  const [isLeaveClubModalOpen, setIsLeaveClubModalOpen] = useState(false);
  const [isTransferHostModalOpen, setIsTransferHostModalOpen] = useState(false);
  const [isAssignCoHostModalOpen, setIsAssignCoHostModalOpen] = useState(false);
  const handleAvatarClick = useProfileNavigation();
  const isMobile = useIsMobile();

  const isCoHost = club.moderatorId === currentUserId;

  // The cadence line under the club name opens the same settings as the menu,
  // for host and co-host only — it's how a club runs, so it's one tap away.
  const openCadenceSettings =
    isAdmin || isCoHost ? () => setIsCadenceModalOpen(true) : undefined;

  const adminMenuItems = [
    {
      type: "action" as const,
      label: "Club details",
      onClick: () => setIsClubDetailsModalOpen(true),
    },
    {
      type: "action" as const,
      label: "Riff cadence",
      onClick: () => setIsCadenceModalOpen(true),
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
      label: "Riff cadence",
      onClick: () => setIsCadenceModalOpen(true),
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

  // Newest first: volume number when both have one, creation date otherwise.
  const newestFirst = (a: Riff, b: Riff) => {
    if (a.volumeNumber != null && b.volumeNumber != null) {
      return b.volumeNumber - a.volumeNumber;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };

  // Every revealed riff the user still has unread pieces in, newest first.
  const currentReadRiffs = revealedRiffs
    .filter(hasUnreadForUser)
    .sort(newestFirst);

  // Past Riffs — COMPLETED + pre-join REVEALED + fully-read REVEALED riffs,
  // excluding any with no submitted pieces (e.g. the sole submission was deleted).
  const pastRiffs = [
    ...completedRiffs,
    ...pastRevealedRiffs,
    ...revealedRiffs.filter(isFullyReadForUser),
  ]
    .filter((riff) => getSubmittedPieces(riff.pieces).length > 0)
    .sort(newestFirst);

  const handleRiffCreated = useCallback(() => {
    setIsCreateRiffModalOpen(false);
    router.refresh();
  }, [router]);

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
  const hasSubmitted = activeRiff
    ? activeRiff.pieces.some(
        (p) => p.piece.authorId === currentUserId && p.submittedAt !== null
      )
    : false;
  const deadlinePassed = activeRiff
    ? isPastDeadline(activeRiff.deadline)
    : false;
  const piecesAllSubmitted = activeRiff
    ? allPiecesSubmitted(activeRiff.participants, activeRiff.pieces)
    : false;

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
  // Every club member gets a slot the moment a riff opens, whether or not
  // they've started writing. A club riff arrives on the club's cadence rather
  // than being something you opt into, so an empty card is the honest state of
  // "this month is open to you" — and a grid full of them is a legible signal
  // both ways: to members that nobody has written yet, and to the host that
  // the club might want its cadence set to Pause. For a club member a
  // RiffParticipant row only ever appears as a side effect of picking
  // New/Attach draft, so there's no separate "join" step a card could be gated
  // on — and a cron-created riff may have no participant rows at all, since the
  // one automatic join fires on the DRAFT -> ACTIVE transition.
  //
  // The grid's own width already keys off club.members (desktopContentWidth
  // above), so the layout always assumed a card per member.
  //
  // A union rather than club.members alone: someone who has since left the club
  // but submitted to this riff keeps their card, and their piece with it.
  const activeParticipantsForGrid = activeRiff
    ? [
        ...activeRiff.participants,
        ...club.members.filter(
          (m) => !activeRiff.participants.some((p) => p.user.id === m.user.id)
        ),
      ]
    : [];
  const sortedActiveParticipants = activeRiff
    ? sortedByProgress(
        activeParticipantsForGrid,
        activeAuthorPieces,
        currentUserId
      )
    : [];

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
          // Hidden on an interval cadence even between volumes. The cron opens
          // the next riff, so offering the host a button to do it themselves
          // reads as "this is your job" when it isn't — and the gap it would
          // fill is at most one tick. Manual needs it, and Paused keeps it as
          // the only way back to a riff at all: the sweep deliberately won't
          // auto-create for a paused club.
          onNewRiff={
            (isAdmin || isCoHost) &&
            !activeRiff &&
            !isIntervalCadence(clubCadence)
              ? () => setIsCreateRiffModalOpen(true)
              : undefined
          }
        />
      </div>

      {/* Mobile header — overlaps the banner photo (negative margin pulls
          the photo up underneath it) instead of sitting as a separate
          panel. The photo box itself is untouched — same size/crop as
          desktop — only this header fades from solid black to transparent
          over its own bottom edge, revealing the unmodified photo beneath
          instead of resizing/recropping it. KEEP IN SYNC WITH:
          JoinClubClient.tsx */}
      {clubBannerImage && isMobile && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            marginBottom: "-64px",
            padding: "24px 24px 88px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background:
              "linear-gradient(to bottom, #000000 calc(100% - 64px), rgba(0, 0, 0, 0) 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "32px",
                fontWeight: 400,
                color: "#FFFFFF",
                margin: 0,
                flex: 1,
                minWidth: 0,
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

          <ClubCadenceLine
            cadence={clubCadence}
            showUnscheduled
            onClick={openCadenceSettings}
          />

          <AvatarStack
            users={club.members.map((m) => m.user)}
            size={40}
            borderColor="#FFFFFF"
            onAvatarClick={handleAvatarClick}
            onAddClick={
              isAdmin && memberCount === 1
                ? () => setIsInviteModalOpen(true)
                : undefined
            }
            style={{ overflowX: "auto" }}
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
              }}
            >
              {clubDescription}
            </p>
          )}

          <ClubStatsRow stats={stats} />
        </div>
      )}

      {/* Banner — full width, 320px desktop / 200px mobile — KEEP IN SYNC WITH: JoinClubClient.tsx (banner header layout, avatar sizes, maxWidth). Untouched by the mobile header above (it overlaps via negative margin, not by resizing this box) so the photo's crop matches desktop exactly. On desktop this always renders — falling back to a plain black bg (matching the black-bg convention used on mobile and on profile pages) when there's no uploaded banner — so every club gets the banner treatment instead of branching into a separate no-banner layout. Mobile still branches on whether a real banner was uploaded. */}
      {(clubBannerImage || !isMobile) && (
        <div
          className="club-banner"
          style={{
            width: "100%",
            // minHeight, not height: the header content is variable (a name
            // that wraps, an optional cadence line, a 4-line-clamped
            // description) and at 320px fixed the worst case overflowed a
            // box with no overflow handling, spilling over the nav and the
            // content below. Growing is the only option here that neither
            // clips nor truncates a club's own name.
            minHeight: "320px",
            // Vertical breathing room for the grown case. box-sizing is
            // border-box globally, so this sits inside the 320px floor —
            // short headers still render at exactly 320px, and only a header
            // taller than 240px pushes the banner past it. Horizontal
            // padding stays on the content column, which already has its own.
            padding: "40px 0",
            ...(clubBannerImage
              ? {
                  backgroundImage: `url(${clubBannerImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { backgroundColor: "#000000" }),
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Dark overlay + metadata — desktop only. Overlay only needed
              over a real photo; the no-banner fallback is already solid
              black. */}
          {!isMobile && (
            <>
              {clubBannerImage && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.66)",
                  }}
                />
              )}
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <h1
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "32px",
                      fontWeight: 400,
                      color: "#FFFFFF",
                      margin: 0,
                      flex: 1,
                      minWidth: 0,
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

                <ClubCadenceLine
                  cadence={clubCadence}
                  showUnscheduled
                  onClick={openCadenceSettings}
                />

                <AvatarStack
                  users={club.members.map((m) => m.user)}
                  size={48}
                  borderColor="#FFFFFF"
                  onAvatarClick={handleAvatarClick}
                  onAddClick={
                    isAdmin && memberCount === 1
                      ? () => setIsInviteModalOpen(true)
                      : undefined
                  }
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

                <ClubStatsRow stats={stats} />
              </div>
            </>
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
        {/* Club frame — mobile only, shown when no banner image has been
            uploaded. Desktop always gets the banner treatment now (falling
            back to a solid black background above), so this no-banner
            layout only exists for mobile. Breaks out of the page's padding
            to go full-bleed with a black band + white text/borders,
            matching the banner case's header zone — without it, mobile
            loses the banner overlay's visual separation between the club
            header and the current riff below it. KEEP IN SYNC WITH:
            JoinClubClient.tsx */}
        {!clubBannerImage && isMobile && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "48px",
              marginTop: "-32px",
              marginLeft: "-24px",
              marginRight: "-24px",
              paddingTop: "24px",
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingBottom: "24px",
              backgroundColor: "#000000",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#FFFFFF",
                  margin: 0,
                  flex: 1,
                  minWidth: 0,
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

            <ClubCadenceLine
              cadence={clubCadence}
              showUnscheduled
              onClick={openCadenceSettings}
            />

            <AvatarStack
              users={club.members.map((m) => m.user)}
              size={40}
              borderColor="#FFFFFF"
              onAvatarClick={handleAvatarClick}
              onAddClick={
                isAdmin && memberCount === 1
                  ? () => setIsInviteModalOpen(true)
                  : undefined
              }
              style={{ overflowX: "auto" }}
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
                  maxWidth: "600px",
                }}
              >
                {clubDescription}
              </p>
            )}

            <ClubStatsRow stats={stats} />
          </div>
        )}

        {/* Current Read section — revealed riffs the user hasn't fully read yet.
            Sits above Current Riff deliberately: when a cadence reveals one
            volume and opens the next a tick later, the pieces waiting to be read
            are the more immediate thing. */}
        {(() => {
          if (currentReadRiffs.length === 0) return null;

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
                {currentReadRiffs.map((riff) => {
                  const authorPieces = pieceByAuthor(riff);
                  // Unread pieces lead here instead of the viewer's own —
                  // stable sort preserves sortedParticipants' tier/recency
                  // order within each unread/read group.
                  const piecesToShow = sortedParticipants(
                    riff.participants,
                    authorPieces
                  )
                    .filter((p) => authorPieces[p.user.id]?.submittedAt)
                    .sort(
                      (a, b) =>
                        Number(!isPieceUnread(authorPieces[a.user.id])) -
                        Number(!isPieceUnread(authorPieces[b.user.id]))
                    );

                  const renderCard = (p: RiffParticipant) => {
                    const piece = authorPieces[p.user.id];
                    return (
                      <PieceCard
                        key={p.user.id}
                        piece={{
                          id: piece.id,
                          title: piece.title,
                          coverImage: piece.coverImage,
                          wordCount: piece.wordCount,
                          author: p.user,
                        }}
                        isRead={!isPieceUnread(piece)}
                        isOwnPiece={p.user.id === currentUserId}
                        onClick={() =>
                          router.push(`/read/${piece.id}?riff=${riff.id}`)
                        }
                      />
                    );
                  };

                  const totalComments = commentCounts[riff.id] ?? 0;

                  return (
                    <div key={riff.id}>
                      {/* Title + metadata sized to match Current Riff's
                          header. Comments over words: talk already happening
                          is the reason to open the riff page. */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          marginBottom: "24px",
                        }}
                      >
                        <RiffTitleLink
                          riffId={riff.id}
                          title={getRiffDisplayTitle(riff)}
                          size="large"
                        />
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "16px",
                            fontWeight: 300,
                            color: "#808080",
                            margin: 0,
                          }}
                        >
                          Revealed:{" "}
                          <span style={{ color: "#000000" }}>
                            {formatDateShort(riff.updatedAt)}
                          </span>
                          {/* Hidden at zero — "Comments: 0" makes a fresh
                              reveal look dead instead of new. */}
                          {totalComments > 0 && (
                            <>
                              {" · "}
                              Comments:{" "}
                              <span style={{ color: "#000000" }}>
                                {totalComments.toLocaleString()}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      {isMobile ? (
                        <MobileCardCarousel>
                          {piecesToShow.map(renderCard)}
                        </MobileCardCarousel>
                      ) : (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "24px",
                          }}
                        >
                          {piecesToShow.map(renderCard)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Current Riff section — hidden entirely when there's no active riff.
            It used to stay open for regular members to tell them the host would
            start the next one soon, which a cadence makes untrue: the cron
            opens it, not the host, and on a schedule nobody needs prompting
            about. With the start-a-riff CTA living in the nav bar, an empty
            section had nothing left to say to anyone. */}
        {(() => {
          if (!activeRiff) return null;

          const showReveal = shouldShowReveal({
            deadlinePassed,
            isJoined,
            hasSubmitted,
            piecesAllSubmitted,
            isAdmin: isAdmin || isCoHost,
            status: activeRiff.status,
          });

          // Same menu as the individual riff page's 3-dot (RiffPageLayout).
          // canDeleteRiff mirrors the riff page's stricter gate (club admin
          // or the riff's own creator — not just any co-host).
          const canDeleteRiff =
            isAdmin || activeRiff.creator.id === currentUserId;
          const riffMenuItems: DropdownItem[] = [
            {
              type: "action",
              label: "Edit riff",
              onClick: () => setIsEditRiffModalOpen(true),
            },
            // Looser than the RevealRiffButton's shouldShowReveal gate —
            // matches the standalone riff page's "Reveal now" menu item,
            // which only needs at least one submission, independent of
            // deadline/all-submitted.
            ...(activeRiff.status === "ACTIVE" &&
            getSubmittedPieces(activeRiff.pieces).length > 0
              ? [
                  {
                    type: "action" as const,
                    label: "Reveal now",
                    onClick: () => setIsRevealModalOpen(true),
                  },
                ]
              : []),
            ...(canDeleteRiff
              ? ([
                  { type: "divider" },
                  {
                    type: "action",
                    label: "Delete riff",
                    color: "#DC2626",
                    onClick: () => setIsDeleteRiffModalOpen(true),
                  },
                ] as DropdownItem[])
              : []),
          ];

          // Keyed on the prompt too, so an edit made through the Edit riff
          // modal (which refreshes the page) resets the editor's shown value.
          const promptEditor = (style: React.CSSProperties) => (
            <RiffPromptEditor
              key={`${activeRiff.id}:${activeRiff.prompt ?? ""}`}
              riffId={activeRiff.id}
              prompt={activeRiff.prompt}
              canEdit={isAdmin || isCoHost}
              onSaved={() => router.refresh()}
              style={style}
            />
          );

          return (
            <div style={{ marginBottom: "56px" }}>
              <SectionHeading text="CURRENT RIFF" color="#00FF66" width={121} />

              {/* Desktop stacks the prompt into the same column as the
                  title/days-left, right-aligning the CTA across from it —
                  mobile keeps title/days-left on their own row, with the
                  prompt as its own line below. */}
              {isMobile ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "16px",
                      flexWrap: "wrap",
                    }}
                  >
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
                          display: "inline-block",
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: "32px",
                          fontWeight: 400,
                          color: "#000000",
                          margin: 0,
                        }}
                      >
                        {getRiffDisplayTitle(activeRiff, predictedVolumeNumber)}
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {!deadlinePassed && activeRiff.deadline && (
                          <p
                            style={{
                              fontFamily: "var(--font-dm-sans)",
                              fontSize: "16px",
                              fontWeight: 300,
                              color: "#808080",
                              margin: 0,
                            }}
                          >
                            Deadline: {formatDateLong(activeRiff.deadline)}
                          </p>
                        )}
                        {!deadlinePassed && activeRiff.deadline && (
                          <span style={{ color: "#808080" }}>·</span>
                        )}
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "16px",
                            fontWeight: 300,
                            color: activeRiff.deadline ? "#DC2626" : "#808080",
                            margin: 0,
                          }}
                        >
                          {deadlinePassed
                            ? "Deadline passed"
                            : activeRiff.deadline
                              ? (() => {
                                  const days = daysUntil(
                                    new Date(activeRiff.deadline)
                                  );
                                  return `${days} ${days === 1 ? "day" : "days"} left`;
                                })()
                              : "No deadline"}
                        </p>
                        {(isAdmin || isCoHost) && (
                          <ThreeDotButton
                            variant="light"
                            items={riffMenuItems}
                            align="left"
                          />
                        )}
                      </div>
                    </div>

                    {showReveal && (
                      <RevealRiffButton
                        onClick={() => setIsRevealModalOpen(true)}
                      />
                    )}
                  </div>

                  {/* Prompt row — own line below. Capped to a readable
                      line length instead of spanning the full (up to 1240px)
                      grid width. */}
                  {promptEditor({ marginTop: "24px" })}
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "24px",
                    marginTop: "16px",
                  }}
                >
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
                        display: "inline-block",
                        fontFamily: "var(--font-dm-serif-text)",
                        fontSize: "32px",
                        fontWeight: 400,
                        color: "#000000",
                        margin: 0,
                      }}
                    >
                      {getRiffDisplayTitle(activeRiff, predictedVolumeNumber)}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {!deadlinePassed && activeRiff.deadline && (
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "16px",
                            fontWeight: 300,
                            color: "#808080",
                            margin: 0,
                          }}
                        >
                          Deadline: {formatDateLong(activeRiff.deadline)}
                        </p>
                      )}
                      {!deadlinePassed && activeRiff.deadline && (
                        <span style={{ color: "#808080" }}>·</span>
                      )}
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "16px",
                          fontWeight: 300,
                          color: activeRiff.deadline ? "#DC2626" : "#808080",
                          margin: 0,
                        }}
                      >
                        {deadlinePassed
                          ? "Deadline passed"
                          : activeRiff.deadline
                            ? (() => {
                                const days = daysUntil(
                                  new Date(activeRiff.deadline)
                                );
                                return `${days} ${days === 1 ? "day" : "days"} left`;
                              })()
                            : "No deadline"}
                      </p>
                      {(isAdmin || isCoHost) && (
                        <ThreeDotButton
                          variant="light"
                          items={riffMenuItems}
                          align="left"
                        />
                      )}
                    </div>
                    {promptEditor({ marginTop: "20px" })}
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {showReveal && (
                      <RevealRiffButton
                        onClick={() => setIsRevealModalOpen(true)}
                      />
                    )}
                  </div>
                </div>
              )}

              {(() => {
                // Own card always leads (sortedActiveParticipants
                // guarantees it), whether not-started, in-progress, or
                // submitted — this is the single card-render path shared
                // by both the mobile carousel and the desktop grid below.
                const renderCard = (p: RiffParticipant) => {
                  const piece = activeAuthorPieces[p.user.id] ?? null;
                  const isOwnUser = p.user.id === currentUserId;
                  const isOwnDraft =
                    isOwnUser && piece && piece.submittedAt === null;
                  const isOwnNotStarted = isOwnUser && !piece;

                  if (isOwnNotStarted) {
                    return (
                      <DraftChoiceTrigger
                        key={p.user.id}
                        riffId={activeRiff.id}
                        hasStandaloneDrafts={hasStandaloneDrafts}
                        renderTrigger={(onClick) => (
                          <ProgressCard
                            user={p.user}
                            piece={null}
                            onClick={onClick}
                          />
                        )}
                      />
                    );
                  }

                  return (
                    <ProgressCard
                      key={p.user.id}
                      user={p.user}
                      piece={piece}
                      onClick={
                        isOwnDraft
                          ? () => router.push(`/write/${piece.id}`)
                          : undefined
                      }
                    />
                  );
                };

                return isMobile ? (
                  <div style={{ marginTop: "48px" }}>
                    <MobileCardCarousel>
                      {sortedActiveParticipants.map(renderCard)}
                    </MobileCardCarousel>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "24px",
                      marginTop: "48px",
                    }}
                  >
                    {sortedActiveParticipants.map(renderCard)}
                  </div>
                );
              })()}
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
                // Own piece leads — stable sort preserves the existing
                // submitted-recency order for everyone else.
                const piecesToShow = sortedParticipants(
                  riff.participants,
                  authorPieces
                )
                  .filter((p) => authorPieces[p.user.id]?.submittedAt)
                  .sort(
                    (a, b) =>
                      Number(b.user.id === currentUserId) -
                      Number(a.user.id === currentUserId)
                  );

                const renderCard = (p: RiffParticipant) => {
                  const piece = authorPieces[p.user.id];
                  return (
                    <PieceCard
                      key={p.user.id}
                      piece={{
                        id: piece.id,
                        title: piece.title,
                        coverImage: piece.coverImage,
                        wordCount: piece.wordCount,
                        author: p.user,
                      }}
                      // Past Riffs is fully-read riffs only, by definition.
                      isRead={true}
                      isOwnPiece={p.user.id === currentUserId}
                      onClick={() =>
                        router.push(`/read/${piece.id}?riff=${riff.id}`)
                      }
                    />
                  );
                };

                const newComments = newCommentCounts[riff.id] ?? 0;

                const titleRow = (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: 0,
                    }}
                  >
                    <RiffTitleLink
                      riffId={riff.id}
                      title={getRiffDisplayTitle(riff)}
                      size="small"
                    />
                    {newComments > 0 && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{ flexShrink: 0 }}
                      >
                        <title>{`${newComments} new ${newComments === 1 ? "comment" : "comments"}`}</title>
                        <path
                          d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6l-3 3v-3H3a1 1 0 0 1-1-1V3z"
                          fill="#01EFFC"
                          stroke="#000000"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                );

                return (
                  <div key={riff.id}>
                    {isMobile ? (
                      <>
                        <div style={{ marginBottom: "12px" }}>{titleRow}</div>
                        <MobileCardCarousel>
                          {piecesToShow.map(renderCard)}
                        </MobileCardCarousel>
                      </>
                    ) : (
                      <HorizontalScrollRow header={titleRow}>
                        {piecesToShow.map((p) => (
                          <div
                            key={p.user.id}
                            style={{
                              width: `${desktopCardWidth}px`,
                              flexShrink: 0,
                            }}
                          >
                            {renderCard(p)}
                          </div>
                        ))}
                      </HorizontalScrollRow>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          /* min-height too, or the desktop minHeight would win and force the
             mobile photo to 320px. Nothing renders inside the banner on
             mobile — the header overlaps it via negative margin — so a fixed
             height is right here. */
          .club-banner {
            height: 200px !important;
            min-height: 200px !important;
          }
        }
        .riff-row-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #000000;
          text-decoration: none;
        }
        .riff-row-link:hover .riff-row-link-text {
          text-decoration: underline;
        }
        .riff-row-link:focus-visible {
          outline: 2px solid #00FF66;
          outline-offset: 2px;
        }
        .riff-row-link-mark {
          display: flex;
        }
        /* Hover re-writes the mark: each stroke pulls back and draws out
           again, top to bottom, like lines being written. */
        .riff-row-link-mark .riff-mark-row {
          transform-box: fill-box;
          transform-origin: left center;
        }
        .riff-row-link:hover .riff-mark-row {
          animation: riff-mark-write 0.45s ease-out both;
        }
        .riff-row-link:hover .riff-mark-row:nth-child(2) {
          animation-delay: 0.06s;
        }
        .riff-row-link:hover .riff-mark-row:nth-child(3) {
          animation-delay: 0.12s;
        }
        .riff-row-link:hover .riff-mark-row:nth-child(4) {
          animation-delay: 0.18s;
        }
        @keyframes riff-mark-write {
          0% { transform: scaleX(1); }
          35% { transform: scaleX(0.25); }
          100% { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .riff-row-link:hover .riff-mark-row {
            animation: none;
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

      <CadenceSettingsModal
        isOpen={isCadenceModalOpen}
        onClose={() => setIsCadenceModalOpen(false)}
        onUpdated={(cadence, riffOpened) => {
          setClubCadence(cadence);
          // Switching onto a rhythm can open a riff straight away.
          if (riffOpened) router.refresh();
        }}
        clubId={club.id}
        cadence={clubCadence}
        activeRiff={activeRiff}
      />

      <DeleteClubConfirmModal
        isOpen={isDeleteClubModalOpen}
        onClose={() => setIsDeleteClubModalOpen(false)}
        onDeleted={() => {
          const otherClub = userClubs.find((c) => c.id !== club.id);
          if (otherClub) {
            router.push(`/clubs/${otherClub.id}`);
          } else {
            router.push("/home");
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
            router.push("/home");
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
            <ShareLinkOptions
              url={`${typeof window !== "undefined" ? window.location.origin : ""}/clubs/${club.id}/join`}
              shareText={`Join ${clubName} on Riff!`}
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

      {/* Edit Riff Modal */}
      {activeRiff && isEditRiffModalOpen && (
        <EditRiffModal
          isOpen={isEditRiffModalOpen}
          onClose={() => setIsEditRiffModalOpen(false)}
          onUpdated={() => {
            setIsEditRiffModalOpen(false);
            router.refresh();
          }}
          riff={{
            id: activeRiff.id,
            title: activeRiff.title,
            prompt: activeRiff.prompt,
            deadline: activeRiff.deadline,
          }}
        />
      )}

      {/* Delete Riff Modal */}
      {activeRiff && isDeleteRiffModalOpen && (
        <DeleteRiffConfirmModal
          isOpen={isDeleteRiffModalOpen}
          onClose={() => setIsDeleteRiffModalOpen(false)}
          onDeleted={() => {
            setIsDeleteRiffModalOpen(false);
            router.refresh();
          }}
          riffId={activeRiff.id}
          riffTitle={getRiffDisplayTitle(activeRiff, predictedVolumeNumber)}
        />
      )}
    </div>
  );
}

// A riff row's title as a link to its riff page. The trailing Riff mark is
// always visible — a title that merely underlines on hover never told anyone
// the riff page (read-by strip, comment feed) was one click away — and it
// re-writes itself on hover.
function RiffTitleLink({
  riffId,
  title,
  size,
}: {
  riffId: string;
  title: string;
  size: "large" | "small";
}) {
  const Heading = size === "large" ? "h2" : "h3";
  return (
    <Heading
      style={{
        fontFamily: "var(--font-dm-serif-text)",
        fontSize: size === "large" ? "32px" : "20px",
        fontWeight: 400,
        margin: 0,
      }}
    >
      <Link href={`/riffs/${riffId}`} className="riff-row-link">
        <span className="riff-row-link-text">{title}</span>
        <span className="riff-row-link-mark" aria-hidden="true">
          <RiffMark width={size === "large" ? 24 : 16} />
        </span>
      </Link>
    </Heading>
  );
}
