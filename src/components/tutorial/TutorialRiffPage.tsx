"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProgressCard from "@/components/riffs/ProgressCard";
import PieceCard from "@/components/riffs/PieceCard";
import RevealCelebration from "@/components/riffs/RevealCelebration";
import CountdownTimer from "@/components/riffs/CountdownTimer";
import NoiseBackground from "@/components/NoiseBackground";
import CTAButton from "@/components/CTAButton";
import TutorialExitButton from "@/components/tutorial/TutorialExitButton";
import TutorialProgressBanner from "@/components/tutorial/TutorialProgressBanner";
import {
  TUTORIAL_RIFF,
  TUTORIAL_PIECE,
  TUTORIAL_FRIEND,
  TUTORIAL_PIECE_BASEBALL,
  TUTORIAL_PIECE_JAPAN,
  getTutorialDates,
} from "@/lib/tutorial";

type TutorialStep = "" | "submitted" | "revealed" | "read";

interface TutorialRiffPageProps {
  step: TutorialStep;
  clubId?: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
}

export default function TutorialRiffPage({
  step,
  clubId,
  userId,
  userName,
  userAvatar,
}: TutorialRiffPageProps) {
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);
  const {
    createdAt,
    deadline,
    deadlineDate,
    pieceSubmittedAt,
    friendPieceUpdatedAt,
  } = getTutorialDates();

  useEffect(() => {
    if (step === "read") {
      sessionStorage.removeItem("tutorial-step");
    } else {
      sessionStorage.setItem("tutorial-step", step);
    }
  }, [step]);

  useEffect(() => {
    if (
      step === "revealed" &&
      sessionStorage.getItem("tutorial-celebrate") === "1"
    ) {
      sessionStorage.removeItem("tutorial-celebrate");
      setShowCelebration(true);
    }
  }, [step]);

  const handleCelebrationDismiss = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const handleStartWriting = () => {
    router.push(`/tutorial/write?clubId=${clubId}`);
  };

  const handleReadyToRiff = () => {
    localStorage.setItem(`tutorial-complete-user-${userId}`, "1");
    router.push(
      clubId && clubId !== "no-club" ? `/clubs/${clubId}` : "/no-club"
    );
  };

  const handleReveal = () => {
    sessionStorage.setItem("tutorial-celebrate", "1");
    router.push(`/tutorial/riff?step=revealed&clubId=${clubId}`);
  };

  const userForCard = {
    id: "tutorial-user",
    name: userName || "You",
    avatarUrl: userAvatar,
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {showCelebration && (
        <RevealCelebration onDismiss={handleCelebrationDismiss} />
      )}

      {/* NavBar — mirrors real app navbar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "#000000",
          display: "flex",
          alignItems: "center",
          padding: "16px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            width: "100%",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Image
            src="/images/landing/riff_logo.svg"
            alt="Riff"
            width={55}
            height={36}
          />
          <TutorialExitButton clubId={clubId} step={step} />
        </div>
      </nav>

      {/* Main content — matches real riff page padding */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        <div style={{ position: "relative" }}>
          <TutorialProgressBanner step={step} />
          {step === "read" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CTAButton onClick={handleReadyToRiff} accentColor="#955CB5">
                Ready to riff
              </CTAButton>
            </div>
          )}
        </div>

        {/* Riff header — left/right split, same as real riff page */}
        <div
          className="tutorial-riff-header"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          {/* Left — title, dates, prompt */}
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
                {TUTORIAL_RIFF.title}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                }}
              >
                Deadline: {deadline}
              </p>
            </div>

            {/* Prompt */}
            <div
              style={{ borderLeft: "2px solid #000000", paddingLeft: "16px" }}
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
                {TUTORIAL_RIFF.prompt}
              </p>
            </div>
          </div>

          {/* Right — CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              minWidth: "200px",
            }}
          >
            {step === "" && (
              <>
                <CTAButton onClick={handleStartWriting} accentColor="#955CB5">
                  Start writing
                </CTAButton>
                <CountdownTimer deadline={deadlineDate} />
              </>
            )}

            {step === "submitted" && (
              <>
                <CTAButton onClick={handleReveal} accentColor="#955CB5">
                  Reveal riff
                </CTAButton>
                <CountdownTimer deadline={deadlineDate} />
              </>
            )}

            {(step === "revealed" || step === "read") && (
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
                  Revealed {createdAt}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress cards — initial step */}
        {step === "" && (
          <div
            style={{
              marginTop: "48px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            <ProgressCard user={userForCard} piece={null} />
            <ProgressCard
              user={TUTORIAL_FRIEND}
              piece={{
                id: TUTORIAL_PIECE_BASEBALL.id,
                title: TUTORIAL_PIECE_BASEBALL.title,
                wordCount: TUTORIAL_PIECE_BASEBALL.wordCount,
                updatedAt: new Date().toISOString(),
                submittedAt: null,
                activityLabel: "Today",
              }}
            />
            <ProgressCard
              user={TUTORIAL_FRIEND}
              piece={{
                id: TUTORIAL_PIECE_JAPAN.id,
                title: TUTORIAL_PIECE_JAPAN.title,
                wordCount: TUTORIAL_PIECE_JAPAN.wordCount,
                updatedAt: new Date().toISOString(),
                submittedAt: null,
                activityLabel: "Yesterday",
              }}
            />
          </div>
        )}

        {/* Progress cards — submitted step */}
        {step === "submitted" && (
          <div
            style={{
              marginTop: "48px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            <ProgressCard
              user={userForCard}
              piece={{
                id: TUTORIAL_PIECE.id,
                title: TUTORIAL_PIECE.title,
                wordCount: TUTORIAL_PIECE.wordCount,
                updatedAt: pieceSubmittedAt,
                submittedAt: pieceSubmittedAt,
                coverImage: TUTORIAL_PIECE.coverImage,
              }}
            />
            <ProgressCard
              user={TUTORIAL_FRIEND}
              piece={{
                id: TUTORIAL_PIECE_BASEBALL.id,
                title: TUTORIAL_PIECE_BASEBALL.title,
                wordCount: TUTORIAL_PIECE_BASEBALL.wordCount,
                updatedAt: pieceSubmittedAt,
                submittedAt: pieceSubmittedAt,
                coverImage: TUTORIAL_PIECE_BASEBALL.coverImage,
              }}
            />
            <ProgressCard
              user={TUTORIAL_FRIEND}
              piece={{
                id: TUTORIAL_PIECE_JAPAN.id,
                title: TUTORIAL_PIECE_JAPAN.title,
                wordCount: TUTORIAL_PIECE_JAPAN.wordCount,
                updatedAt: pieceSubmittedAt,
                submittedAt: pieceSubmittedAt,
                coverImage: TUTORIAL_PIECE_JAPAN.coverImage,
              }}
            />
          </div>
        )}

        {/* Piece cards — revealed step */}
        {(step === "revealed" || step === "read") && (
          <div
            style={{
              marginTop: "48px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            <PieceCard
              piece={{
                id: TUTORIAL_PIECE.id,
                title: TUTORIAL_PIECE.title,
                coverImage: TUTORIAL_PIECE.coverImage,
                wordCount: TUTORIAL_PIECE.wordCount,
                commentCount: 3,
                author: {
                  id: "tutorial-user",
                  name: userName || "You",
                  avatarUrl: userAvatar,
                },
              }}
              isRead
              isOwnPiece
              onClick={() => router.push(`/tutorial/read?clubId=${clubId}`)}
            />
            <PieceCard
              piece={{
                id: TUTORIAL_PIECE_BASEBALL.id,
                title: TUTORIAL_PIECE_BASEBALL.title,
                coverImage: TUTORIAL_PIECE_BASEBALL.coverImage,
                author: TUTORIAL_FRIEND,
              }}
              isRead
              label="Sample Piece"
              onClick={() => {}}
            />
            <PieceCard
              piece={{
                id: TUTORIAL_PIECE_JAPAN.id,
                title: TUTORIAL_PIECE_JAPAN.title,
                coverImage: TUTORIAL_PIECE_JAPAN.coverImage,
                author: TUTORIAL_FRIEND,
              }}
              isRead
              label="Sample Piece"
              onClick={() => {}}
            />
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .tutorial-riff-header {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .tutorial-riff-header > div:last-child {
            width: 100% !important;
            min-width: 0 !important;
          }
          .tutorial-riff-header > div:last-child button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
