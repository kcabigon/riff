"use client";

import confetti from "canvas-confetti";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import TutorialStage from "./TutorialStage";
import NoiseBackground from "@/components/NoiseBackground";
import {
  BRUSH_FILTERS,
  Ease,
  PAPER_NOISE_BG,
  PAPER_WHITE,
  Scene,
  SCENES,
  rangeProgress,
  sceneRise,
} from "./tutorial-utils";

const CANVAS_W = 390;
const CANVAS_H = 780;

// Mobile scenes split the desktop "write" scene into two swipeable scenes
// mirroring the two phases on desktop:
//   write-a (25–33s): riff page still showing + "title/word count visible"
//   write   (33–39s): editor slides in + type transition + lock badge
const writeScene = SCENES.find((s) => s.id === "write")!;

const MOBILE_SCENES: Scene[] = [
  SCENES[0], // intro: 0–6, autoAdvance
  { ...SCENES[1], readyAt: 4.0 }, // club: 6–16
  { ...SCENES[2], readyAt: 4.0 }, // riff: 16–25
  { ...writeScene, start: 25, end: 39, readyAt: 13 }, // write: 25–39, both phases auto-flow
  { ...SCENES[4], readyAt: 7.0 }, // reveal: 39–49
  { ...SCENES[5], readyAt: 7.0 }, // read: 49–59
];

function BrushHighlight({
  children,
  color = "#EECF01",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        padding: "0 10px",
        zIndex: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/tagline_vector.svg"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "12%",
          bottom: "-4%",
          width: "100%",
          height: "92%",
          filter: BRUSH_FILTERS[color] ?? "none",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
}

// ─── Hand-drawn circle annotation

function HandDrawnCircle({
  cx,
  cy,
  rx,
  ry,
  progress,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  progress: number;
  opacity?: number;
}) {
  const d =
    `M ${cx - rx} ${cy} ` +
    `A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} ` +
    `A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;
  const totalLen = 100;
  const dashOffset = totalLen * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity,
        zIndex: 4,
        overflow: "visible",
      }}
    >
      <path
        d={d}
        pathLength={totalLen}
        fill="none"
        stroke={PAPER_WHITE}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={totalLen}
        strokeDashoffset={dashOffset}
        opacity={0.9}
      />
      <path
        d={d}
        pathLength={totalLen}
        fill="none"
        stroke="#000"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={totalLen}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
}

// ─── Intro scene (portrait canvas — 390×780 center)

const MOBILE_INTRO_COPIES = Array.from({ length: 26 }, (_, i) => {
  const s1 = ((i * 9301 + 49297) % 233280) / 233280;
  const s2 = ((i * 73 + 19) % 100) / 100;
  const s3 = ((i * 6271 + 2499) % 4789) / 4789;
  const s4 = ((i * 1181 + 5003) % 7919) / 7919;
  const s5 = ((i * 3571 + 1009) % 1597) / 1597;
  const s6 = ((i * 4973 + 3571) % 6271) / 6271;
  return {
    x: 24 + s1 * 342,
    y: 58 + s2 * 663,
    rot: (s3 - 0.5) * 56,
    size: 36 + s4 * 56,
    delay: s5 * 0.18,
    speed: 0.75 + s6 * 0.6,
  };
});

function MobileIntroScene({
  time,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  const CX = 195;
  const CY = 390;
  const centerIn = rangeProgress(time, 0, 0.5, Ease.out);
  const centerOut = rangeProgress(time, 4.4, 5.2, Ease.out);
  const centerOpacity = centerIn * (1 - centerOut);
  const orbitT = rangeProgress(time, 2.2, 3.8, Ease.linear);
  const collapseT = rangeProgress(time, 3.8, 4.6, Ease.inOut);

  return (
    <>
      <NoiseBackground fillMode="cover" />
      {MOBILE_INTRO_COPIES.map((copy, i) => {
        const burstT = rangeProgress(time, 1.0 + copy.delay, 2.0, Ease.outBack);
        const prog = burstT * (1 - collapseT);
        const copyOpacity = Math.min(burstT, 1 - collapseT);
        if (copyOpacity <= 0) return null;
        const θ = orbitT * Math.PI * 2 * copy.speed;
        const dx = copy.x - CX;
        const dy = copy.y - CY;
        const targetX = CX + dx * Math.cos(θ) - dy * Math.sin(θ);
        const targetY = CY + dx * Math.sin(θ) + dy * Math.cos(θ);
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src="/images/riff_wordmark_black_outline.svg"
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              width: copy.size,
              height: "auto",
              left: CX + (targetX - CX) * prog,
              top: CY + (targetY - CY) * prog,
              transform: `translate(-50%, -50%) rotate(${copy.rot * prog}deg)`,
              opacity: copyOpacity,
              pointerEvents: "none",
            }}
          />
        );
      })}
      {centerOpacity > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/riff_wordmark_black_outline.svg"
          alt="Riff"
          style={{
            position: "absolute",
            width: 140,
            height: "auto",
            left: 195,
            top: 390,
            transform: "translate(-50%, -50%)",
            opacity: centerOpacity,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}

// ─── Shared mobile layout: headline top, screenshot below, note at bottom

interface MobileSceneLayoutProps {
  time: number;
  scene: Scene;
  screenshotSrc: string;
  screenshotWidth: number;
  screenshotHeight: number;
  screenshotRotate?: number;
  note: string;
  children?: React.ReactNode;
}

function MobileSceneLayout({
  time,
  scene,
  screenshotSrc,
  screenshotWidth,
  screenshotHeight,
  screenshotRotate = -1.2,
  note,
  children,
}: MobileSceneLayoutProps) {
  const env = sceneRise(time, scene.start, 0.5);

  // Headline line animations
  const headlineStart = scene.start + 0.3;
  const headlineLineDur = 0.55;
  const headlineLineDelay = 0.4;

  // Screenshot enter
  const screenIn = rangeProgress(
    time,
    scene.start,
    scene.start + 0.7,
    Ease.outBack
  );

  // Note reveal (word by word)
  const noteStart = scene.start + 2.2;
  const noteWords = note.split(/\s+/).filter(Boolean);

  // Constrain screenshot to fit the allotted zone (y:210–510 = 300px tall, 358px wide)
  const maxW = 358;
  const maxH = 290;
  const ratio = screenshotWidth / screenshotHeight;
  let dispW = maxW;
  let dispH = dispW / ratio;
  if (dispH > maxH) {
    dispH = maxH;
    dispW = dispH * ratio;
  }
  const screenX = (CANVAS_W - dispW) / 2;
  const screenY = 240;

  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER_WHITE }}>
      {/* Paper noise */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: PAPER_NOISE_BG,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 75,
          maxWidth: CANVAS_W - 48,
          opacity: env,
          transform: `translateY(${(1 - env) * 10}px)`,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {scene.headline.map((line, i) => {
          const lineStart = headlineStart + i * headlineLineDelay;
          const lineIn = rangeProgress(
            time,
            lineStart,
            lineStart + headlineLineDur,
            Ease.out
          );
          const isHighlight = i === scene.headline.length - 1;
          return (
            <div
              key={i}
              style={{
                fontFamily: "var(--font-dm-serif-text), Georgia, serif",
                fontWeight: 400,
                fontSize: 44,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                opacity: lineIn,
                transform: `translateY(${(1 - lineIn) * 12}px)`,
                alignSelf: "flex-start",
                color: "#000",
              }}
            >
              {isHighlight ? (
                <BrushHighlight color={scene.highlightColor}>
                  {line}
                </BrushHighlight>
              ) : (
                line
              )}
            </div>
          );
        })}
      </div>

      {/* Screenshot polaroid */}
      {screenIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: screenX,
            top: screenY,
            width: dispW,
            height: dispH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `rotate(${screenshotRotate}deg) scale(${screenIn})`,
            transformOrigin: "center",
            overflow: "hidden",
          }}
        >
          <Image
            src={screenshotSrc}
            alt=""
            width={screenshotWidth}
            height={screenshotHeight}
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
          {children}
        </div>
      )}

      {/* Handwritten note */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 550,
          maxWidth: CANVAS_W - 48,
          fontFamily: "var(--font-over-the-rainbow), cursive",
          fontSize: 26,
          color: "#000",
          lineHeight: 1.3,
          transform: `rotate(${-1 + (scene.id.charCodeAt(0) % 3)}deg)`,
          pointerEvents: "none",
          textShadow: `0 0 6px ${PAPER_WHITE}, 0 0 6px ${PAPER_WHITE}`,
          zIndex: 5,
        }}
      >
        {noteWords.map((word, wi) => {
          const wIn = rangeProgress(
            time,
            noteStart + wi * 0.14,
            noteStart + wi * 0.14 + 0.18,
            Ease.out
          );
          return (
            <span
              key={wi}
              style={{
                display: "inline-block",
                opacity: wIn,
                transform: `translateY(${(1 - wIn) * 5}px)`,
                marginRight: wi < noteWords.length - 1 ? "0.25em" : 0,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Individual scene components

function MobileClubScene({
  time,
  scene,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  // Circle draws in after the screenshot lands, just before the note appears
  const circleProgress = rangeProgress(
    time,
    scene.start + 3.8,
    scene.start + 4.6,
    Ease.out
  );
  return (
    <MobileSceneLayout
      time={time}
      scene={scene}
      screenshotSrc="/tutorial/screens/club-page.png"
      screenshotWidth={720}
      screenshotHeight={483}
      screenshotRotate={1.2}
      note="this is the club page, and here's you and your friends"
    >
      {/* Circle the club header — "LIT KIDS" title + avatars + stats */}
      <HandDrawnCircle
        cx={179}
        cy={76}
        rx={115}
        ry={40}
        progress={circleProgress}
      />
    </MobileSceneLayout>
  );
}

function MobileRiffScene({
  time,
  scene,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  // Circle draws in after screenshot lands, just before the note appears
  const circleProgress = rangeProgress(
    time,
    scene.start + 3.8,
    scene.start + 4.6,
    Ease.out
  );
  return (
    <MobileSceneLayout
      time={time}
      scene={scene}
      screenshotSrc="/tutorial/screens/riff-page.png"
      screenshotWidth={2272}
      screenshotHeight={1440}
      screenshotRotate={-1.4}
      note="this is the riff page, everyone writes before time runs out"
    >
      {/* Circle the CTA + countdown — top-right corner of riff page */}
      <HandDrawnCircle
        cx={282}
        cy={43}
        rx={60}
        ry={26}
        progress={circleProgress}
      />
    </MobileSceneLayout>
  );
}

const WRITE_TYPE = {
  word1: "parallel.",
  word2: "private.",
  reverseOffset: 4.8,
  charDur: 0.08,
};

function MobileWriteScene({
  time,
  scene,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  const env = sceneRise(time, scene.start, 0.5);
  const headlineStart = scene.start + 0.3;
  const headlineDur = 0.55;
  const headlineDelay = 0.4;

  const line0In = rangeProgress(
    time,
    headlineStart,
    headlineStart + headlineDur,
    Ease.out
  );
  const line1In = rangeProgress(
    time,
    headlineStart + headlineDelay,
    headlineStart + headlineDelay + headlineDur,
    Ease.out
  );

  // Type transition: "parallel." erases, "private." types in — matches desktop timing
  const { word1, word2, reverseOffset, charDur } = WRITE_TYPE;
  const reverseStart = scene.start + reverseOffset;
  const reverseDur = word1.length * charDur;
  let displayText = word1;
  if (time >= reverseStart) {
    const elapsed = time - reverseStart;
    if (elapsed < reverseDur) {
      const charsLeft = Math.max(
        0,
        word1.length - Math.floor(elapsed / charDur)
      );
      displayText = word1.slice(0, charsLeft);
    } else {
      const forwardElapsed = elapsed - reverseDur;
      const charsTyped = Math.min(
        word2.length,
        Math.floor(forwardElapsed / charDur) + 1
      );
      displayText = word2.slice(0, charsTyped);
    }
  }

  const screenY = 240;
  const accentColor = scene.highlightColor;

  // Riff page — phase A (enters at start, exits at sceneT 8.0)
  const riffRatio = 2272 / 1440;
  const riffDispW = 358;
  const riffDispH = riffDispW / riffRatio;
  const riffScreenX = (CANVAS_W - riffDispW) / 2;
  const riffEnter = rangeProgress(
    time,
    scene.start,
    scene.start + 0.7,
    Ease.outBack
  );
  const riffExitStart = scene.start + 6.3;
  const riffExit = rangeProgress(
    time,
    riffExitStart,
    riffExitStart + 0.9,
    Ease.inOut
  );
  const riffOpacity = riffEnter * (1 - riffExit);
  const riffScale = riffEnter * (1 + riffExit * 0.55);

  // Write page — phase B (enters at sceneT 8.5, matches desktop writeIn)
  const maxW = 358;
  const maxH = 290;
  const writeRatio = 2020 / 1670;
  let writeDispW = maxW;
  let writeDispH = writeDispW / writeRatio;
  if (writeDispH > maxH) {
    writeDispH = maxH;
    writeDispW = writeDispH * writeRatio;
  }
  const writeScreenX = (CANVAS_W - writeDispW) / 2;
  const writeInStart = scene.start + 6.8;
  const writeIn = rangeProgress(
    time,
    writeInStart,
    writeInStart + 1.0,
    Ease.outBack
  );
  const writeTy = (1 - writeIn) * 110;
  const writeScale = 0.88 + 0.12 * writeIn;
  const writeRot = 4 - 2.6 * writeIn;

  // Lock badge
  const lockSettleAt = scene.start + 9.8;
  const lockT = time - lockSettleAt;
  const stampIn = lockT >= 0 ? rangeProgress(lockT, 0, 0.4, Ease.outBack) : 0;
  const wobbleDecay =
    stampIn > 0 ? Math.max(0, 1 - Math.max(0, lockT - 0.4) / 0.6) : 0;
  const wobble =
    wobbleDecay > 0 ? Math.sin((lockT - 0.4) * 28) * wobbleDecay * 5 : 0;
  const lockScale = stampIn > 0 ? 2.2 - 1.2 * stampIn : 0;
  const ring1 = lockT >= 0 ? rangeProgress(lockT, 0.25, 0.95, Ease.out) : 0;
  const ring2 = lockT >= 0 ? rangeProgress(lockT, 0.4, 1.15, Ease.out) : 0;

  // Note 1 fades in at sceneT 2.2, fades out at sceneT 5.8
  const note1FadeOut = rangeProgress(
    time,
    scene.start + 5.8,
    scene.start + 6.5,
    Ease.out
  );
  const note1Words = [
    "your",
    "title",
    "and",
    "word",
    "count",
    "are",
    "visible",
    "to",
    "friends",
  ];

  // Note 2 appears at sceneT 7.8 after write page is in
  const note2Start = scene.start + 7.8;
  const note2Words = [
    "your",
    "writing",
    "stays",
    "private",
    "until",
    "the",
    "reveal",
  ];

  const noteBase: React.CSSProperties = {
    position: "absolute",
    left: 24,
    top: 570,
    maxWidth: CANVAS_W - 48,
    fontFamily: "var(--font-over-the-rainbow), cursive",
    fontSize: 26,
    color: "#000",
    lineHeight: 1.3,
    pointerEvents: "none",
    textShadow: `0 0 6px ${PAPER_WHITE}, 0 0 6px ${PAPER_WHITE}`,
    zIndex: 5,
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER_WHITE }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: PAPER_NOISE_BG,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Headline — persists through both phases, type transition at sceneT 6.5 */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 75,
          maxWidth: CANVAS_W - 48,
          opacity: env,
          transform: `translateY(${(1 - env) * 10}px)`,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-dm-serif-text), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: line0In,
            transform: `translateY(${(1 - line0In) * 12}px)`,
            alignSelf: "flex-start",
            color: "#000",
          }}
        >
          Write in
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-serif-text), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: line1In,
            alignSelf: "flex-start",
            color: "#000",
          }}
        >
          {displayText ? (
            <BrushHighlight color={accentColor}>{displayText}</BrushHighlight>
          ) : null}
        </div>
      </div>

      {/* Riff page — phase A, zoom-punches out at sceneT 8 */}
      {riffOpacity > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: riffScreenX,
            top: screenY,
            width: riffDispW,
            height: riffDispH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `rotate(1.0deg) scale(${riffScale})`,
            transformOrigin: "center",
            opacity: riffOpacity,
            overflow: "hidden",
          }}
        >
          <Image
            src="/tutorial/screens/riff-page.png"
            alt="Riff active riff page"
            width={2272}
            height={1440}
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
          {/* Circle the 3-piece card row, fades out with the riff page */}
          <HandDrawnCircle
            cx={179}
            cy={132}
            rx={155}
            ry={56}
            progress={rangeProgress(
              time,
              scene.start + 3.8,
              scene.start + 4.6,
              Ease.out
            )}
            opacity={1 - riffExit}
          />
        </div>
      )}

      {/* Write page — phase B, slides in at sceneT 8.5 */}
      {writeIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: writeScreenX,
            top: screenY,
            width: writeDispW,
            height: writeDispH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `translateY(${writeTy}px) rotate(${writeRot}deg) scale(${writeScale})`,
            transformOrigin: "center",
            opacity: writeIn,
            overflow: "hidden",
          }}
        >
          <Image
            src="/tutorial/screens/write-page.png"
            alt="Riff draft editor"
            width={2020}
            height={1670}
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </div>
      )}

      {/* Lock badge — stamps in at sceneT 11.5 */}
      {stampIn > 0 && (
        <div
          style={{
            position: "absolute",
            left: writeScreenX + writeDispW / 2,
            top: screenY + writeDispH / 2,
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          {ring1 > 0 && ring1 < 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "4px solid #000",
                transform: `translate(-50%, -50%) scale(${0.45 + ring1 * 1.85})`,
                opacity: 0.55 * (1 - ring1),
              }}
            />
          )}
          {ring2 > 0 && ring2 < 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: `4px solid ${accentColor}`,
                transform: `translate(-50%, -50%) scale(${0.45 + ring2 * 1.55})`,
                opacity: 0.85 * (1 - ring2),
              }}
            />
          )}
          <div
            style={{
              transform: `translate(-50%, -50%) scale(${lockScale}) rotate(${-10 + wobble}deg)`,
              transformOrigin: "center",
              opacity: stampIn,
              filter: "drop-shadow(3px 3px 0 rgba(0,0,0,0.9))",
            }}
          >
            <svg
              width="60"
              height="72"
              viewBox="0 0 64 80"
              style={{ display: "block" }}
            >
              <path
                d="M 18 32 V 22 a 14 14 0 0 1 28 0 V 32"
                fill="none"
                stroke="#000"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <rect
                x="8"
                y="32"
                width="48"
                height="42"
                rx="5"
                fill="#000"
                stroke="#000"
                strokeWidth="2"
              />
              <circle cx="32" cy="49" r="4.5" fill={accentColor} />
              <rect
                x="29.6"
                y="49"
                width="4.8"
                height="13"
                rx="1"
                fill={accentColor}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Note 1 — phase A, fades out as riff page exits */}
      <div
        style={{
          ...noteBase,
          transform: "rotate(1.0deg)",
          opacity: 1 - note1FadeOut,
        }}
      >
        {note1Words.map((word, wi) => {
          const wIn = rangeProgress(
            time,
            scene.start + 2.2 + wi * 0.14,
            scene.start + 2.2 + wi * 0.14 + 0.18,
            Ease.out
          );
          return (
            <span
              key={wi}
              style={{
                display: "inline-block",
                opacity: wIn,
                transform: `translateY(${(1 - wIn) * 5}px)`,
                marginRight: wi < note1Words.length - 1 ? "0.25em" : 0,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Note 2 — phase B, appears after write page lands */}
      <div style={{ ...noteBase, transform: "rotate(-1.0deg)" }}>
        {note2Words.map((word, wi) => {
          const wIn = rangeProgress(
            time,
            note2Start + wi * 0.14,
            note2Start + wi * 0.14 + 0.18,
            Ease.out
          );
          return (
            <span
              key={wi}
              style={{
                display: "inline-block",
                opacity: wIn,
                transform: `translateY(${(1 - wIn) * 5}px)`,
                marginRight: wi < note2Words.length - 1 ? "0.25em" : 0,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MobileRevealScene({
  time,
  scene,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  const hasFiredConfetti = useRef(false);
  const sceneT = time - scene.start;

  const COVER_IN = 0.4,
    COVER_OUT = 3.5,
    COVER_OUT_DUR = 0.7;
  const PAGE_IN = 3.6,
    PAGE_IN_DUR = 0.7;
  const BURST_START = 1.8;
  const shouldFire = sceneT >= BURST_START;

  useEffect(() => {
    if (!shouldFire || hasFiredConfetti.current) return;
    hasFiredConfetti.current = true;
    const colors = [
      "#00FF66",
      "#01EFFC",
      "#EECF01",
      "#FF6B35",
      "#C01582",
      "#955CB5",
    ];
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 60,
      origin: { x: 0.3, y: 0.65 },
      colors,
    });
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 60,
      origin: { x: 0.7, y: 0.65 },
      colors,
    });
    const timer = setTimeout(
      () =>
        confetti({
          particleCount: 50,
          angle: 90,
          spread: 70,
          origin: { x: 0.5, y: 0.55 },
          colors,
        }),
      300
    );
    return () => clearTimeout(timer);
  }, [shouldFire]);

  const coverIn = rangeProgress(sceneT, COVER_IN, COVER_IN + 0.5, Ease.outBack);
  const coverOut = rangeProgress(
    sceneT,
    COVER_OUT,
    COVER_OUT + COVER_OUT_DUR,
    Ease.inOut
  );
  const coverOpacity = coverIn * (1 - coverOut);

  const pageIn = rangeProgress(
    sceneT,
    PAGE_IN,
    PAGE_IN + PAGE_IN_DUR,
    Ease.out
  );
  const pageTy = (1 - pageIn) * 16;

  // Cover: 480×560 ratio = 6:7. Fit in maxW=280, maxH=290
  const coverRatio = 480 / 560;
  let cW = 280;
  let cH = cW / coverRatio;
  if (cH > 310) {
    cH = 310;
    cW = cH * coverRatio;
  }
  const coverX = (CANVAS_W - cW) / 2;
  const coverY = 240;

  // Reveal page: 720×456 ratio. Fit in maxW=358, maxH=260
  const pageRatio = 720 / 456;
  let pW = 358;
  let pH = pW / pageRatio;
  if (pH > 260) {
    pH = 260;
    pW = pH * pageRatio;
  }
  const pageX = (CANVAS_W - pW) / 2;
  const pageY = 240;

  const env = sceneRise(time, scene.start, 0.5);
  const headlineStart = scene.start + 0.3;
  const line0In = rangeProgress(
    time,
    headlineStart,
    headlineStart + 0.55,
    Ease.out
  );
  const line1In = rangeProgress(
    time,
    headlineStart + 0.4,
    headlineStart + 0.95,
    Ease.out
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER_WHITE }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: PAPER_NOISE_BG,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 75,
          maxWidth: CANVAS_W - 48,
          opacity: env,
          transform: `translateY(${(1 - env) * 10}px)`,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-dm-serif-text), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: line0In,
            transform: `translateY(${(1 - line0In) * 12}px)`,
            color: "#000",
          }}
        >
          Then —
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-serif-text), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: line1In,
            color: "#000",
          }}
        >
          <BrushHighlight color={scene.highlightColor}>
            the reveal.
          </BrushHighlight>
        </div>
      </div>

      {/* Cover card */}
      {coverOpacity > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: coverX,
            top: coverY,
            width: cW,
            height: cH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `rotate(-1.5deg) scale(${coverIn})`,
            transformOrigin: "center",
            opacity: coverOpacity,
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <Image
            src="/tutorial/screens/reveal-cover.png"
            alt="Riff volume cover"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
      )}

      {/* Reveal page */}
      {pageIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: pageX,
            top: pageY,
            width: pW,
            height: pH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `translateY(${pageTy}px) rotate(1.2deg)`,
            opacity: pageIn,
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <Image
            src="/tutorial/screens/reveal-page.png"
            alt="Riff post-reveal page"
            width={720}
            height={456}
            priority
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      )}

      {/* Note */}
      {(() => {
        const noteWords = [
          "once everyone submits,",
          "pieces unlock simultaneously",
        ];
        const noteStart = scene.start + 5.5;
        return (
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 550,
              maxWidth: CANVAS_W - 48,
              fontFamily: "var(--font-over-the-rainbow), cursive",
              fontSize: 26,
              color: "#000",
              lineHeight: 1.3,
              transform: "rotate(-0.5deg)",
              pointerEvents: "none",
              textShadow: `0 0 6px ${PAPER_WHITE}, 0 0 6px ${PAPER_WHITE}`,
              zIndex: 5,
            }}
          >
            {noteWords.map((phrase, pi) => (
              <div key={pi}>
                {phrase.split(/\s+/).map((word, wi) => {
                  const idx =
                    noteWords
                      .slice(0, pi)
                      .join(" ")
                      .split(/\s+/)
                      .filter(Boolean).length + wi;
                  const wIn = rangeProgress(
                    time,
                    noteStart + idx * 0.14,
                    noteStart + idx * 0.14 + 0.18,
                    Ease.out
                  );
                  return (
                    <span
                      key={wi}
                      style={{
                        display: "inline-block",
                        opacity: wIn,
                        transform: `translateY(${(1 - wIn) * 5}px)`,
                        marginRight: "0.25em",
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Read scene with cascading comment cards

const MOBILE_READ_COMMENTS = [
  {
    name: "Chris",
    color: "#FF6B35",
    text: "Not a Dodger fan, but Freddie's walk off was pretty dope",
    x: 20,
    y: 60,
    rot: -2,
    delay: 4.5,
    w: 200,
  },
  {
    name: "Derek",
    color: "#EECF01",
    text: "Field of Dreams is the best movie of all-time",
    x: 90,
    y: 140,
    rot: 2,
    delay: 5.4,
    w: 190,
  },
  {
    name: "Kyla",
    color: "#01EFFC",
    text: "I can't wait to see Riv grow as a baseball player",
    x: 30,
    y: 215,
    rot: -1.5,
    delay: 6.3,
    w: 195,
  },
];

function MobileReadScene({
  time,
  scene,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  const sceneT = time - scene.start;

  const screenIn = rangeProgress(
    time,
    scene.start,
    scene.start + 0.7,
    Ease.outBack
  );
  const overlayIn = rangeProgress(sceneT, 3.8, 4.6, Ease.out);

  // Read page: 760×628. Fit in maxW=358, maxH=290
  const maxW = 358;
  const maxH = 290;
  const ratio = 760 / 628;
  let dispW = maxW;
  let dispH = dispW / ratio;
  if (dispH > maxH) {
    dispH = maxH;
    dispW = dispH * ratio;
  }
  const screenX = (CANVAS_W - dispW) / 2;
  const screenY = 240;

  const env = sceneRise(time, scene.start, 0.5);
  const headlineStart = scene.start + 0.3;

  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER_WHITE }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: PAPER_NOISE_BG,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Headline: 3 lines */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 75,
          maxWidth: CANVAS_W - 48,
          opacity: env,
          transform: `translateY(${(1 - env) * 10}px)`,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {scene.headline.map((line, i) => {
          const lineStart = headlineStart + i * 0.4;
          const lineIn = rangeProgress(
            time,
            lineStart,
            lineStart + 0.55,
            Ease.out
          );
          const isHighlight = i === scene.headline.length - 1;
          return (
            <div
              key={i}
              style={{
                fontFamily: "var(--font-dm-serif-text), Georgia, serif",
                fontWeight: 400,
                fontSize: 44,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                opacity: lineIn,
                transform: `translateY(${(1 - lineIn) * 12}px)`,
                alignSelf: "flex-start",
                color: "#000",
              }}
            >
              {isHighlight ? (
                <BrushHighlight color={scene.highlightColor}>
                  {line}
                </BrushHighlight>
              ) : (
                line
              )}
            </div>
          );
        })}
      </div>

      {/* Read page screenshot with overlay + comment cards */}
      {screenIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: screenX,
            top: screenY,
            width: dispW,
            height: dispH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `rotate(-1.6deg) scale(${screenIn})`,
            transformOrigin: "center",
            overflow: "hidden",
          }}
        >
          <Image
            src="/tutorial/screens/read-page.png"
            alt="Riff reading page"
            width={760}
            height={628}
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
          {overlayIn > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `rgba(0,0,0,${overlayIn * 0.5})`,
                pointerEvents: "none",
              }}
            />
          )}
          {MOBILE_READ_COMMENTS.map((c, i) => {
            const cardIn = rangeProgress(
              sceneT,
              c.delay,
              c.delay + 0.5,
              Ease.outBack
            );
            if (cardIn <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: c.x,
                  top: c.y,
                  width: c.w,
                  transform: `translateY(${(1 - cardIn) * 20}px) rotate(${c.rot}deg) scale(${0.88 + 0.12 * cardIn})`,
                  transformOrigin: "center",
                  opacity: cardIn,
                  background: PAPER_WHITE,
                  border: "2px solid #000",
                  boxShadow: `4px 4px 0 0 ${c.color}`,
                  padding: "6px 10px 10px",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                }}
              >
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: c.color,
                    border: "1.5px solid #000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 11,
                    color: "#000",
                  }}
                >
                  {c.name[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                      marginBottom: 3,
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      lineHeight: 1.3,
                      color: "#000",
                    }}
                  >
                    {c.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 570,
          maxWidth: CANVAS_W - 48,
          fontFamily: "var(--font-over-the-rainbow), cursive",
          fontSize: 26,
          color: "#000",
          lineHeight: 1.3,
          transform: "rotate(1deg)",
          pointerEvents: "none",
          textShadow: `0 0 6px ${PAPER_WHITE}, 0 0 6px ${PAPER_WHITE}`,
          zIndex: 5,
        }}
      >
        {["like", "leaving", "notes", "in", "the", "margin"].map((word, wi) => {
          const wIn = rangeProgress(
            time,
            scene.start + 2.2 + wi * 0.14,
            scene.start + 2.2 + wi * 0.14 + 0.18,
            Ease.out
          );
          return (
            <span
              key={wi}
              style={{
                display: "inline-block",
                opacity: wIn,
                transform: `translateY(${(1 - wIn) * 5}px)`,
                marginRight: wi < 5 ? "0.25em" : 0,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scene component map

const MOBILE_SCENE_COMPONENTS: Record<
  Scene["id"],
  React.ComponentType<{ time: number; scene: Scene; isManual: boolean }>
> = {
  intro: MobileIntroScene,
  club: MobileClubScene,
  riff: MobileRiffScene,
  write: MobileWriteScene,
  reveal: MobileRevealScene,
  read: MobileReadScene,
};

// ─── Orchestrator

export default function MobileWelcomeTutorial({
  onSkip,
}: {
  onSkip: () => void;
}) {
  const duration = MOBILE_SCENES[MOBILE_SCENES.length - 1].end;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <TutorialStage
        scenes={MOBILE_SCENES}
        duration={duration}
        onSkip={onSkip}
        canvasW={CANVAS_W}
        canvasH={CANVAS_H}
      >
        {(time, { isManual }) => {
          let activeScene = MOBILE_SCENES[0];
          for (const s of MOBILE_SCENES) {
            if (time < s.end) {
              activeScene = s;
              break;
            }
          }

          const SceneComp = MOBILE_SCENE_COMPONENTS[activeScene.id];

          return (
            <>
              {/* Paper noise for intro scene */}
              {activeScene.id !== "intro" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/riff_wordmark_black_outline.svg"
                  alt="Riff"
                  style={{
                    position: "absolute",
                    left: 20,
                    top: 18,
                    width: 44,
                    height: "auto",
                    display: "block",
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                />
              )}
              <SceneComp time={time} scene={activeScene} isManual={isManual} />
            </>
          );
        }}
      </TutorialStage>
    </div>
  );
}
