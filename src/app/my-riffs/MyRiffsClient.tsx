"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/clubs/NavBar";
import RiffEventCard from "@/components/riffs/RiffEventCard";
import ReadyToRevealCard from "@/components/riffs/ReadyToRevealCard";
import CompletedRiffCard from "@/components/riffs/CompletedRiffCard";
import RevealConfirmModal from "@/components/riffs/RevealConfirmModal";
import FriendsRow from "@/components/riffs/FriendsRow";
import InviteFriendModal from "@/components/riffs/InviteFriendModal";
import PieceCard from "@/components/riffs/PieceCard";
import PublicShareIndicator from "@/components/riffs/PublicShareIndicator";
import DraftCard from "@/components/write/DraftCard";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import SectionHeading from "@/components/shared/SectionHeading";
import type { DropdownItem } from "@/components/shared/Dropdown";
import DeletePieceModal from "@/components/profile/DeletePieceModal";
import ShareModal, { PublicShare } from "@/components/profile/ShareModal";
import { useRevealRiff } from "@/hooks/useRevealRiff";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import MyRiffsEmptyState from "@/components/home/MyRiffsEmptyState";
import {
  getSubmittedPieces,
  getSubmittedParticipants,
  getWaitingParticipants,
  hasUnreadPieces,
  getRiffDisplayTitle,
  getPieceDisplayDate,
} from "@/lib/riff-utils";
import { formatSubmittedDate } from "@/lib/timeAgo";
import type { FriendSummary } from "@/lib/friends";

interface RiffPiece {
  submittedAt: string | null;
  piece: {
    id: string;
    title: string;
    authorId: string;
    coverImage?: string | null;
    wordCount: number;
  };
}

interface Riff {
  id: string;
  title: string | null;
  volumeNumber?: number | null;
  status: string;
  prompt?: string | null;
  deadline: string | null;
  createdAt: string;
  creatorId: string;
  club: {
    id: string;
    name: string;
    bannerImage: string | null;
    adminId: string;
    moderatorId: string | null;
  } | null; // null = clubless (open) riff
  participants: Array<{
    user: {
      id: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
  }>;
  pieces: RiffPiece[];
}

interface PieceRiffSummary {
  submittedAt: string | null;
  riff: {
    id: string;
    title: string | null;
    volumeNumber: number | null;
    status: string;
    deadline: string | null;
    club: { id: string; name: string } | null;
  };
}

interface WritingPiece {
  id: string;
  title: string;
  coverImage: string | null;
  preview: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  riffs: PieceRiffSummary[];
  isPublic: boolean;
  publicShareId: string | null;
}

interface MyRiffsClientProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  userClubs: Array<{ id: string; name: string }>;
  currentClub: { id: string; name: string } | null;
  riffs: Riff[];
  currentUserId: string;
  readCounts: Record<string, number>;
  predictedVolumeByClub: Record<string, number>;
  friends: FriendSummary[];
  pieces: WritingPiece[];
  joinableRiffs: Riff[];
}

function isFinished(piece: WritingPiece): boolean {
  return (
    piece.riffs.some((r) => r.submittedAt !== null) ||
    piece.publishedAt !== null
  );
}

// Mirrors the profile page's isRevealed check (ProfilePage's viewer-access
// clause is skipped — every piece here already belongs to the current user).
function isPieceRevealed(piece: WritingPiece): boolean {
  return (
    piece.publishedAt !== null ||
    piece.riffs.some(
      (r) => r.riff.status === "REVEALED" || r.riff.status === "COMPLETED"
    )
  );
}

function pieceLabel(
  piece: WritingPiece,
  predictedVolumeByClub: Record<string, number>
): string | undefined {
  if (piece.riffs.length === 0) return undefined;
  const { riff } = piece.riffs[0];
  const displayTitle = getRiffDisplayTitle(
    riff,
    riff.club ? predictedVolumeByClub[riff.club.id] : undefined
  );
  if (!riff.club) return displayTitle;
  return displayTitle ? `${riff.club.name} · ${displayTitle}` : riff.club.name;
}

function pieceDueDate(piece: WritingPiece): string | null {
  if (piece.riffs.length === 0) return null;
  return piece.riffs[0].riff.deadline;
}

// Fixed height + single-line truncation so the label row above every card
// (Drafts, Pieces, Past Riffs) takes up identical space whether it's a real
// club/riff name or a hidden placeholder — keeps club and non-club items in
// the same grid row aligned instead of the card shifting up/down.
const cardLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "12px",
  fontWeight: 300,
  lineHeight: "16px",
  height: "16px",
  color: "#808080",
  margin: "0 0 8px 0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const viewAllButtonStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "14px",
  fontWeight: 300,
  color: "#000000",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

const DRAFTS_CAP = 2;
const PIECES_CAP = 2;
const PAST_RIFFS_CAP = 2;

// Every section starts pinned to the 680px feed width for visual consistency.
// Drafts/Pieces/Past Riffs cap at 2 there; "View all" widens just that
// section to 1000px and switches its grid to 3 columns.
const FEED_WIDTH = 680;
const EXPANDED_WIDTH = 1000;

function SectionColumn({
  maxWidth,
  children,
}: {
  maxWidth: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        maxWidth: `${maxWidth}px`,
        width: "100%",
        margin: "0 auto",
        padding: "0 24px",
        boxSizing: "border-box",
        transition: "max-width 0.2s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function MyRiffsClient({
  user,
  userClubs,
  currentClub,
  riffs,
  currentUserId,
  readCounts,
  predictedVolumeByClub,
  friends,
  pieces,
  joinableRiffs,
}: MyRiffsClientProps) {
  const router = useRouter();
  const [allPieces, setAllPieces] = useState(pieces);
  const [allRiffs, setAllRiffs] = useState(riffs);
  // router.refresh() (join, reveal) delivers a fresh `riffs` prop — resync
  // local state to it so those flows still update Current/Unread/Past Riffs,
  // not just the optimistic detach/delete edits below.
  useEffect(() => setAllRiffs(riffs), [riffs]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [draftsExpanded, setDraftsExpanded] = useState(false);
  const [piecesExpanded, setPiecesExpanded] = useState(false);
  const [pastRiffsExpanded, setPastRiffsExpanded] = useState(false);
  const [revealRiffId, setRevealRiffId] = useState<string | null>(null);
  const { revealRiff, isRevealing } = useRevealRiff();
  const { createDraft, isCreating: isCreatingDraft } = useDraftCreation();

  const otherSubmittedCount = (riff: Riff) =>
    getSubmittedPieces(riff.pieces).filter(
      (p) => p.piece.authorId !== currentUserId
    ).length;

  const hasUnreadForUser = (riff: Riff) =>
    hasUnreadPieces(riff.id, readCounts, otherSubmittedCount(riff));

  // After joining a riff, refresh so it flips from "joinable" to "writing".
  const handleJoinRiff = () => {
    router.refresh();
  };

  const handleRevealConfirm = async () => {
    if (!revealRiffId) return;
    const ok = await revealRiff(revealRiffId);
    if (ok) {
      setRevealRiffId(null);
      router.refresh();
    }
  };

  // Club riffs: admin/co-host holds host powers. Clubless: the creator does.
  const isRiffAdmin = (riff: Riff) =>
    riff.club !== null
      ? riff.club.adminId === currentUserId ||
        riff.club.moderatorId === currentUserId
      : riff.creatorId === currentUserId;

  const currentRiffs = [
    ...allRiffs
      .filter((r) => r.status === "ACTIVE")
      .map((riff) => ({ riff, isJoined: true })),
    ...joinableRiffs.map((riff) => ({ riff, isJoined: false })),
  ];

  const revealTarget = currentRiffs.find(
    ({ riff }) => riff.id === revealRiffId
  )?.riff;
  const readingRiffs = allRiffs.filter(
    (r) => r.status === "REVEALED" && hasUnreadForUser(r)
  );
  const pastRiffs = allRiffs
    .filter(
      (r) =>
        getSubmittedPieces(r.pieces).length > 0 &&
        (r.status === "COMPLETED" ||
          (r.status === "REVEALED" && !hasUnreadForUser(r)))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const drafts = allPieces.filter((p) => !isFinished(p));
  const submittedPieces = allPieces.filter(isFinished);
  // Gate for the Friends section: show it once there's either an existing
  // friend to display, or a published/revealed piece to invite with —
  // drafts don't count. A user can have friends (via club/riff) with no
  // eligible piece yet — the Friends row still shows them, just without
  // the "+" tile (FriendsRow's canInvite prop, also driven by this flag).
  const hasRevealedPiece = allPieces.some(isPieceRevealed);
  const showFriendsSection = friends.length > 0 || hasRevealedPiece;
  // Whether the "Attach draft" option should show up on riff CTAs — a
  // draft that's never been attached to any riff. Computed once here from
  // data already in memory rather than re-fetched per card.
  const hasStandaloneDrafts = drafts.some((p) => p.riffs.length === 0);

  const visibleDrafts = draftsExpanded ? drafts : drafts.slice(0, DRAFTS_CAP);
  const visiblePieces = piecesExpanded
    ? submittedPieces
    : submittedPieces.slice(0, PIECES_CAP);
  const visiblePastRiffs = pastRiffsExpanded
    ? pastRiffs
    : pastRiffs.slice(0, PAST_RIFFS_CAP);

  const isEmpty =
    friends.length === 0 &&
    readingRiffs.length === 0 &&
    currentRiffs.length === 0 &&
    drafts.length === 0 &&
    submittedPieces.length === 0 &&
    pastRiffs.length === 0;

  const handleDeleted = (pieceId: string) => {
    setAllPieces((prev) => prev.filter((p) => p.id !== pieceId));
    setAllRiffs((prev) =>
      prev.map((r) => ({
        ...r,
        pieces: r.pieces.filter((p) => p.piece.id !== pieceId),
      }))
    );
  };

  const handleDetach = async (pieceId: string, riffId: string) => {
    try {
      const res = await fetch(`/api/riffs/${riffId}/pieces/${pieceId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Error detaching draft:", await res.text());
        return;
      }

      setAllPieces((prev) =>
        prev.map((p) =>
          p.id === pieceId
            ? { ...p, riffs: p.riffs.filter((r) => r.riff.id !== riffId) }
            : p
        )
      );
      setAllRiffs((prev) =>
        prev.map((r) =>
          r.id === riffId
            ? { ...r, pieces: r.pieces.filter((p) => p.piece.id !== pieceId) }
            : r
        )
      );
    } catch (err) {
      console.error("Error detaching draft:", err);
    }
  };

  const handleShareCreated = (pieceId: string, share: PublicShare) => {
    setAllPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, isPublic: true, publicShareId: share.id } : p
      )
    );
  };

  const handleShareRevoked = (pieceId: string) => {
    setAllPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, isPublic: false, publicShareId: null } : p
      )
    );
  };

  const renderPieceGrid = (
    list: WritingPiece[],
    variant: "draft" | "piece",
    expanded: boolean
  ) => (
    <div className={expanded ? "card-grid-expanded" : "card-grid-collapsed"}>
      {list.map((piece) => {
        const menuItems: DropdownItem[] = [
          ...(isPieceRevealed(piece)
            ? [
                {
                  type: "action" as const,
                  label: "Share",
                  onClick: () => setShareTarget(piece.id),
                },
              ]
            : []),
          {
            type: "action",
            label: "Edit",
            onClick: () => router.push(`/write/${piece.id}`),
          },
          ...(piece.riffs.length > 0 && !isPieceRevealed(piece)
            ? [
                {
                  type: "action" as const,
                  label: "Detach",
                  onClick: () => handleDetach(piece.id, piece.riffs[0].riff.id),
                },
              ]
            : []),
          { type: "divider" },
          {
            type: "action",
            label: "Delete",
            color: "#DC2626",
            onClick: () =>
              setDeleteTarget({ id: piece.id, title: piece.title }),
          },
        ];

        const label = pieceLabel(piece, predictedVolumeByClub);
        const dateLabel = getPieceDisplayDate(
          piece.publishedAt,
          piece.riffs.map((r) => r.submittedAt)
        );

        return (
          <div key={piece.id} style={{ minWidth: 0 }}>
            <p
              style={{
                ...cardLabelStyle,
                visibility: label ? "visible" : "hidden",
              }}
            >
              {label || " "}
            </p>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  zIndex: 3,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ThreeDotButton
                  variant={variant === "draft" ? "light" : "dark"}
                  align="right"
                  items={menuItems}
                />
              </div>
              {variant === "piece" && piece.isPublic && (
                <PublicShareIndicator pieceId={piece.id} />
              )}
              {variant === "draft" ? (
                <DraftCard
                  piece={{
                    id: piece.id,
                    title: piece.title,
                    preview: piece.preview,
                    wordCount: piece.wordCount,
                    createdAt: piece.createdAt,
                    dueDate: pieceDueDate(piece),
                  }}
                  onClick={() => router.push(`/write/${piece.id}`)}
                />
              ) : (
                <PieceCard
                  piece={{
                    id: piece.id,
                    title: piece.title || "Untitled",
                    coverImage: piece.coverImage,
                  }}
                  isRead={true}
                  label={dateLabel ? formatSubmittedDate(dateLabel) : undefined}
                  onClick={() =>
                    router.push(
                      isPieceRevealed(piece)
                        ? `/read/${piece.id}`
                        : `/write/${piece.id}`
                    )
                  }
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      <style>{`
        .card-grid-collapsed {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 639px) {
          .card-grid-collapsed { grid-template-columns: 1fr; }
        }
        .card-grid-expanded {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1023px) {
          .card-grid-expanded { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 639px) {
          .card-grid-expanded { grid-template-columns: 1fr; }
        }
      `}</style>

      {revealTarget && (
        <RevealConfirmModal
          isOpen={revealRiffId !== null}
          onClose={() => setRevealRiffId(null)}
          onConfirm={handleRevealConfirm}
          isRevealing={isRevealing}
          riffTitle={getRiffDisplayTitle(
            revealTarget,
            revealTarget.club
              ? predictedVolumeByClub[revealTarget.club.id]
              : undefined
          )}
          waitingUsers={getWaitingParticipants(
            revealTarget.participants,
            revealTarget.pieces
          ).map((p) => ({
            id: p.user.id,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
          }))}
          submittedCount={
            getSubmittedParticipants(
              revealTarget.participants,
              revealTarget.pieces
            ).length
          }
          totalParticipants={revealTarget.participants.length}
        />
      )}

      {showInviteModal && (
        <InviteFriendModal onClose={() => setShowInviteModal(false)} />
      )}

      {deleteTarget && (
        <DeletePieceModal
          pieceId={deleteTarget.id}
          pieceTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => handleDeleted(deleteTarget.id)}
        />
      )}

      {shareTarget &&
        (() => {
          const piece = allPieces.find((p) => p.id === shareTarget);
          if (!piece) return null;
          return (
            <ShareModal
              pieceId={piece.id}
              pieceTitle={piece.title}
              isRevealed={isPieceRevealed(piece)}
              existingShare={
                piece.publicShareId
                  ? {
                      id: piece.publicShareId,
                      shareType: "PUBLIC",
                      isPublic: true,
                    }
                  : null
              }
              onClose={() => setShareTarget(null)}
              onShareCreated={(share) => handleShareCreated(piece.id, share)}
              onShareRevoked={() => handleShareRevoked(piece.id)}
            />
          );
        })()}

      <NavBar
        user={user}
        clubs={userClubs}
        currentClub={currentClub}
        showCreateDropdown
      />

      {isEmpty ? (
        <MyRiffsEmptyState
          onStartWriting={() => createDraft()}
          isCreatingDraft={isCreatingDraft}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "48px",
            padding: "32px 0 64px",
          }}
        >
          {/* Friends — anyone you've shared a club or riff with, plus the
              "+" tile to invite someone new via a piece. Shown once there's
              either an existing friend to display or a revealed piece to
              invite with — not gated on friends.length alone, so the invite
              entry point is discoverable as soon as you publish your first
              piece, even with zero friends yet. */}
          {showFriendsSection && (
            <SectionColumn maxWidth={FEED_WIDTH}>
              <SectionHeading text="FRIENDS" color="#01EFFC" width={78} />
              <div style={{ marginTop: "16px" }}>
                <FriendsRow
                  friends={friends}
                  onInvite={() => setShowInviteModal(true)}
                  canInvite={hasRevealedPiece}
                />
              </div>
            </SectionColumn>
          )}

          {/* Unread — revealed riffs with pieces you haven't read yet. Full width
            of the page column (flexes with it — 602px on desktop, whatever's
            available on mobile) instead of a fixed grid-cell width, so the
            mosaic covers always fill the card regardless of piece count. */}
          {readingRiffs.length > 0 && (
            <SectionColumn maxWidth={FEED_WIDTH}>
              <SectionHeading text="UNREAD RIFFS" color="#FF6B35" width={121} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  marginTop: "16px",
                }}
              >
                {readingRiffs.map((riff) => (
                  <div key={riff.id}>
                    <p
                      style={{
                        ...cardLabelStyle,
                        visibility: riff.club ? "visible" : "hidden",
                      }}
                    >
                      {riff.club?.name || " "}
                    </p>
                    <ReadyToRevealCard
                      riff={riff}
                      readCount={readCounts[riff.id] || 0}
                      totalPieces={otherSubmittedCount(riff)}
                    />
                  </div>
                ))}
              </div>
            </SectionColumn>
          )}

          {/* Riffs — active riffs you're writing for, plus ones you can join */}
          {currentRiffs.length > 0 && (
            <SectionColumn maxWidth={FEED_WIDTH}>
              <SectionHeading
                text="CURRENT RIFFS"
                color="#00FF66"
                width={129}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  marginTop: "16px",
                }}
              >
                {currentRiffs.map(({ riff, isJoined }) => {
                  const hasSubmitted = riff.pieces.some(
                    (p) =>
                      p.piece.authorId === currentUserId &&
                      p.submittedAt !== null
                  );
                  const hasDraft = riff.pieces.some(
                    (p) => p.piece.authorId === currentUserId
                  );
                  return (
                    <RiffEventCard
                      key={riff.id}
                      riff={{
                        id: riff.id,
                        title: riff.title,
                        volumeNumber: riff.volumeNumber,
                        status: riff.status,
                        deadline: riff.deadline
                          ? new Date(riff.deadline)
                          : null,
                        participants: riff.participants,
                        pieces: riff.pieces,
                      }}
                      club={{
                        id: riff.club?.id ?? null,
                        name: riff.club?.name ?? "",
                        bannerImage: riff.club?.bannerImage ?? null,
                      }}
                      isClubless={!riff.club}
                      isJoined={isJoined}
                      hasDraft={hasDraft}
                      hasSubmitted={hasSubmitted}
                      hasStandaloneDrafts={hasStandaloneDrafts}
                      currentUserId={currentUserId}
                      isAdmin={isRiffAdmin(riff)}
                      onJoin={handleJoinRiff}
                      onReveal={() => setRevealRiffId(riff.id)}
                      predictedVolumeNumber={
                        riff.club
                          ? predictedVolumeByClub[riff.club.id]
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </SectionColumn>
          )}

          {/* Drafts — starts at feed width capped to 2, "View all" widens the
            section to the 1000px 3-column grid. */}
          {drafts.length > 0 && (
            <SectionColumn
              maxWidth={draftsExpanded ? EXPANDED_WIDTH : FEED_WIDTH}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <SectionHeading text="DRAFTS" color="#EECF01" width={74} />
                {drafts.length > DRAFTS_CAP && (
                  <button
                    onClick={() => setDraftsExpanded((prev) => !prev)}
                    style={viewAllButtonStyle}
                  >
                    {draftsExpanded ? "View less" : "View all"}
                  </button>
                )}
              </div>
              {renderPieceGrid(visibleDrafts, "draft", draftsExpanded)}
            </SectionColumn>
          )}

          {/* Pieces — same expand pattern as Drafts. */}
          {submittedPieces.length > 0 && (
            <SectionColumn
              maxWidth={piecesExpanded ? EXPANDED_WIDTH : FEED_WIDTH}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <SectionHeading text="PIECES" color="#C01582" width={68} />
                {submittedPieces.length > PIECES_CAP && (
                  <button
                    onClick={() => setPiecesExpanded((prev) => !prev)}
                    style={viewAllButtonStyle}
                  >
                    {piecesExpanded ? "View less" : "View all"}
                  </button>
                )}
              </div>
              {renderPieceGrid(visiblePieces, "piece", piecesExpanded)}
            </SectionColumn>
          )}

          {/* Past Riffs — completed, or revealed and fully read. Same expand
            pattern as Drafts/Pieces. */}
          {pastRiffs.length > 0 && (
            <SectionColumn
              maxWidth={pastRiffsExpanded ? EXPANDED_WIDTH : FEED_WIDTH}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <SectionHeading text="PAST RIFFS" color="#955CB5" width={96} />
                {pastRiffs.length > PAST_RIFFS_CAP && (
                  <button
                    onClick={() => setPastRiffsExpanded((prev) => !prev)}
                    style={viewAllButtonStyle}
                  >
                    {pastRiffsExpanded ? "View less" : "View all"}
                  </button>
                )}
              </div>
              <div
                className={
                  pastRiffsExpanded
                    ? "card-grid-expanded"
                    : "card-grid-collapsed"
                }
              >
                {visiblePastRiffs.map((riff) => (
                  <div key={riff.id} style={{ minWidth: 0 }}>
                    <p
                      style={{
                        ...cardLabelStyle,
                        visibility: riff.club ? "visible" : "hidden",
                      }}
                    >
                      {riff.club?.name || " "}
                    </p>
                    <CompletedRiffCard
                      riff={{
                        id: riff.id,
                        title: riff.title,
                        volumeNumber: riff.volumeNumber,
                        status: riff.status,
                        createdAt: new Date(riff.createdAt),
                        deadline: riff.deadline
                          ? new Date(riff.deadline)
                          : null,
                      }}
                      pieces={getSubmittedPieces(riff.pieces).map((p) => ({
                        id: p.piece.id,
                        title: p.piece.title,
                        coverImage: p.piece.coverImage,
                        wordCount: p.piece.wordCount,
                      }))}
                    />
                  </div>
                ))}
              </div>
            </SectionColumn>
          )}
        </div>
      )}
    </div>
  );
}
