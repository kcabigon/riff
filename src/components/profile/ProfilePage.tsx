"use client";

import { useState, useEffect, useRef } from "react";
import ProfileHeader from "./ProfileHeader";
import PiecesGrid from "./tabs/PiecesGrid";
import type { Piece } from "./tabs/PiecesGrid";
import DeletePieceModal from "@/components/profile/DeletePieceModal";
import ShareModal, { PublicShare } from "@/components/profile/ShareModal";
import NoiseBackground from "@/components/NoiseBackground";
import Tagline from "@/components/Tagline";
import CTAButton from "@/components/CTAButton";

export interface Jam {
  content: string;
  timestamp: string;
  url: string | null;
  note: string;
}

interface ProfilePageProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  currentUser: {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  stats: {
    pieceCount: number;
    totalWordCount: number;
    riffCount: number;
    commentsGiven: number;
  };
  pieces: Piece[];
  jams: Jam[];
  isOwnProfile: boolean;
  lastActiveClubId: string | null;
}

// ── EQ bars ──────────────────────────────────────────────────────────────────

function EQBars() {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        alignItems: "flex-end",
        height: "10px",
        flexShrink: 0,
      }}
    >
      <div
        className="eq-bar"
        style={{ width: "2px", height: "10px", backgroundColor: "#000000" }}
      />
      <div
        className="eq-bar"
        style={{ width: "2px", height: "10px", backgroundColor: "#000000" }}
      />
      <div
        className="eq-bar"
        style={{ width: "2px", height: "10px", backgroundColor: "#000000" }}
      />
    </div>
  );
}

// ── Compose form styles ───────────────────────────────────────────────────────

const panelInputStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  color: "#000000",
  backgroundColor: "#FFFFFF",
  border: "2px solid #9C9C9C",
  padding: "12px 16px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  resize: "none",
};

const onPanelFocus = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  e.target.style.borderColor = "#00FF66";
};

const onPanelBlur = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  e.target.style.borderColor = "#9C9C9C";
};

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfilePage({
  user,
  currentUser,
  stats,
  lastActiveClubId,
  pieces: initialPieces,
  jams: initialJams,
  isOwnProfile,
}: ProfilePageProps) {
  const [pieces, setPieces] = useState(initialPieces);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string | null;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<string | null>(null);

  // ── Jams state ──────────────────────────────────────────────────────────────
  const jamDraftKey = `riff-jam-draft-${user.id}`;
  const [localJams, setLocalJams] = useState(initialJams);
  const [isComposing, setIsComposing] = useState(false);
  const [composingContent, setComposingContent] = useState("");
  const [composingNote, setComposingNote] = useState("");
  const [composingUrl, setComposingUrl] = useState("");
  const [jamsExpanded, setJamsExpanded] = useState(false);
  const [selectedJamIndex, setSelectedJamIndex] = useState(0);
  const [caretX, setCaretX] = useState<number | null>(null);
  const jamsRef = useRef<HTMLDivElement>(null);
  const jamButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const emptyStateBandRef = useRef<HTMLDivElement>(null);

  const composingNoteWordCount =
    composingNote.trim() === "" ? 0 : composingNote.trim().split(/\s+/).length;
  const composingNoteOverLimit = composingNoteWordCount > 250;

  const resetCompose = () => {
    setIsComposing(false);
    setComposingContent("");
    setComposingNote("");
    setComposingUrl("");
    localStorage.removeItem(jamDraftKey);
  };

  const handlePostJam = () => {
    const newJam: Jam = {
      content: composingContent.trim(),
      note: composingNote.trim(),
      url: composingUrl.trim() || null,
      timestamp: "just now",
    };
    setLocalJams((prev) => [newJam, ...prev]);
    setSelectedJamIndex(0);
    resetCompose();
  };

  // Restore draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(jamDraftKey);
    if (!saved) return;
    try {
      const { content, note, url } = JSON.parse(saved);
      if (content) setComposingContent(content);
      if (note) setComposingNote(note);
      if (url) setComposingUrl(url);
    } catch {
      // ignore malformed data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    if (!composingContent && !composingNote && !composingUrl) return;
    localStorage.setItem(
      jamDraftKey,
      JSON.stringify({
        content: composingContent,
        note: composingNote,
        url: composingUrl,
      })
    );
  }, [composingContent, composingNote, composingUrl, jamDraftKey]);

  // Track caret position for the panel triangle
  useEffect(() => {
    if (!jamsExpanded) return;
    if (localJams.length === 0 && emptyStateBandRef.current) {
      const rect = emptyStateBandRef.current.getBoundingClientRect();
      setCaretX(rect.left + rect.width / 2);
      return;
    }
    const btn = jamButtonRefs.current[selectedJamIndex];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setCaretX(rect.left + rect.width / 2);
  }, [jamsExpanded, selectedJamIndex, localJams]);

  // Close panel on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (jamsRef.current && !jamsRef.current.contains(e.target as Node)) {
        setJamsExpanded(false);
        setIsComposing(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // ── Piece handlers ──────────────────────────────────────────────────────────

  const handleDeleted = (pieceId: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
  };

  const handleShareCreated = (pieceId: string, share: PublicShare) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, isPublic: true, publicShareId: share.id } : p
      )
    );
  };

  const handleShareRevoked = (pieceId: string) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, isPublic: false, publicShareId: null } : p
      )
    );
  };

  const isEmpty = pieces.length === 0;

  // ── Bouncing empty state ────────────────────────────────────────────────────

  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 40, y: 40 });
  const vel = useRef({ dx: 2.5, dy: 2 });
  const [boxStyle, setBoxStyle] = useState({ left: 40, top: 40 });

  useEffect(() => {
    if (!isEmpty) return;
    let animId: number;
    const step = () => {
      const container = containerRef.current;
      const box = boxRef.current;
      if (!container || !box) {
        animId = requestAnimationFrame(step);
        return;
      }
      const cw = container.clientWidth,
        ch = container.clientHeight;
      const bw = box.offsetWidth,
        bh = box.offsetHeight;
      pos.current.x += vel.current.dx;
      pos.current.y += vel.current.dy;
      if (pos.current.x <= 0) {
        pos.current.x = 0;
        vel.current.dx = Math.abs(vel.current.dx);
      }
      if (pos.current.x + bw >= cw) {
        pos.current.x = cw - bw;
        vel.current.dx = -Math.abs(vel.current.dx);
      }
      if (pos.current.y <= 0) {
        pos.current.y = 0;
        vel.current.dy = Math.abs(vel.current.dy);
      }
      if (pos.current.y + bh >= ch) {
        pos.current.y = ch - bh;
        vel.current.dy = -Math.abs(vel.current.dy);
      }
      setBoxStyle({ left: pos.current.x, top: pos.current.y });
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isEmpty]);

  // ── Compose form ────────────────────────────────────────────────────────────

  const composeForm = (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <Tagline
          text="What are you into right now?"
          color="#01EFFC"
          textColor="#000000"
          fontSize={16}
          width={290}
          align="left"
        />
        <textarea
          value={composingContent}
          onChange={(e) => setComposingContent(e.target.value)}
          placeholder="A recent moment, an album on repeat, a new favorite place..."
          rows={1}
          style={panelInputStyle}
          onFocus={onPanelFocus}
          onBlur={onPanelBlur}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <Tagline
          text="Why?"
          color="#EECF01"
          textColor="#000000"
          fontSize={16}
          width={64}
          align="left"
        />
        <textarea
          value={composingNote}
          onChange={(e) => setComposingNote(e.target.value)}
          placeholder="Your mini riff on it..."
          rows={12}
          style={{
            ...panelInputStyle,
            resize: "vertical",
            ...(composingNoteOverLimit ? { borderColor: "#DC2626" } : {}),
          }}
          onFocus={onPanelFocus}
          onBlur={(e) => {
            e.target.style.borderColor = composingNoteOverLimit
              ? "#DC2626"
              : "#9C9C9C";
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: composingNoteOverLimit ? "#DC2626" : "#9C9C9C",
            }}
          >
            {composingNoteWordCount} / 250 words
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Tagline
            text="Link"
            color="#C01582"
            textColor="#000000"
            fontSize={16}
            width={60}
            align="left"
          />
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#9C9C9C",
            }}
          >
            optional
          </span>
        </div>
        <input
          type="url"
          value={composingUrl}
          onChange={(e) => setComposingUrl(e.target.value)}
          placeholder="https://open.spotify.com/..."
          style={{ ...panelInputStyle, resize: undefined }}
          onFocus={onPanelFocus}
          onBlur={onPanelBlur}
        />
      </div>
      <CTAButton
        onClick={handlePostJam}
        disabled={
          !composingContent.trim() ||
          !composingNote.trim() ||
          composingNoteOverLimit
        }
        style={{ width: "100%" }}
      >
        Post jam
      </CTAButton>
      <button
        onClick={resetCompose}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#FFFFFF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#808080";
        }}
        style={{
          display: "block",
          margin: "16px auto 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          padding: "4px 8px",
        }}
      >
        Cancel
      </button>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        position: isEmpty ? "relative" : undefined,
      }}
    >
      {isEmpty && <NoiseBackground fillMode="tile" />}

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
          const piece = pieces.find((p) => p.id === shareTarget);
          if (!piece) return null;
          return (
            <ShareModal
              pieceId={piece.id}
              isRevealed={piece.isRevealed}
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

      <ProfileHeader
        profileUser={user}
        currentUser={currentUser}
        isOwnProfile={isOwnProfile}
        lastActiveClubId={lastActiveClubId}
        stats={stats}
        onNewJam={
          isOwnProfile
            ? () => {
                setIsComposing(true);
                setJamsExpanded(true);
              }
            : undefined
        }
        isComposing={isComposing}
      />

      {/* ── Jams band ─────────────────────────────────────────────────────── */}
      <div ref={jamsRef}>
        {localJams.length === 0 && isOwnProfile && (
          <>
            <div
              onClick={() => setJamsExpanded((v) => !v)}
              style={{
                backgroundColor: "#00FF66",
                height: "40px",
                borderBottom: jamsExpanded ? "none" : "2px solid #000000",
                cursor: "pointer",
                userSelect: "none",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <div
                  ref={emptyStateBandRef}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0 20px 0 0",
                  }}
                >
                  <EQBars />
                  <span
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "16px",
                      fontWeight: 400,
                      color: "#000000",
                      whiteSpace: "nowrap",
                    }}
                  >
                    What&apos;s your jam?
                  </span>
                </div>
              </div>
            </div>

            {jamsExpanded && (
              <div
                className="jams-panel"
                style={{ backgroundColor: "#000000", position: "relative" }}
              >
                {!isComposing && caretX !== null && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: `${caretX - 10}px`,
                      width: 0,
                      height: 0,
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderTop: "10px solid #00FF66",
                      pointerEvents: "none",
                    }}
                  />
                )}
                <div
                  style={{
                    maxWidth: "1000px",
                    margin: "0 auto",
                    padding: "28px 24px 24px",
                  }}
                >
                  {isComposing ? (
                    composeForm
                  ) : (
                    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: "32px",
                          fontWeight: 400,
                          color: "#FFFFFF",
                          margin: "0 0 8px",
                          lineHeight: 1.2,
                        }}
                      >
                        What&apos;s your jam?
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "12px",
                          fontWeight: 300,
                          color: "#808080",
                          margin: "0 0 20px",
                        }}
                      >
                        whenever the mood hits
                      </p>
                      {[
                        "This is a sample jam. Jams are different than riffs. The group riff is the main event — a deadline, a long-form piece, a group reveal, the whole reason your write club exists. High effort, high payoff.",
                        "But even the best albums needed B-sides. Jams are yours. No deadline, no long-form commitment, no group reveal. Just whatever you're into right now — a song, a place, a book, a weird hill you'll die on. A paragraph or two, whenever the mood hits. They live right here on your profile, so your club always knows what's on your mind between pieces.",
                        "Hit New jam above to drop your first one.",
                      ].map((para, i, arr) => (
                        <p
                          key={para.slice(0, 20)}
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "16px",
                            fontWeight: 300,
                            color: "#9C9C9C",
                            margin: i < arr.length - 1 ? "0 0 16px" : 0,
                            lineHeight: 1.7,
                          }}
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {localJams.length > 0 && (
          <>
            <div
              onClick={() => setJamsExpanded((v) => !v)}
              style={{
                backgroundColor: "#00FF66",
                height: "40px",
                borderBottom: jamsExpanded ? "none" : "2px solid #000000",
                cursor: "pointer",
                userSelect: "none",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent:
                    localJams.length <= 1 ? "center" : "flex-start",
                  height: "100%",
                  paddingLeft:
                    localJams.length <= 1
                      ? "0"
                      : "max(24px, calc((100vw - 1000px) / 2 + 24px))",
                  paddingRight:
                    localJams.length <= 1
                      ? "0"
                      : "max(24px, calc((100vw - 1000px) / 2 + 24px))",
                  maskImage:
                    "linear-gradient(to right, transparent max(0px, calc((100vw - 1000px) / 2)), black max(48px, calc((100vw - 1000px) / 2 + 48px)), black calc(100% - max(80px, calc((100vw - 1000px) / 2 + 80px))), transparent calc(100% - max(0px, calc((100vw - 1000px) / 2))))",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent max(0px, calc((100vw - 1000px) / 2)), black max(48px, calc((100vw - 1000px) / 2 + 48px)), black calc(100% - max(80px, calc((100vw - 1000px) / 2 + 80px))), transparent calc(100% - max(0px, calc((100vw - 1000px) / 2))))",
                }}
              >
                {localJams.map((jam, i) => (
                  <button
                    key={jam.content}
                    ref={(el) => {
                      jamButtonRefs.current[i] = el;
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        i === selectedJamIndex &&
                        jamsExpanded &&
                        !isComposing
                      ) {
                        setJamsExpanded(false);
                      } else {
                        setSelectedJamIndex(i);
                        setJamsExpanded(true);
                        setIsComposing(false);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      borderRight:
                        i < localJams.length - 1
                          ? "1px solid rgba(0,0,0,0.12)"
                          : "none",
                      padding: "0 20px",
                      cursor: "pointer",
                      textAlign: "left",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {i === 0 && <EQBars />}
                    <span
                      style={{
                        fontFamily: "var(--font-dm-serif-text)",
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "#000000",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {jam.content}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "12px",
                        fontWeight: 300,
                        color: "rgba(0,0,0,0.5)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {jam.timestamp}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {jamsExpanded &&
              (() => {
                const jam = localJams[selectedJamIndex];
                if (!jam && !isComposing) return null;
                return (
                  <div
                    className="jams-panel"
                    style={{ backgroundColor: "#000000", position: "relative" }}
                  >
                    {!isComposing && caretX !== null && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: `${caretX - 10}px`,
                          width: 0,
                          height: 0,
                          borderLeft: "10px solid transparent",
                          borderRight: "10px solid transparent",
                          borderTop: "10px solid #00FF66",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                    <div
                      style={{
                        maxWidth: "1000px",
                        margin: "0 auto",
                        padding: "28px 24px 24px",
                      }}
                    >
                      {isComposing ? (
                        composeForm
                      ) : (
                        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
                          <p
                            style={{
                              fontFamily: "var(--font-dm-serif-text)",
                              fontSize: "32px",
                              fontWeight: 400,
                              color: "#FFFFFF",
                              margin: "0 0 8px",
                              lineHeight: 1.2,
                            }}
                          >
                            {jam!.content}
                          </p>
                          <p
                            style={{
                              fontFamily: "var(--font-dm-sans)",
                              fontSize: "12px",
                              fontWeight: 300,
                              color: "#808080",
                              margin: "0 0 20px",
                            }}
                          >
                            {jam!.timestamp}
                          </p>
                          {jam!.note.split("\n\n").map((para, i, arr) => (
                            <p
                              key={para.slice(0, 20)}
                              style={{
                                fontFamily: "var(--font-dm-sans)",
                                fontSize: "16px",
                                fontWeight: 300,
                                color: "#9C9C9C",
                                margin:
                                  i < arr.length - 1 ? "0 0 16px" : "0 0 20px",
                                lineHeight: 1.7,
                              }}
                            >
                              {para}
                            </p>
                          ))}
                          {jam!.url && (
                            <a
                              href={jam!.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontFamily: "var(--font-dm-sans)",
                                fontSize: "12px",
                                fontWeight: 300,
                                color: "#808080",
                                textDecoration: "none",
                                borderBottom: "1px solid #808080",
                                paddingBottom: "1px",
                              }}
                            >
                              Open link
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
                                  stroke="#808080"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
          </>
        )}
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {isEmpty && (
        <div
          ref={containerRef}
          style={{
            position: "relative",
            height: "calc(100vh - 64px)",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <div
            ref={boxRef}
            style={{
              position: "absolute",
              left: boxStyle.left,
              top: boxStyle.top,
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: "8px 8px 0px 0px #000000",
              width: "160px",
              height: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              Every writer starts with a blank page.
            </p>
          </div>
        </div>
      )}

      {/* ── Pieces grid ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {pieces.length > 0 && (
          <PiecesGrid
            pieces={pieces}
            isOwnProfile={isOwnProfile}
            profileUserId={user.id}
            onDelete={(id, title) => setDeleteTarget({ id, title })}
            onShare={(pieceId) => setShareTarget(pieceId)}
          />
        )}
      </div>
    </div>
  );
}
