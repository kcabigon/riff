"use client";

import React from "react";
import Image from "next/image";
import TutorialStage from "./TutorialStage";
import {
  Annotation,
  Ease,
  makeIntroCopies,
  PAPER_NOISE_BG,
  PAPER_WHITE,
  Scene,
  SCENES,
  annotationTiming,
  getAnnotations,
  rangeProgress,
  sceneRise,
} from "./tutorial-utils";
import {
  BrushHighlight,
  CommentCard,
  IntroOrbit,
  LockBadge,
  useRevealConfetti,
} from "./tutorial-shared";

// ─── Timing constants (seconds from scene.start)
const T = {
  headlineStart: 0.4,
  headlineLineDelay: 0.55,
  headlineLineDur: 0.7,
};

function HeadlineC({
  scene,
  time,
  isManual,
}: {
  scene: Scene;
  time: number;
  isManual: boolean;
}) {
  const env = isManual ? sceneRise(time, scene.start, 0.5) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: 140,
        maxWidth: 560,
        opacity: env,
        transform: `translateY(${(1 - env) * 12}px)`,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {scene.headline.map((line, i) => {
        const lineStart =
          scene.start + T.headlineStart + i * T.headlineLineDelay;
        const lineIn = rangeProgress(
          time,
          lineStart,
          lineStart + T.headlineLineDur,
          Ease.out
        );
        const isHighlight = i === scene.headline.length - 1;
        return (
          <div
            key={i}
            style={{
              fontFamily: "var(--font-dm-serif-text), Georgia, serif",
              fontWeight: 400,
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              opacity: lineIn,
              transform: `translateY(${(1 - lineIn) * 16}px)`,
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
  );
}

// ─── Intro scene

const INTRO_COPIES = makeIntroCopies({
  xMin: 80,
  xW: 1120,
  yMin: 60,
  yH: 680,
  sizeMin: 70,
  sizeRange: 90,
});

function IntroScene({
  time,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  return (
    <IntroOrbit
      time={time}
      copies={INTRO_COPIES}
      cx={640}
      cy={400}
      centerSize={200}
    />
  );
}

const WRITE_TYPE = {
  word1: "parallel.",
  word2: "private.",
  reverseOffset: 6.5,
  charDur: 0.08,
};

function WriteHeadlineC({ time, scene }: { time: number; scene: Scene }) {
  const env = sceneRise(time, scene.start, 0.5);
  const line0Start = scene.start + T.headlineStart;
  const line0In = rangeProgress(
    time,
    line0Start,
    line0Start + T.headlineLineDur,
    Ease.out
  );
  const line1Start = scene.start + T.headlineStart + T.headlineLineDelay;
  const line1In = rangeProgress(
    time,
    line1Start,
    line1Start + T.headlineLineDur,
    Ease.out
  );

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

  const lineBase = {
    fontFamily: "var(--font-dm-serif-text), Georgia, serif",
    fontWeight: 400,
    fontSize: 72,
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
    alignSelf: "flex-start" as const,
    color: "#000",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: 140,
        maxWidth: 560,
        opacity: env,
        transform: `translateY(${(1 - env) * 12}px)`,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          ...lineBase,
          opacity: line0In,
          transform: `translateY(${(1 - line0In) * 16}px)`,
        }}
      >
        Write in
      </div>
      <div style={{ ...lineBase, opacity: line1In }}>
        {displayText ? (
          <BrushHighlight color={scene.highlightColor}>
            {displayText}
          </BrushHighlight>
        ) : null}
      </div>
    </div>
  );
}

function ArrowNote({
  scene,
  annotation,
  timing,
  time,
  isManual,
}: {
  scene: Scene;
  annotation: Annotation;
  timing: ReturnType<typeof annotationTiming>;
  time: number;
  isManual: boolean;
}) {
  const env = isManual ? sceneRise(time, scene.start, 0.4) : 1;
  const arrowIn = rangeProgress(
    time,
    timing.arrowStart,
    timing.arrowEnd,
    Ease.out
  );

  let arrowExit = 0;
  if (annotation.arrowFadeOut) {
    const fStart = scene.start + annotation.arrowFadeOut.start;
    const fEnd = fStart + annotation.arrowFadeOut.dur;
    arrowExit = rangeProgress(time, fStart, fEnd, Ease.out);
  }
  const arrowOpacity = env * (1 - arrowExit);

  // Word-by-word reveal, split by newlines
  let wordIdx = -1;
  const noteContent = (annotation.note ?? "").split("\n").map((line, li) => {
    const tokens = line.split(/(\s+)/);
    const lineSpans = tokens.map((tok, ti) => {
      if (!tok.length) return null;
      if (/^\s+$/.test(tok)) return <span key={ti}>{tok}</span>;
      wordIdx += 1;
      const w = wordIdx;
      const wIn = rangeProgress(
        time,
        timing.noteStart + w * 0.16,
        timing.noteStart + w * 0.16 + 0.18,
        Ease.out
      );
      return (
        <span
          key={ti}
          style={{
            display: "inline-block",
            opacity: wIn,
            transform: `translateY(${(1 - wIn) * 6}px)`,
          }}
        >
          {tok}
        </span>
      );
    });
    return <div key={li}>{lineSpans}</div>;
  });

  const hasArrow =
    !annotation.noArrow && annotation.arrowFrom && annotation.arrowTo;
  let path = "",
    dashOffset = 100,
    headAngle = 0,
    tx = 0,
    ty = 0;

  if (hasArrow && annotation.arrowFrom && annotation.arrowTo) {
    const [fx, fy] = annotation.arrowFrom;
    [tx, ty] = annotation.arrowTo;
    const midX = fx + (tx - fx) * 0.55;
    const midY = fy + (ty - fy) * 0.55;
    const armLen = Math.hypot(tx - fx, ty - fy);
    const lr = Math.max(16, Math.min(28, armLen * 0.06));
    const lcx = midX,
      lcy = midY - lr * 0.6;
    const ls = [lcx, lcy + lr];
    const p1c1x = fx + (ls[0] - fx) * 0.4 + 30;
    const p1c1y = fy + (ls[1] - fy) * 0.2 - 30;
    const p1c2x = fx + (ls[0] - fx) * 0.7;
    const p1c2y = fy + (ls[1] - fy) * 0.8 + 10;
    const k = lr * 1.4;
    const p3c1x = ls[0] + (tx - ls[0]) * 0.4 - 10;
    const p3c1y = ls[1] + (ty - ls[1]) * 0.2 + 30;
    const p3c2x = ls[0] + (tx - ls[0]) * 0.75;
    const p3c2y = ls[1] + (ty - ls[1]) * 0.8 + 15;
    path =
      `M ${fx} ${fy} ` +
      `C ${p1c1x} ${p1c1y}, ${p1c2x} ${p1c2y}, ${ls[0]} ${ls[1]} ` +
      `C ${lcx + k} ${lcy + lr}, ${lcx + k} ${lcy - lr}, ${lcx} ${lcy - lr} ` +
      `C ${lcx - k} ${lcy - lr}, ${lcx - k} ${lcy + lr}, ${ls[0]} ${ls[1]} ` +
      `C ${p3c1x} ${p3c1y}, ${p3c2x} ${p3c2y}, ${tx} ${ty}`;
    dashOffset = 100 * (1 - arrowIn);
    const dx = tx - p3c2x,
      dy = ty - p3c2y;
    headAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  const headlineBottom = 140 + scene.headline.length * 76;
  const minY = headlineBottom + 24;
  const np = annotation.notePos
    ? {
        x: annotation.notePos.x,
        y: Math.max(annotation.notePos.y, minY),
      }
    : { x: 80, y: minY };

  return (
    <>
      {hasArrow && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: arrowOpacity,
            zIndex: 4,
          }}
        >
          <path
            d={path}
            pathLength="100"
            fill="none"
            stroke={PAPER_WHITE}
            strokeWidth="7"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            opacity={0.9}
          />
          <path
            d={path}
            pathLength="100"
            fill="none"
            stroke="#000"
            strokeWidth="2"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
          {arrowIn > 0.96 && (
            <g transform={`translate(${tx} ${ty}) rotate(${headAngle})`}>
              <path
                d="M-10 -6 L0 0 L-10 6"
                fill="none"
                stroke={PAPER_WHITE}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
              <path
                d="M-10 -6 L0 0 L-10 6"
                fill="none"
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          left: np.x,
          top: np.y,
          fontFamily: "var(--font-over-the-rainbow), cursive",
          fontSize: 30,
          color: "#000",
          lineHeight: 1.25,
          transform: `rotate(${-2 + (scene.id.charCodeAt(0) % 5)}deg)`,
          maxWidth: annotation.maxWidth ?? 380,
          pointerEvents: "none",
          zIndex: 5,
          textShadow: `0 0 6px ${PAPER_WHITE}, 0 0 6px ${PAPER_WHITE}`,
          opacity: env,
        }}
      >
        {noteContent}
      </div>
    </>
  );
}

function PinnedScreen({
  children,
  x,
  y,
  width,
  height,
  rotate = -1.2,
  time,
  scene,
  isManual,
}: {
  children: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate?: number;
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  const env = isManual ? sceneRise(time, scene.start, 0.5) : 1;
  const enterT = rangeProgress(
    time,
    scene.start,
    scene.start + 0.7,
    Ease.outBack
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        background: "#FFF",
        border: "2px solid #000",
        boxShadow: "12px 14px 0 0 rgba(0,0,0,0.85)",
        transform: `rotate(${rotate}deg) scale(${enterT})`,
        transformOrigin: "center",
        opacity: env,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ─── Scene components

function ClubScene({
  time,
  scene,
  isManual,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  return (
    <PinnedScreen
      x={540}
      y={110}
      width={660}
      height={478}
      rotate={1.2}
      time={time}
      scene={scene}
      isManual={isManual}
    >
      <div
        style={{
          position: "relative",
          width: 660,
          height: 478,
          overflow: "hidden",
          background: "#000",
        }}
      >
        <Image
          src="/tutorial/screens/club-page.png"
          alt="Riff club page"
          width={720}
          height={483}
          priority
          style={{
            position: "absolute",
            width: "108%",
            height: "auto",
            left: "-4%",
            top: 0,
            display: "block",
          }}
        />
      </div>
    </PinnedScreen>
  );
}

// Hoisted riff polaroid — persists across scene 2→3 boundary
function RiffPolaroid({ time, isManual }: { time: number; isManual: boolean }) {
  const riffScene = SCENES.find((s) => s.id === "riff")!;
  const writeScene = SCENES.find((s) => s.id === "write")!;
  const tx = writeScene.transition!;

  const visibleStart = riffScene.start - 0.5;
  const riffOutStart = writeScene.start + tx.riffOut.start;
  const riffOutEnd = riffOutStart + tx.riffOut.dur;

  if (time < visibleStart || time > riffOutEnd + 0.05) return null;

  const env = isManual
    ? sceneRise(time, riffScene.start, 0.5)
    : time < writeScene.start
      ? 1
      : 1;
  const enterScale = rangeProgress(
    time,
    riffScene.start,
    riffScene.start + 0.7,
    Ease.outBack
  );
  const exitT = rangeProgress(time, riffOutStart, riffOutEnd, Ease.inOut);

  const opacity = env * (1 - exitT);
  const scale = enterScale * (1 + exitT * 0.55);
  const rotate = -1.4 + exitT * 1.4;

  if (opacity < 0.005) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 110,
        width: 660,
        height: 515,
        background: "#FFF",
        border: "2px solid #000",
        boxShadow: "12px 14px 0 0 rgba(0,0,0,0.85)",
        transform: `rotate(${rotate}deg) scale(${scale})`,
        transformOrigin: "center",
        opacity,
        overflow: "hidden",
        zIndex: 2,
      }}
    >
      <Image
        src="/tutorial/screens/riff-page.png"
        alt="Riff active riff page"
        width={720}
        height={576}
        priority
        style={{
          position: "absolute",
          width: "108%",
          height: "auto",
          left: "-4%",
          top: 0,
          display: "block",
        }}
      />
    </div>
  );
}

function WriteScene(props: { time: number; scene: Scene; isManual: boolean }) {
  const { time, scene } = props;
  const tx = scene.transition!;
  const sceneT = time - scene.start;
  const W = 560,
    H = 530;

  const writeIn = rangeProgress(
    sceneT,
    tx.writeIn.start,
    tx.writeIn.start + tx.writeIn.dur,
    Ease.outBack
  );
  const writeTy = (1 - writeIn) * 110;
  const writeScale = 0.88 + 0.12 * writeIn;
  const writeRot = 4 - 2.6 * writeIn;

  const lockOffset =
    tx.lockStart != null
      ? tx.lockStart
      : tx.writeIn.start + tx.writeIn.dur - 0.1;
  const lockT = time - (scene.start + lockOffset);

  return (
    <>
      {writeIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: 580,
            top: 110,
            width: W,
            height: H,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "12px 14px 0 0 rgba(0,0,0,0.85)",
            transform: `translateY(${writeTy}px) rotate(${writeRot}deg) scale(${writeScale})`,
            transformOrigin: "center",
            opacity: writeIn,
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <Image
            src="/tutorial/screens/write-page.png"
            alt="Riff draft editor"
            width={610}
            height={670}
            priority
            style={{
              position: "absolute",
              width: "108%",
              height: "auto",
              left: "-4%",
              top: 0,
              display: "block",
            }}
          />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 1100,
          top: 158,
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <LockBadge t={lockT} accentColor={scene.highlightColor} />
      </div>
    </>
  );
}

function RevealScene({
  time,
  scene,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  const sceneT = time - scene.start;

  const COVER_IN = 0.4,
    COVER_OUT = 3.5,
    COVER_OUT_DUR = 0.8;
  const PAGE_IN = 3.6,
    PAGE_IN_DUR = 0.8;
  const BURST_START = 1.8;

  useRevealConfetti(
    sceneT >= BURST_START,
    [0.35, 0.6],
    [0.75, 0.6],
    [0.55, 0.5],
    [80, 80, 60]
  );

  const coverIn = rangeProgress(sceneT, COVER_IN, COVER_IN + 0.6, Ease.outBack);
  const coverOut = rangeProgress(
    sceneT,
    COVER_OUT,
    COVER_OUT + COVER_OUT_DUR,
    Ease.inOut
  );
  const coverOpacity = coverIn * (1 - coverOut);
  const coverScale = 0.85 + 0.15 * coverIn + coverOut * 0.8;
  const coverRot = -2 + coverOut * 1;

  const pageIn = rangeProgress(
    sceneT,
    PAGE_IN,
    PAGE_IN + PAGE_IN_DUR,
    Ease.out
  );
  const pageTy = (1 - pageIn) * 18;
  const pageScale = 0.97 + 0.03 * pageIn;
  const pageRot = 4 - 2.6 * pageIn;

  const polaroidBase: React.CSSProperties = {
    position: "absolute",
    background: "#FFF",
    border: "2px solid #000",
    boxShadow: "12px 14px 0 0 rgba(0,0,0,0.85)",
    transformOrigin: "center",
    overflow: "hidden",
  };

  return (
    <>
      {coverOpacity > 0.005 && (
        <div
          style={{
            ...polaroidBase,
            left: 660,
            top: 100,
            width: 480,
            height: 560,
            transform: `rotate(${coverRot}deg) scale(${coverScale})`,
            opacity: coverOpacity,
            zIndex: 2,
          }}
        >
          <Image
            src="/tutorial/screens/reveal-cover.png"
            alt="Riff volume cover"
            fill
            priority
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </div>
      )}
      {pageIn > 0.005 && (
        <div
          style={{
            ...polaroidBase,
            left: 540,
            top: 130,
            width: 660,
            height: 460,
            transform: `translateY(${pageTy}px) rotate(${pageRot}deg) scale(${pageScale})`,
            opacity: pageIn,
            zIndex: 1,
          }}
        >
          <Image
            src="/tutorial/screens/reveal-page.png"
            alt="Riff post-reveal page"
            width={720}
            height={456}
            priority
            style={{
              position: "absolute",
              width: "108%",
              height: "auto",
              left: "-4%",
              top: 0,
              display: "block",
            }}
          />
        </div>
      )}
    </>
  );
}

const READ_COMMENTS = [
  {
    name: "Chris",
    color: "#FF6B35",
    text: "Not a Dodger fan, but Freddie's walk off was pretty dope",
    x: 380,
    y: 140,
    rot: -2.4,
    delay: 4.5,
    w: 280,
  },
  {
    name: "Derek",
    color: "#EECF01",
    text: "Field of Dreams is the best movie of all-time",
    x: 60,
    y: 290,
    rot: 2.6,
    delay: 5.4,
    w: 260,
  },
  {
    name: "Kyla",
    color: "#01EFFC",
    text: "I can't wait to see Riv grow as a baseball player",
    x: 320,
    y: 380,
    rot: -1.6,
    delay: 6.3,
    w: 270,
  },
];

function ReadScene({
  time,
  scene,
  isManual,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  const sceneT = time - scene.start;
  const overlayIn = rangeProgress(sceneT, 3.8, 4.6, Ease.out);
  return (
    <PinnedScreen
      x={540}
      y={130}
      width={700}
      height={560}
      rotate={-1.6}
      time={time}
      scene={scene}
      isManual={isManual}
    >
      <div
        style={{
          position: "relative",
          width: 700,
          height: 560,
          overflow: "hidden",
          background: PAPER_WHITE,
        }}
      >
        <Image
          src="/tutorial/screens/read-page.png"
          alt="Riff reading page"
          width={760}
          height={628}
          priority
          style={{
            position: "absolute",
            width: "108%",
            height: "auto",
            left: "-4%",
            top: 0,
            display: "block",
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
        {READ_COMMENTS.map((c, i) => (
          <CommentCard key={i} comment={c} t={sceneT} />
        ))}
      </div>
    </PinnedScreen>
  );
}

const SCENE_COMPONENTS: Record<
  Scene["id"],
  React.ComponentType<{ time: number; scene: Scene; isManual: boolean }>
> = {
  intro: IntroScene,
  club: ClubScene,
  riff: () => null, // hoisted as RiffPolaroid
  write: WriteScene,
  reveal: RevealScene,
  read: ReadScene,
};

export default function WelcomeTutorial({ onSkip }: { onSkip: () => void }) {
  const duration = SCENES[SCENES.length - 1].end;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <TutorialStage scenes={SCENES} duration={duration} onSkip={onSkip}>
        {(time, { isManual }) => {
          let activeScene = SCENES[0];
          for (const s of SCENES) {
            if (time < s.end) {
              activeScene = s;
              break;
            }
          }

          const SceneComp = SCENE_COMPONENTS[activeScene.id];
          const annotations = getAnnotations(activeScene);

          return (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: PAPER_WHITE,
              }}
            >
              {/* Paper texture noise */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: PAPER_NOISE_BG,
                  opacity: 0.6,
                  pointerEvents: "none",
                }}
              />

              {/* Hoisted riff polaroid — persists across scene 2→3 */}
              <RiffPolaroid time={time} isManual={isManual} />

              {/* Active scene */}
              <SceneComp time={time} scene={activeScene} isManual={isManual} />

              {/* Wordmark — top left, all scenes except intro */}
              {activeScene.id !== "intro" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/riff_wordmark_black_outline.svg"
                  alt="Riff"
                  style={{
                    position: "absolute",
                    left: 28,
                    top: 22,
                    width: 60,
                    height: "auto",
                    display: "block",
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                />
              )}

              {/* Headline */}
              {activeScene.id === "write" ? (
                <WriteHeadlineC scene={activeScene} time={time} />
              ) : (
                <HeadlineC
                  scene={activeScene}
                  time={time}
                  isManual={isManual}
                />
              )}

              {/* Annotations */}
              {activeScene.id !== "intro" &&
                annotations.map((annotation, i) => (
                  <ArrowNote
                    key={i}
                    scene={activeScene}
                    annotation={annotation}
                    timing={annotationTiming(activeScene, i)}
                    time={time}
                    isManual={isManual}
                  />
                ))}
            </div>
          );
        }}
      </TutorialStage>
    </div>
  );
}
