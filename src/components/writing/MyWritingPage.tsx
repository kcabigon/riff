"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/clubs/NavBar";
import PieceCard from "@/components/riffs/PieceCard";
import Dropdown from "@/components/shared/Dropdown";
import Modal from "@/components/shared/Modal";
import DraftCard from "@/components/writing/DraftCard";
import AttachToRiffModal from "@/components/writing/AttachToRiffModal";
import NoiseBackground from "@/components/NoiseBackground";
import DeletePieceModal from "@/components/writing/DeletePieceModal";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import type { DropdownItem } from "@/components/shared/Dropdown";

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
  isPublished: boolean;
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
};

type ActiveRiff = {
  id: string;
  title: string | null;
  volume: number;
  club: { id: string; name: string };
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
      style={{ position: "absolute", top: "8px", left: "8px", zIndex: 3 }}
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
        align="left"
      />
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
  const [attachDraftId, setAttachDraftId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [sharingPiece, setSharingPiece] = useState<PieceItem | null>(null);

  // --- Draft actions ---

  const handlePublishToggle = async (draft: DraftItem) => {
    const newVisibility = draft.isPublished ? "PRIVATE" : "PUBLIC";
    try {
      const res = await fetch(`/api/pieces/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      if (res.ok) {
        setDrafts((prev) =>
          prev.map((d) =>
            d.id === draft.id
              ? { ...d, isPublished: newVisibility === "PUBLIC" }
              : d
          )
        );
      }
    } catch {
      // silent — no toast system yet
    }
  };

  const handleDraftAttached = (draftId: string, riff: ActiveRiff) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? {
              ...d,
              riffs: [
                ...d.riffs,
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
          : d
      )
    );
  };

  // --- Delete action ---

  const handleDeleted = (pieceId: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== pieceId));
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
  };

  // --- Pieces grid item ---

  const renderPieceGridItem = (piece: PieceItem) => {
    const menuItems: DropdownItem[] = [
      {
        type: "action",
        label: "View",
        onClick: () => router.push(`/read/${piece.id}`),
      },
      {
        type: "action",
        label: "Edit",
        onClick: () => router.push(`/write/${piece.id}`),
      },
      {
        type: "action",
        label: "Sharing",
        onClick: () => setSharingPiece(piece),
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
        {/* Dots menu — top-left */}
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
                    onAttach={() => setAttachDraftId(draft.id)}
                    onPublishToggle={() => handlePublishToggle(draft)}
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

      {/* Modals */}
      {attachDraftId && (
        <AttachToRiffModal
          draftId={attachDraftId}
          activeRiffs={activeRiffs}
          alreadyAttachedRiffIds={
            drafts
              .find((d) => d.id === attachDraftId)
              ?.riffs.map((r) => r.riffId) ?? []
          }
          onClose={() => setAttachDraftId(null)}
          onAttached={(riff) => {
            handleDraftAttached(attachDraftId, riff);
          }}
        />
      )}

      {deleteTarget && (
        <DeletePieceModal
          pieceId={deleteTarget.id}
          pieceTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => handleDeleted(deleteTarget.id)}
        />
      )}

      {sharingPiece && (
        <Modal
          isOpen
          onClose={() => setSharingPiece(null)}
          title="Sharing"
          size="sm"
        >
          {sharingPiece.riffs.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
              }}
            >
              This piece hasn&apos;t been submitted to any riff.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                }}
              >
                Submitted to:
              </p>
              {sharingPiece.riffs.map((r) => (
                <div
                  key={r.riffId}
                  style={{
                    border: "2px solid #000000",
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "15px",
                      fontWeight: 300,
                      color: "#000000",
                    }}
                  >
                    {r.riff.title || `Riff Vol. ${r.riff.volume}`}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      fontWeight: 300,
                      color: "#808080",
                    }}
                  >
                    {r.riff.club.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
