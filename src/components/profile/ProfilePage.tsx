"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import PiecesGrid, { FeaturedPiece } from "./tabs/PiecesGrid";
import type { Piece } from "./tabs/PiecesGrid";
import DeletePieceModal from "@/components/profile/DeletePieceModal";
import NewJamModal from "@/components/profile/NewJamModal";
import { MOCK_JAMS } from "@/components/profile/MyJams";

interface ProfilePageProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
  stats: {
    pieceCount: number;
    totalWordCount: number;
  };
  pieces: Piece[];
  isOwnProfile: boolean;
  lastActiveClubId: string | null;
}

export default function ProfilePage({
  user,
  stats,
  lastActiveClubId,
  pieces: initialPieces,
  isOwnProfile,
}: ProfilePageProps) {
  const router = useRouter();
  const [pieces, setPieces] = useState(initialPieces);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string | null;
  } | null>(null);
  const [isJamModalOpen, setIsJamModalOpen] = useState(false);
  const [jamsExpanded, setJamsExpanded] = useState(false);
  const [selectedJamIndex, setSelectedJamIndex] = useState(0);
  const [caretX, setCaretX] = useState<number | null>(null);
  const jamsRef = useRef<HTMLDivElement>(null);
  const jamButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const emptyStateBandRef = useRef<HTMLDivElement>(null);

  // Update caret position whenever the panel opens or selected jam changes
  useEffect(() => {
    if (!jamsExpanded) return;
    if (MOCK_JAMS.length === 0 && emptyStateBandRef.current) {
      const rect = emptyStateBandRef.current.getBoundingClientRect();
      setCaretX(rect.left + rect.width / 2);
      return;
    }
    const btn = jamButtonRefs.current[selectedJamIndex];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setCaretX(rect.left + rect.width / 2);
  }, [jamsExpanded, selectedJamIndex]);

  // Close panel when clicking outside the jams band + panel
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (jamsRef.current && !jamsRef.current.contains(e.target as Node)) {
        setJamsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const handleDeleted = (pieceId: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
  };

  const [featured, ...rest] = pieces;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {deleteTarget && (
        <DeletePieceModal
          pieceId={deleteTarget.id}
          pieceTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => handleDeleted(deleteTarget.id)}
        />
      )}

      <ProfileHeader
        profileUser={user}
        isOwnProfile={isOwnProfile}
        lastActiveClubId={lastActiveClubId}
        stats={isOwnProfile ? stats : undefined}
        onNewJam={isOwnProfile ? () => setIsJamModalOpen(true) : undefined}
      />

      {/* Jams band + expandable panel */}
      <div ref={jamsRef}>
        {MOCK_JAMS.length === 0 && isOwnProfile && (
          <>
            {/* Empty state band */}
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
                  {/* EQ bars */}
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
                      style={{
                        width: "2px",
                        height: "10px",
                        backgroundColor: "#000000",
                      }}
                    />
                    <div
                      className="eq-bar"
                      style={{
                        width: "2px",
                        height: "10px",
                        backgroundColor: "#000000",
                      }}
                    />
                    <div
                      className="eq-bar"
                      style={{
                        width: "2px",
                        height: "10px",
                        backgroundColor: "#000000",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "14px",
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

            {/* Empty state expanded panel */}
            {jamsExpanded && (
              <div
                className="jams-panel"
                style={{ backgroundColor: "#000000", position: "relative" }}
              >
                {caretX !== null && (
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
                  <div style={{ maxWidth: "640px", margin: "0 auto" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-serif-text)",
                        fontSize: "32px",
                        fontWeight: 400,
                        color: "#FFFFFF",
                        margin: "0 0 6px",
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
                      "But even the best albums needed B-sides. Jams are yours. No deadline, no long-form commitment, no group reveal. Just whatever you're into right now — a song, a place, a book, a weird hill you'll die on. A paragraph or two, whenever the mood hits. They live right here on your profile, so your club always knows what's on your mind between pieces. Like passing notes in class, but the class is your write club.",
                      "Hit New jam above to drop your first one.",
                    ].map((para, i, arr) => (
                      <p
                        key={i}
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
                </div>
              </div>
            )}
          </>
        )}

        {MOCK_JAMS.length > 0 && (
          <>
            {/* Full-width green band with scrollable track list */}
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
                    MOCK_JAMS.length <= 1 ? "center" : "flex-start",
                  height: "100%",
                  paddingLeft:
                    MOCK_JAMS.length <= 1
                      ? "0"
                      : "max(24px, calc((100vw - 1000px) / 2 + 24px))",
                  paddingRight:
                    MOCK_JAMS.length <= 1
                      ? "0"
                      : "max(24px, calc((100vw - 1000px) / 2 + 24px))",
                  maskImage:
                    "linear-gradient(to right, transparent max(0px, calc((100vw - 1000px) / 2)), black max(48px, calc((100vw - 1000px) / 2 + 48px)), black calc(100% - max(80px, calc((100vw - 1000px) / 2 + 80px))), transparent calc(100% - max(0px, calc((100vw - 1000px) / 2))))",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent max(0px, calc((100vw - 1000px) / 2)), black max(48px, calc((100vw - 1000px) / 2 + 48px)), black calc(100% - max(80px, calc((100vw - 1000px) / 2 + 80px))), transparent calc(100% - max(0px, calc((100vw - 1000px) / 2))))",
                }}
              >
                {MOCK_JAMS.map((jam, i) => (
                  <button
                    key={i}
                    ref={(el) => {
                      jamButtonRefs.current[i] = el;
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (i === selectedJamIndex && jamsExpanded) {
                        setJamsExpanded(false);
                      } else {
                        setSelectedJamIndex(i);
                        setJamsExpanded(true);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      borderRight:
                        i < MOCK_JAMS.length - 1
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
                    {/* EQ bars on the newest (first) jam */}
                    {i === 0 && (
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
                          style={{
                            width: "2px",
                            height: "10px",
                            backgroundColor: "#000000",
                          }}
                        />
                        <div
                          className="eq-bar"
                          style={{
                            width: "2px",
                            height: "10px",
                            backgroundColor: "#000000",
                          }}
                        />
                        <div
                          className="eq-bar"
                          style={{
                            width: "2px",
                            height: "10px",
                            backgroundColor: "#000000",
                          }}
                        />
                      </div>
                    )}
                    <span
                      style={{
                        fontFamily: "var(--font-dm-serif-text)",
                        fontSize: "14px",
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

            {/* Expanded panel */}
            {jamsExpanded &&
              (() => {
                const jam = MOCK_JAMS[selectedJamIndex];
                return (
                  <div
                    className="jams-panel"
                    style={{ backgroundColor: "#000000", position: "relative" }}
                  >
                    {/* Green V caret tracks selected jam button */}
                    {caretX !== null && (
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
                      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
                        <p
                          style={{
                            fontFamily: "var(--font-dm-serif-text)",
                            fontSize: "32px",
                            fontWeight: 400,
                            color: "#FFFFFF",
                            margin: "0 0 6px",
                            lineHeight: 1.2,
                          }}
                        >
                          {jam.content}
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
                          {jam.timestamp}
                        </p>
                        {jam.note.split("\n\n").map((para, i, arr) => (
                          <p
                            key={i}
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
                        {jam.url && (
                          <a
                            href={jam.url}
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
                              borderBottom: "1px solid #555555",
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
                    </div>
                  </div>
                );
              })()}
          </>
        )}
      </div>

      <NewJamModal
        isOpen={isJamModalOpen}
        onClose={() => setIsJamModalOpen(false)}
      />

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {featured && (
          <div style={{ padding: "32px 0 0" }}>
            <FeaturedPiece
              piece={featured}
              onClick={
                !featured.isRevealed && !isOwnProfile
                  ? () => {}
                  : !featured.isRevealed && isOwnProfile
                    ? () => router.push(`/write/${featured.id}`)
                    : () => router.push(`/read/${featured.id}`)
              }
              isOwnProfile={isOwnProfile}
              onDelete={() =>
                setDeleteTarget({ id: featured.id, title: featured.title })
              }
            />
          </div>
        )}

        {rest.length > 0 && (
          <PiecesGrid
            pieces={rest}
            isOwnProfile={isOwnProfile}
            onDelete={(id: string, title: string | null) =>
              setDeleteTarget({ id, title })
            }
          />
        )}
      </div>
    </div>
  );
}
