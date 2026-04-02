"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/clubs/NavBar";
import PieceCard from "@/components/riffs/PieceCard";
import Dropdown from "@/components/shared/Dropdown";
import DeletePieceModal from "@/components/writing/DeletePieceModal";
import ShareModal from "@/components/writing/ShareModal";
import NoiseBackground from "@/components/NoiseBackground";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import type { DropdownItem } from "@/components/shared/Dropdown";
import type { ActiveRiff, ShareItem } from "@/components/writing/ShareModal";

// --- Types ---

export type DraftItem = {
  id: string;
  title: string;
  updatedAt: string;
  wordCount: number;
  riffs: Array<{
    riffId: string;
    riff: {
      id: string;
      title: string | null;
      volume: number;
      club: { id: string; name: string };
    };
  }>;
  shares: ShareItem[];
};

export type PieceItem = {
  id: string;
  title: string;
  coverImage: string | null;
  currentContent: string;
  wordCount: number;
  riffs: Array<{
    riffId: string;
    riff: {
      id: string;
      title: string | null;
      volume: number;
      club: { id: string; name: string };
    };
  }>;
  shares: ShareItem[];
};

// --- Props ---

interface MyWritingPageProps {
  navUser: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  userClubs: Array<{ id: string; name: string }>;
  initialDrafts: DraftItem[];
  initialPieces: PieceItem[];
  activeRiffs: ActiveRiff[];
}

// --- Section header ---

function SectionHeader({ title }: { title: string }) {
  return (
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
      {title}
    </h2>
  );
}

// --- Piece card dots menu ---

function PieceDotsMenu({ items }: { items: DropdownItem[] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "absolute", top: "8px", right: "8px", zIndex: 3 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Dropdown
        trigger={
          <button
            aria-label="Piece options"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              background: hovered ? "#01EFFC" : "rgba(0,0,0,0.55)",
              border: hovered ? "2px solid #000000" : "2px solid transparent",
              boxShadow: hovered ? "4px 4px 0px 0px #000000" : "none",
              cursor: "pointer",
              padding: "4px 6px",
              color: "#FFFFFF",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              transition: "none",
            }}
          >
            <svg width="12" height="3" viewBox="0 0 12 3" fill="currentColor">
              <circle cx="1.5" cy="1.5" r="1.5" />
              <circle cx="6" cy="1.5" r="1.5" />
              <circle cx="10.5" cy="1.5" r="1.5" />
            </svg>
          </button>
        }
        items={items}
        align="right"
      />
    </div>
  );
}

// --- Draft card (inline — list style) ---

function DraftCard({
  draft,
  onClick,
  onShare,
  onDelete,
}: {
  draft: DraftItem;
  onClick: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [dotsHovered, setDotsHovered] = useState(false);

  const menuItems: DropdownItem[] = [
    { type: "action", label: "Share", onClick: onShare },
    { type: "divider" },
    { type: "action", label: "Delete", color: "#DC2626", onClick: onDelete },
  ];

  const subtitle = [
    new Date(draft.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    draft.wordCount > 0 ? `${draft.wordCount.toLocaleString()} words` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: "2px solid #000000",
        padding: "20px 24px",
        backgroundColor: "#FFFFFF",
        boxShadow: isHovered ? "4px 4px 0px 0px #000000" : "none",
        transition: "box-shadow 0.1s ease",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        cursor: "pointer",
      }}
    >
      {/* Top row: title + dots menu */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "20px",
            fontWeight: 400,
            color: "#000000",
            margin: 0,
            lineHeight: 1.3,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {draft.title || "Untitled"}
        </h3>
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <button
                aria-label="Draft options"
                onMouseEnter={() => setDotsHovered(true)}
                onMouseLeave={() => setDotsHovered(false)}
                style={{
                  background: dotsHovered ? "#01EFFC" : "transparent",
                  border: dotsHovered
                    ? "2px solid #000000"
                    : "2px solid transparent",
                  boxShadow: dotsHovered ? "4px 4px 0px 0px #000000" : "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  color: "#000000",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  transition: "none",
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
            items={menuItems}
            align="right"
          />
        </div>
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "13px",
          fontWeight: 300,
          color: "#808080",
          margin: 0,
        }}
      >
        {subtitle}
      </p>

      {/* Riff pills */}
      {draft.riffs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {draft.riffs.map((r) => (
            <span
              key={r.riffId}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "11px",
                fontWeight: 700,
                color: "#000000",
                backgroundColor: "#00FF66",
                border: "1px solid #000000",
                padding: "2px 8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              {r.riff.title || `Vol. ${r.riff.volume}`} · {r.riff.club.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main component ---

export default function MyWritingPage({
  navUser,
  userClubs,
  initialDrafts,
  initialPieces,
  activeRiffs,
}: MyWritingPageProps) {
  const router = useRouter();
  const { createDraft, isCreating } = useDraftCreation();

  const [drafts, setDrafts] = useState<DraftItem[]>(initialDrafts);
  const [pieces, setPieces] = useState<PieceItem[]>(initialPieces);

  // Modal state
  const [sharingPieceId, setSharingPieceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // --- Helpers to find current item ---

  const findItem = (id: string): DraftItem | PieceItem | undefined =>
    [...drafts, ...pieces].find((x) => x.id === id);

  // --- Riff attach callback ---

  const handleRiffAttached = (pieceId: string, riff: ActiveRiff) => {
    const update = <T extends DraftItem | PieceItem>(arr: T[]): T[] =>
      arr.map((x) =>
        x.id === pieceId
          ? {
              ...x,
              riffs: [
                ...x.riffs,
                {
                  riffId: riff.id,
                  riff: {
                    id: riff.id,
                    title: riff.title,
                    volume: riff.volume,
                    club: riff.club,
                  },
                },
              ],
            }
          : x
      );
    setDrafts((prev) => update(prev));
    setPieces((prev) => update(prev));
  };

  // --- Share created callback ---

  const handleShareCreated = (pieceId: string, share: ShareItem) => {
    // Add share to local state
    const addShare = <T extends DraftItem | PieceItem>(arr: T[]): T[] =>
      arr.map((x) =>
        x.id === pieceId ? { ...x, shares: [...x.shares, share] } : x
      );

    // Check if this draft should graduate to piece
    const draft = drafts.find((d) => d.id === pieceId);
    if (draft) {
      const updatedDraft = { ...draft, shares: [...draft.shares, share] };
      // Move from drafts → pieces
      setDrafts((prev) => prev.filter((d) => d.id !== pieceId));
      setPieces((prev) => [
        { ...updatedDraft, coverImage: null, currentContent: "" },
        ...prev,
      ]);
    } else {
      setPieces((prev) => addShare(prev));
    }
  };

  // --- Share revoked callback ---

  const handleShareRevoked = (pieceId: string, shareId: string) => {
    const removeShare = <T extends DraftItem | PieceItem>(arr: T[]): T[] =>
      arr.map((x) =>
        x.id === pieceId
          ? { ...x, shares: x.shares.filter((s) => s.id !== shareId) }
          : x
      );

    // Check if piece should demote back to draft
    const piece = pieces.find((p) => p.id === pieceId);
    if (piece) {
      const updatedShares = piece.shares.filter((s) => s.id !== shareId);
      const hasSubmittedRiff = piece.riffs.some(() => true); // riffs on pieces are always submitted
      if (updatedShares.length === 0 && !hasSubmittedRiff) {
        // Demote to draft
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { coverImage: _ci, currentContent: _cc, ...draftFields } = piece;
        setPieces((prev) => prev.filter((p) => p.id !== pieceId));
        setDrafts((prev) => [
          {
            ...draftFields,
            shares: [],
            updatedAt:
              piece.riffs.length > 0
                ? (draftFields.riffs[0]?.riff.id ?? new Date().toISOString())
                : new Date().toISOString(),
          } as DraftItem,
          ...prev,
        ]);
        return;
      }
      setPieces((prev) => removeShare(prev));
    } else {
      setDrafts((prev) => removeShare(prev));
    }
  };

  // --- Delete action ---

  const handleDeleted = (pieceId: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== pieceId));
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
    setSharingPieceId(null);
  };

  // --- Pieces grid item ---

  const renderPieceGridItem = (piece: PieceItem) => {
    const menuItems: DropdownItem[] = [
      {
        type: "action",
        label: "Edit",
        onClick: () => router.push(`/write/${piece.id}`),
      },
      {
        type: "action",
        label: "Share",
        onClick: () => setSharingPieceId(piece.id),
      },
      { type: "divider" },
      {
        type: "action",
        label: "Delete",
        color: "#DC2626",
        onClick: () => setDeleteTarget({ id: piece.id, title: piece.title }),
      },
    ];

    return (
      <div key={piece.id} style={{ position: "relative" }}>
        <PieceDotsMenu items={menuItems} />

        <PieceCard
          piece={piece}
          isRead={true}
          isOwnPiece={true}
          onClick={() => router.push(`/read/${piece.id}`)}
        />

        {/* Riff badge — bottom center overlay */}
        {piece.riffs.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            {piece.riffs.map((r) => (
              <span
                key={r.riffId}
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#000000",
                  backgroundColor: "#00FF66",
                  border: "1px solid #000000",
                  padding: "2px 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                  maxWidth: "90%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.riff.title || `Vol. ${r.riff.volume}`} · {r.riff.club.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const [isDraftHovered, setIsDraftHovered] = useState(false);

  const newDraftButton = (
    <button
      onMouseEnter={() => setIsDraftHovered(true)}
      onMouseLeave={() => setIsDraftHovered(false)}
      onClick={() => createDraft()}
      disabled={isCreating}
      style={{
        backgroundColor: "#000000",
        border: "2px solid #FFFFFF",
        boxShadow: isCreating
          ? "none"
          : isDraftHovered
            ? "4px 4px 0px 0px #01EFFC"
            : "4px 4px 0px 0px #00FF66",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: isCreating ? "not-allowed" : "pointer",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "14px",
        fontWeight: 300,
        color: isCreating ? "#808080" : "#FFFFFF",
        whiteSpace: "nowrap",
        transition: "none",
      }}
    >
      + New Draft
    </button>
  );

  // --- Sharing modal data ---

  const sharingItem = sharingPieceId ? findItem(sharingPieceId) : null;

  return (
    <>
      {/* Nav */}
      <NavBar
        user={navUser}
        clubs={userClubs}
        showClubDropdown={false}
        leftContent={newDraftButton}
      />

      {/* Page content */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        <NoiseBackground fillMode="cover" />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "40px 24px 80px",
          }}
        >
          {/* Page header */}
          <h1
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "32px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 48px 0",
            }}
          >
            My Writing
          </h1>

          {/* DRAFTS section */}
          <div style={{ marginBottom: "56px" }}>
            <SectionHeader title={`Drafts (${drafts.length})`} />
            {drafts.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "15px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                }}
              >
                No drafts yet. Start writing something.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {drafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onClick={() => router.push(`/write/${draft.id}`)}
                    onShare={() => setSharingPieceId(draft.id)}
                    onDelete={() =>
                      setDeleteTarget({ id: draft.id, title: draft.title })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* PIECES section */}
          <div>
            <SectionHeader title={`Pieces (${pieces.length})`} />
            {pieces.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "15px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                }}
              >
                No submitted pieces yet.
              </p>
            ) : (
              <>
                <style>{`
                .my-writing-pieces-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 24px;
                }
                @media (max-width: 767px) {
                  .my-writing-pieces-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                  }
                }
                @media (max-width: 480px) {
                  .my-writing-pieces-grid {
                    grid-template-columns: 1fr;
                  }
                }
              `}</style>
                <div className="my-writing-pieces-grid">
                  {pieces.map(renderPieceGridItem)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Share modal */}
      {sharingPieceId && sharingItem && (
        <ShareModal
          pieceId={sharingPieceId}
          activeRiffs={activeRiffs}
          userClubs={userClubs}
          existingRiffIds={sharingItem.riffs.map((r) => r.riffId)}
          existingShares={sharingItem.shares}
          onClose={() => setSharingPieceId(null)}
          onRiffAttached={(riff) => handleRiffAttached(sharingPieceId, riff)}
          onShareCreated={(share) => handleShareCreated(sharingPieceId, share)}
          onShareRevoked={(shareId) =>
            handleShareRevoked(sharingPieceId, shareId)
          }
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeletePieceModal
          pieceId={deleteTarget.id}
          pieceTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => handleDeleted(deleteTarget.id)}
        />
      )}
    </>
  );
}
