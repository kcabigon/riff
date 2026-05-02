"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "./CountdownTimer";
import PieceCard from "./PieceCard";
import RevealConfirmModal from "./RevealConfirmModal";
import EditRiffModal from "./EditRiffModal";
import DeleteRiffConfirmModal from "./DeleteRiffConfirmModal";
import NavBar from "@/components/clubs/NavBar";
import RevealCelebration from "./RevealCelebration";
import {
  getRiffDisplayTitle,
  getSubmittedPieces,
  allPiecesSubmitted,
  isPastDeadline,
  formatDateShort,
  getSubmittedParticipants,
  getWaitingParticipants,
} from "@/lib/riff-utils";
import RiffCTAButton from "@/components/riffs/RiffCTAButton";
import ProgressCard from "@/components/riffs/ProgressCard";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import type { DropdownItem } from "@/components/shared/Dropdown";
import ContributionStrip from "@/components/riffs/ContributionStrip";
import NoiseBackground from "@/components/NoiseBackground";
import WhatsNextModal, {
  type WhatsNextTrigger,
} from "@/components/shared/WhatsNextModal";
import { canShowWhatsNext } from "@/lib/whatsNextGuard";
import PrimaryButton from "@/components/PrimaryButton";
import CTAButton from "@/components/CTAButton";

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
    clubId: string;
    club: { id: string; name: string };
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
        currentContent?: string | null;
        updatedAt?: string;
        commentCount?: number;
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
  isJoined: boolean;
  hasDraft: boolean;
  hasSubmitted: boolean;
  draftPieceId?: string | null;
  navUser?: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null;
  userClubs?: Array<{ id: string; name: string }>;
  readPieceIds?: string[];
  hasNewCommentsMap?: Record<string, boolean>;
  contributionData?: Array<{
    user: { id: string; name: string | null; avatarUrl: string | null };
    readCount: number;
    commentCount: number;
  }>;
  totalPieces?: number;
  onReveal?: () => void;
  hostFirstName?: string | null;
  isFirstReveal?: boolean;
}

export default function RiffPageLayout({
  riff,
  currentUserId,
  isAdmin,
  isJoined: initialIsJoined,
  hasDraft,
  hasSubmitted,
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
}: RiffPageLayoutProps) {
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [whatsNextTrigger, setWhatsNextTrigger] =
    useState<WhatsNextTrigger | null>(null);
  const router = useRouter();

  // Detect member's first visit to a revealed riff and show the "what's next" modal once
  useEffect(() => {
    if (!isFirstReveal) return;
    const key = `riff-first-reveal-${riff.id}`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    // Double guard: per-riff key (above) prevents re-show on the same riff;
    // global guard prevents re-show across all riffs after the first reveal.
    if (!canShowWhatsNext("member_first_reveal")) return;
    localStorage.setItem(key, "1");
    setWhatsNextTrigger("member_first_reveal");
  }, [riff.id, isFirstReveal]);
  const deadlinePassed = isPastDeadline(riff.deadline);
  const piecesAllSubmitted = allPiecesSubmitted(
    riff.pieces,
    riff.participants.length
  );
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
    setIsRevealing(true);
    try {
      const res = await fetch(`/api/riffs/${riff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVEALED" }),
      });
      if (res.ok) {
        setIsRevealModalOpen(false);
        setShowCelebration(true);
        router.refresh();
      }
    } catch (err) {
      console.error("Error revealing riff:", err);
    } finally {
      setIsRevealing(false);
    }
  };

  const existingPieceId =
    riff.pieces.find((p) => p.piece.authorId === currentUserId)?.piece.id ??
    null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Nav bar */}
      {navUser && (
        <NavBar
          user={navUser}
          clubs={userClubs}
          currentClub={{ id: riff.clubId, name: riff.club.name }}
        />
      )}

      {/* Main content */}
      <div
        style={{
          maxWidth: "1000px",
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
                {getRiffDisplayTitle(riff)}
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
                        ? "#FF4444"
                        : "#808080",
                    margin: 0,
                  }}
                >
                  {deadlinePassed && riff.status !== "REVEALED"
                    ? "Deadline passed"
                    : riff.deadline
                      ? `${formatDateShort(riff.createdAt)} - ${formatDateShort(riff.deadline)}`
                      : formatDateShort(riff.createdAt)}
                </p>
                {isAdmin &&
                  riff.status !== "REVEALED" &&
                  (() => {
                    const items: DropdownItem[] = [
                      {
                        type: "action",
                        label: "Edit riff",
                        onClick: () => setIsEditModalOpen(true),
                      },
                      ...(riff.status === "ACTIVE"
                        ? [
                            {
                              type: "action" as const,
                              label: "Reveal now",
                              onClick: handleRevealClick,
                            },
                          ]
                        : []),
                      { type: "divider" },
                      {
                        type: "action",
                        label: "Delete riff",
                        color: "#DC2626",
                        onClick: () => setIsDeleteModalOpen(true),
                      },
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

            {/* Prompt */}
            {riff.prompt && (
              <div
                style={{
                  borderLeft: "2px solid #000000",
                  paddingLeft: "16px",
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
                  {riff.prompt}
                </p>
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

            {riff.status === "REVEALED" && riff.updatedAt && (
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  border: "2px solid #000000",
                  padding: "12px 48px",
                  whiteSpace: "nowrap",
                }}
              >
                <NoiseBackground fillMode="cover" />
                <span
                  style={{
                    position: "relative",
                    zIndex: 1,
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: "#000000",
                  }}
                >
                  Revealed {formatDateShort(riff.updatedAt)}
                </span>
              </div>
            )}

            {riff.status === "REVEALED" &&
              (() => {
                const totalReads = contributionData.reduce(
                  (sum, m) => sum + m.readCount,
                  0
                );
                const totalComments = contributionData.reduce(
                  (sum, m) => sum + m.commentCount,
                  0
                );
                const totalWords = riff.pieces.reduce(
                  (sum, p) => sum + (p.piece.wordCount || 0),
                  0
                );
                const revealStats = [
                  {
                    value: riff.pieces.length,
                    label: riff.pieces.length === 1 ? "Piece" : "Pieces",
                  },
                  { value: totalWords.toLocaleString(), label: "Words" },
                  {
                    value: totalReads,
                    label: totalReads === 1 ? "Read" : "Reads",
                  },
                  {
                    value: totalComments,
                    label: totalComments === 1 ? "Comment" : "Comments",
                  },
                ];
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      lineHeight: "normal",
                    }}
                  >
                    {revealStats.map((stat, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "16px",
                            fontWeight: 700,
                            lineHeight: "normal",
                            color: "#000000",
                            margin: 0,
                          }}
                        >
                          {stat.value}
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "12px",
                            fontWeight: 300,
                            lineHeight: "normal",
                            color: "#000000",
                            margin: 0,
                          }}
                        >
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}

            {(deadlinePassed || piecesAllSubmitted) &&
            isAdmin &&
            riff.status === "ACTIVE" ? (
              <CTAButton onClick={handleRevealClick}>Reveal riff</CTAButton>
            ) : riff.status !== "REVEALED" ? (
              <RiffCTAButton
                riffId={riff.id}
                isJoined={isJoined}
                hasDraft={hasDraft}
                hasSubmitted={hasSubmitted}
                existingPieceId={existingPieceId}
                onJoin={() => {
                  setIsJoined(true);
                  if (canShowWhatsNext("member_joined_riff")) {
                    setWhatsNextTrigger("member_joined_riff");
                  }
                }}
              />
            ) : null}

            {isJoined && riff.deadline && riff.status !== "REVEALED" && (
              <CountdownTimer deadline={new Date(riff.deadline)} />
            )}
            {deadlinePassed && riff.deadline && riff.status !== "REVEALED" && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#FF4444",
                  margin: 0,
                }}
              >
                Time&apos;s up!
              </p>
            )}
          </div>
        </div>

        {/* Pieces gallery for REVEALED riffs */}
        {riff.status === "REVEALED" && riff.pieces.length > 0 && (
          <div style={{ marginTop: "48px" }}>
            {/* Pieces grid */}
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
                    currentContent: pieceRiff.piece.currentContent || "",
                    wordCount: pieceRiff.piece.wordCount,
                    commentCount: pieceRiff.piece.commentCount,
                    author: pieceRiff.piece.author || {
                      id: pieceRiff.piece.authorId,
                      name: null,
                      avatarUrl: null,
                    },
                  }}
                  isRead={readPieceIds.includes(pieceRiff.piece.id)}
                  hasNewComments={
                    hasNewCommentsMap[pieceRiff.piece.id] ?? false
                  }
                  isOwnPiece={pieceRiff.piece.authorId === currentUserId}
                  onClick={() =>
                    router.push(`/read/${pieceRiff.piece.id}?riff=${riff.id}`)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Contribution strip for REVEALED riffs — below pieces so readers see the grid first */}
        {riff.status === "REVEALED" && contributionData.length > 0 && (
          <div style={{ marginTop: "48px" }}>
            <ContributionStrip
              members={contributionData}
              totalPieces={totalPieces}
            />
          </div>
        )}

        {/* Progress view for non-revealed riffs */}
        {riff.status !== "REVEALED" &&
          riff.participants.length > 0 &&
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
                },
              ])
            );

            // Sort: submitted (0) → in-progress (1) → not-started (2)
            const sorted = [...riff.participants].sort((a, b) => {
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
                  {sorted.map((p) => (
                    <ProgressCard
                      key={p.user.id}
                      user={p.user}
                      piece={pieceByAuthor[p.user.id] ?? null}
                    />
                  ))}
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
        riffTitle={getRiffDisplayTitle(riff)}
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
          pieceCount={riff.pieces.length}
          onDismiss={() => {
            setShowCelebration(false);
            if (canShowWhatsNext("host_revealed")) {
              setWhatsNextTrigger("host_revealed");
            } else {
              router.refresh();
            }
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
            router.push(`/clubs/${riff.clubId}`);
          }}
          riffId={riff.id}
          riffTitle={getRiffDisplayTitle(riff)}
        />
      )}

      {/* What's Next Modal */}
      {whatsNextTrigger && (
        <WhatsNextModal
          isOpen={true}
          onClose={() => {
            setWhatsNextTrigger(null);
            router.refresh();
          }}
          trigger={whatsNextTrigger}
          hostFirstName={hostFirstName}
          onCTAClick={() => {
            setWhatsNextTrigger(null);
            router.refresh();
          }}
        />
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
