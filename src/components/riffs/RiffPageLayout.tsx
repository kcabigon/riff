"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PieceCard from "./PieceCard";
import RevealConfirmModal from "./RevealConfirmModal";
import EditRiffModal from "./EditRiffModal";
import DeleteRiffConfirmModal from "./DeleteRiffConfirmModal";
import Modal from "@/components/shared/Modal";
import ShareLinkOptions from "@/components/shared/ShareLinkOptions";
import NavBar from "@/components/clubs/NavBar";
import RevealCelebration from "./RevealCelebration";
import {
  getRiffDisplayTitle,
  getSubmittedPieces,
  allPiecesSubmitted,
  isPastDeadline,
  formatDateShort,
  formatDateLong,
  daysUntil,
  getSubmittedParticipants,
  getWaitingParticipants,
  isAuthoredBy,
  type RiffContributor,
} from "@/lib/riff-utils";
import DraftChoiceTrigger from "@/components/riffs/DraftChoiceTrigger";
import RevealRiffButton, {
  shouldShowReveal,
} from "@/components/riffs/RevealRiffButton";
import ProgressCard from "@/components/riffs/ProgressCard";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import { useRevealRiff } from "@/hooks/useRevealRiff";
import type { DropdownItem } from "@/components/shared/Dropdown";
import ActivityFeed from "@/components/riffs/ActivityFeed";
import ReadByStrip from "@/components/riffs/ReadByStrip";
import PrimaryButton from "@/components/PrimaryButton";
import CTAButton from "@/components/CTAButton";
import Avatar from "@/components/shared/Avatar";

interface RiffPageLayoutProps {
  riff: {
    id: string;
    title: string | null;
    volumeNumber?: number | null;
    prompt: string | null;
    deadline: string | null;
    status: string;
    createdAt: string;
    updatedAt?: string;
    clubId: string | null;
    club: { id: string; name: string } | null;
    creator: {
      id: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
    participants: Array<{
      user: {
        id: string;
        name: string | null;
        username: string | null;
        avatarUrl: string | null;
      };
    }>;
    pieces: Array<{
      submittedAt: string | null;
      piece: {
        id: string;
        title: string;
        authorId: string;
        wordCount: number;
        coverImage?: string | null;
        updatedAt?: string;
        commentCount?: number;
        preview?: string;
        author?: {
          id: string;
          name: string | null;
          avatarUrl: string | null;
        };
      };
    }>;
  };
  currentUserId: string;
  isAdmin: boolean;
  canDeleteRiff?: boolean;
  isJoined: boolean;
  hasDraft: boolean;
  hasSubmitted: boolean;
  hasStandaloneDrafts: boolean;
  draftPieceId?: string | null;
  navUser: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  userClubs?: Array<{ id: string; name: string }>;
  readPieceIds?: string[];
  hasNewCommentsMap?: Record<string, boolean>;
  contributionData?: RiffContributor[];
  totalPieces?: number;
  onReveal?: () => void;
  hostFirstName?: string | null;
  isFirstReveal?: boolean;
  predictedVolumeNumber?: number;
}

export default function RiffPageLayout({
  riff,
  currentUserId,
  isAdmin,
  canDeleteRiff = isAdmin,
  isJoined: initialIsJoined,
  hasDraft,
  hasSubmitted,
  hasStandaloneDrafts,
  draftPieceId,
  navUser,
  userClubs = [],
  readPieceIds = [],
  hasNewCommentsMap = {},
  contributionData = [],
  totalPieces = 0,
  onReveal,
  hostFirstName,
  isFirstReveal = false,
  predictedVolumeNumber,
}: RiffPageLayoutProps) {
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const { revealRiff, isRevealing } = useRevealRiff();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [badgeMap, setBadgeMap] =
    useState<Record<string, boolean>>(hasNewCommentsMap);
  const router = useRouter();

  const markPieceCommentsRead = (pieceId: string) => {
    setBadgeMap((prev) => ({ ...prev, [pieceId]: false }));
    fetch(`/api/riffs/${riff.id}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pieceId }),
    }).catch(() => {});
  };

  const [markAllReadSignal, setMarkAllReadSignal] = useState(0);
  const markAllCommentsRead = () => {
    setBadgeMap({});
    setMarkAllReadSignal((n) => n + 1);
    fetch(`/api/riffs/${riff.id}/mark-read`, { method: "POST" }).catch(
      () => {}
    );
  };
  const hasUnreadComments = Object.values(badgeMap).some(Boolean);
  const deadlinePassed = isPastDeadline(riff.deadline);
  const piecesAllSubmitted = allPiecesSubmitted(riff.participants, riff.pieces);
  const submittedUsers = getSubmittedParticipants(
    riff.participants,
    riff.pieces
  );
  const waitingUsers = getWaitingParticipants(riff.participants, riff.pieces);

  const handleRevealClick = () => {
    if (onReveal) {
      onReveal();
    } else {
      setIsRevealModalOpen(true);
    }
  };

  const handleRevealConfirm = async () => {
    const ok = await revealRiff(riff.id);
    if (ok) {
      setIsRevealModalOpen(false);
      setShowCelebration(true);
      router.refresh();
    }
  };

  const totalWords = riff.pieces.reduce(
    (sum, p) => sum + (p.piece.wordCount || 0),
    0
  );
  // Independent of contributionData, which is filtered to members who've
  // read at least one piece (for the Read-by strip) — sourcing this from
  // the pieces directly means the heading total can't silently undercount
  // if someone's commentCount ever outpaced their readCount.
  const totalComments = riff.pieces.reduce(
    (sum, p) => sum + (p.piece.commentCount ?? 0),
    0
  );

  // The viewer always gets a slot in the progress grid, even before
  // joining — mirrors the same check inside the grid render below, hoisted
  // here so the page width can respond to it too.
  const viewerInParticipants = riff.participants.some(
    (p) => p.user.id === currentUserId
  );
  const participantCount = viewerInParticipants
    ? riff.participants.length
    : riff.participants.length + 1;

  // Main content width responsive to participant count, mirroring club
  // page's club-size tiering (680/1000/1240 for 2/3/4+) — grows as more
  // people join the riff instead of staying fixed.
  const desktopContentWidth =
    participantCount <= 2 ? 680 : participantCount === 3 ? 1000 : 1240;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Nav bar */}
      <NavBar
        user={navUser}
        clubs={userClubs}
        currentClub={
          riff.club ? { id: riff.club.id, name: riff.club.name } : undefined
        }
      />

      {/* Main content — width responsive to participant count (680/1000/1240
          for 2/3/4+ people), centered */}
      <div
        style={{
          maxWidth: `${desktopContentWidth}px`,
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        {/* Riff header */}
        <div
          className="riff-page-header"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          {/* Left — title, dates, prompt, participants */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Title & dates */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
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
                {getRiffDisplayTitle(riff, predictedVolumeNumber)}
              </h1>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color:
                      deadlinePassed && riff.status !== "REVEALED"
                        ? "#DC2626"
                        : "#808080",
                    margin: 0,
                  }}
                >
                  {deadlinePassed && riff.status !== "REVEALED" ? (
                    "Deadline passed"
                  ) : riff.status === "REVEALED" ? (
                    riff.updatedAt ? (
                      <>
                        Revealed:{" "}
                        <span style={{ color: "#000000" }}>
                          {formatDateShort(riff.updatedAt)}
                        </span>
                        {" · "}
                        Words:{" "}
                        <span style={{ color: "#000000" }}>
                          {totalWords.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      "Revealed"
                    )
                  ) : riff.deadline ? (
                    `Deadline: ${formatDateLong(riff.deadline)}`
                  ) : (
                    "No deadline"
                  )}
                </p>
                {!deadlinePassed &&
                  riff.status !== "REVEALED" &&
                  riff.deadline && <span style={{ color: "#808080" }}>·</span>}
                {!deadlinePassed &&
                  riff.status !== "REVEALED" &&
                  riff.deadline && (
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "16px",
                        fontWeight: 300,
                        color: "#DC2626",
                        margin: 0,
                      }}
                    >
                      {(() => {
                        const days = daysUntil(new Date(riff.deadline));
                        return `${days} ${days === 1 ? "day" : "days"} left`;
                      })()}
                    </p>
                  )}
                {isAdmin &&
                  riff.status !== "REVEALED" &&
                  (() => {
                    const items: DropdownItem[] = [
                      {
                        type: "action",
                        label: "Edit riff",
                        onClick: () => setIsEditModalOpen(true),
                      },
                      // Only clubless riffs are invited-by-link — club riffs
                      // invite people to the club itself, from the club page.
                      ...(!riff.club && riff.status === "ACTIVE"
                        ? [
                            {
                              type: "action" as const,
                              label: "Invite friends",
                              onClick: () => setIsInviteModalOpen(true),
                            },
                          ]
                        : []),
                      // Force-reveal only makes sense once someone has
                      // actually submitted something.
                      ...(riff.status === "ACTIVE" && totalPieces > 0
                        ? [
                            {
                              type: "action" as const,
                              label: "Reveal now",
                              onClick: handleRevealClick,
                            },
                          ]
                        : []),
                      ...(canDeleteRiff
                        ? [
                            { type: "divider" as const },
                            {
                              type: "action" as const,
                              label: "Delete riff",
                              color: "#DC2626",
                              onClick: () => setIsDeleteModalOpen(true),
                            },
                          ]
                        : []),
                    ];
                    return (
                      <ThreeDotButton
                        variant="light"
                        items={items}
                        align="left"
                      />
                    );
                  })()}
              </div>
            </div>

            {/* Hosted by (clubless riffs only) + prompt — shared accent border,
                since the prompt is effectively a note from the host. */}
            {(!riff.club || riff.prompt) && (
              <div
                style={{
                  borderLeft: "2px solid #000000",
                  paddingLeft: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {!riff.club && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Avatar user={riff.creator} size={32} />
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "16px",
                        fontWeight: 300,
                        color: "#000000",
                        margin: 0,
                      }}
                    >
                      <span style={{ color: "#808080" }}>Hosted by</span>{" "}
                      <span style={{ fontWeight: 700 }}>
                        {riff.creator.name || "a Riff writer"}
                      </span>
                    </p>
                  </div>
                )}

                {riff.prompt && (
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
                    {riff.prompt}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right — CTA button + countdown */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              minWidth: "200px",
            }}
          >
            {riff.status === "REVEALED" &&
              hasDraft &&
              !hasSubmitted &&
              draftPieceId && (
                <PrimaryButton
                  onClick={() => router.push(`/write/${draftPieceId}`)}
                >
                  Submit late
                </PrimaryButton>
              )}

            {/* Prominent while it's just the host — once someone else joins,
                friends have presumably been invited, so the action recedes
                into the 3-dot menu instead of staying front and center. */}
            {!riff.club &&
              isAdmin &&
              riff.status === "ACTIVE" &&
              riff.participants.length <= 1 && (
                <CTAButton onClick={() => setIsInviteModalOpen(true)}>
                  Invite friends
                </CTAButton>
              )}

            {shouldShowReveal({
              deadlinePassed,
              isJoined,
              hasSubmitted,
              piecesAllSubmitted,
              isAdmin,
              status: riff.status,
            }) && <RevealRiffButton onClick={handleRevealClick} />}

            {deadlinePassed && riff.deadline && riff.status !== "REVEALED" && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#DC2626",
                  margin: 0,
                }}
              >
                Time&apos;s up!
              </p>
            )}
          </div>
        </div>

        {/* Revealed riff content — pieces, read-by strip, and comment activity
            all flow on one page instead of behind a tab toggle */}
        {riff.status === "REVEALED" && (
          <div style={{ marginTop: "48px" }}>
            {riff.pieces.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px",
                }}
              >
                {riff.pieces.map((pieceRiff) => (
                  <PieceCard
                    key={pieceRiff.piece.id}
                    piece={{
                      id: pieceRiff.piece.id,
                      title: pieceRiff.piece.title,
                      coverImage: pieceRiff.piece.coverImage,
                      wordCount: pieceRiff.piece.wordCount,
                      commentCount: pieceRiff.piece.commentCount,
                      author: pieceRiff.piece.author || {
                        id: pieceRiff.piece.authorId,
                        name: null,
                        avatarUrl: null,
                      },
                    }}
                    isRead={readPieceIds.includes(pieceRiff.piece.id)}
                    hasNewComments={badgeMap[pieceRiff.piece.id] ?? false}
                    isOwnPiece={isAuthoredBy(pieceRiff.piece, currentUserId)}
                    onClick={() =>
                      router.push(`/read/${pieceRiff.piece.id}?riff=${riff.id}`)
                    }
                  />
                ))}
              </div>
            )}

            {contributionData.length > 0 && (
              <ReadByStrip
                members={contributionData}
                totalPieces={totalPieces}
              />
            )}

            <div
              style={{
                marginTop: "48px",
                paddingTop: "32px",
                borderTop: "1px solid #E6E6E6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "20px",
                    fontWeight: 400,
                    color: "#000000",
                    margin: 0,
                  }}
                >
                  Comments ({totalComments})
                </h3>
                {hasUnreadComments && (
                  <button
                    onClick={markAllCommentsRead}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      fontWeight: 300,
                      color: "#808080",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ marginTop: "8px" }}>
                <ActivityFeed
                  riffId={riff.id}
                  clubId={riff.clubId}
                  currentUser={navUser}
                  onMarkPieceRead={markPieceCommentsRead}
                  markAllReadSignal={markAllReadSignal}
                  readPieces={
                    (readPieceIds ?? [])
                      .map((id) => {
                        const match = riff.pieces.find(
                          (p) => p.piece.id === id
                        );
                        // Own pieces are always counted as "read" (no
                        // PieceRead row needed — you don't need to "read"
                        // your own work), but that shouldn't count toward
                        // "have you actually read anything" for the empty
                        // comment-feed message below, or a viewer who's only
                        // submitted their own piece gets told there are "no
                        // comments on pieces you've read" instead of being
                        // nudged to go read something.
                        return match &&
                          !isAuthoredBy(match.piece, currentUserId)
                          ? {
                              id: match.piece.id,
                              title: match.piece.title,
                              coverImage: match.piece.coverImage ?? null,
                            }
                          : null;
                      })
                      .filter(Boolean) as Array<{
                      id: string;
                      title: string;
                      coverImage: string | null;
                    }>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Progress view for non-revealed riffs */}
        {riff.status !== "REVEALED" &&
          (() => {
            // Build a map from authorId → piece data for quick lookup
            const pieceByAuthor = Object.fromEntries(
              riff.pieces.map((pr) => [
                pr.piece.authorId,
                {
                  id: pr.piece.id,
                  title: pr.piece.title,
                  wordCount: pr.piece.wordCount,
                  updatedAt: pr.piece.updatedAt ?? new Date().toISOString(),
                  submittedAt: pr.submittedAt,
                  coverImage: pr.piece.coverImage,
                  preview: pr.piece.preview,
                },
              ])
            );

            // The viewer always gets a slot, even before joining — joining
            // now only ever happens as a side effect of picking New/Attach
            // draft on their own card. (viewerInParticipants is hoisted
            // above so the page width can respond to it too.)
            const participantsForGrid = viewerInParticipants
              ? riff.participants
              : [...riff.participants, { user: navUser }];

            // Viewer's own card always leads, then: submitted (0) →
            // in-progress (1) → not-started (2).
            const sorted = [...participantsForGrid].sort((a, b) => {
              if (a.user.id === currentUserId) return -1;
              if (b.user.id === currentUserId) return 1;
              const pa = pieceByAuthor[a.user.id];
              const pb = pieceByAuthor[b.user.id];
              const tierA = !pa ? 2 : pa.submittedAt ? 0 : 1;
              const tierB = !pb ? 2 : pb.submittedAt ? 0 : 1;
              if (tierA !== tierB) return tierA - tierB;
              // Within submitted: most recent first
              if (tierA === 0)
                return (
                  new Date(pb.submittedAt!).getTime() -
                  new Date(pa.submittedAt!).getTime()
                );
              // Within in-progress: most recently active first
              if (tierA === 1)
                return (
                  new Date(pb.updatedAt).getTime() -
                  new Date(pa.updatedAt).getTime()
                );
              return 0; // not-started: keep join order
            });

            return (
              <div style={{ marginTop: "48px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {sorted.map((p) => {
                    const piece = pieceByAuthor[p.user.id] ?? null;
                    const isOwnUser = p.user.id === currentUserId;

                    if (isOwnUser && !piece) {
                      return (
                        <DraftChoiceTrigger
                          key={p.user.id}
                          riffId={riff.id}
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

                    if (isOwnUser) {
                      return (
                        <ProgressCard
                          key={p.user.id}
                          user={p.user}
                          piece={piece}
                          onClick={
                            piece && piece.submittedAt === null
                              ? () => router.push(`/write/${piece.id}`)
                              : undefined
                          }
                        />
                      );
                    }

                    return (
                      <ProgressCard
                        key={p.user.id}
                        user={p.user}
                        piece={piece}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })()}
      </div>

      {/* Reveal Confirm Modal (for riff detail page) */}
      <RevealConfirmModal
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
        onConfirm={handleRevealConfirm}
        isRevealing={isRevealing}
        riffTitle={getRiffDisplayTitle(riff, predictedVolumeNumber)}
        waitingUsers={riff.participants
          .filter(
            (p) =>
              !riff.pieces.some(
                (piece) =>
                  piece.submittedAt !== null &&
                  piece.piece.authorId === p.user.id
              )
          )
          .map((p) => ({
            id: p.user.id,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
          }))}
        submittedCount={
          riff.participants.filter((p) =>
            riff.pieces.some(
              (piece) =>
                piece.submittedAt !== null && piece.piece.authorId === p.user.id
            )
          ).length
        }
        totalParticipants={riff.participants.length}
      />

      {/* Reveal Celebration */}
      {showCelebration && (
        <RevealCelebration
          onDismiss={() => {
            setShowCelebration(false);
            router.refresh();
          }}
        />
      )}

      {/* Edit Riff Modal */}
      {isEditModalOpen && (
        <EditRiffModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
          riff={{
            id: riff.id,
            title: riff.title,
            prompt: riff.prompt,
            deadline: riff.deadline,
          }}
        />
      )}

      {/* Delete Riff Modal */}
      {isDeleteModalOpen && (
        <DeleteRiffConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleted={() => {
            setIsDeleteModalOpen(false);
            router.push(riff.clubId ? `/clubs/${riff.clubId}` : "/my-riffs");
          }}
          riffId={riff.id}
          riffTitle={getRiffDisplayTitle(riff, predictedVolumeNumber)}
        />
      )}

      {/* Invite Friends Modal (clubless riffs only) */}
      {isInviteModalOpen && (
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Invite friends"
        >
          <ShareLinkOptions
            url={`${typeof window !== "undefined" ? window.location.origin : ""}/riffs/${riff.id}/join`}
            shareText="Let's riff!"
          />
        </Modal>
      )}

      <style>{`
        @media (max-width: 767px) {
          .riff-page-header {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .riff-page-header > div:last-child {
            width: 100% !important;
            min-width: 0 !important;
          }
          .riff-page-header > div:last-child button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
