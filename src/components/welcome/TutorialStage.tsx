"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Scene } from "./tutorial-utils";

const CANVAS_W = 1280;
const CANVAS_H = 800;

export interface TutorialCtxValue {
  time: number;
  duration: number;
  scenes: Scene[];
}

export const TutorialCtx = React.createContext<TutorialCtxValue>({
  time: 0,
  duration: 0,
  scenes: [],
});

export function useTutorialCtx() {
  return React.useContext(TutorialCtx);
}

interface TutorialStageProps {
  scenes: Scene[];
  duration: number;
  onSkip?: () => void;
  children: (
    time: number,
    ctx: {
      isManual: boolean;
      sceneIdx: number;
      isLast: boolean;
    }
  ) => React.ReactNode;
}

export default function TutorialStage({
  scenes,
  duration,
  onSkip,
  children,
}: TutorialStageProps) {
  const [time, setTime] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const s = Math.min(el.clientWidth / CANVAS_W, el.clientHeight / CANVAS_H);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (skipped) return;
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        const next = t + dt;
        const sc = scenes[sceneIdx];
        if (!sc) return next;
        return Math.min(next, sc.end - 0.001);
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [skipped, sceneIdx, scenes]);

  const handleNext = useCallback(() => {
    if (sceneIdx >= scenes.length - 1) {
      setSkipped(true);
      onSkip?.();
      setTimeout(() => {
        setSkipped(false);
        setSceneIdx(0);
        setTime(0);
      }, 2500);
      return;
    }
    const nextIdx = sceneIdx + 1;
    setSceneIdx(nextIdx);
    setTime(scenes[nextIdx].start);
  }, [sceneIdx, scenes, onSkip]);

  const handleBack = useCallback(() => {
    if (sceneIdx <= 0) return;
    const prevIdx = sceneIdx - 1;
    setSceneIdx(prevIdx);
    setTime(scenes[prevIdx].start);
  }, [sceneIdx, scenes]);

  const handleSkip = useCallback(() => {
    setSkipped(true);
    onSkip?.();
    setTimeout(() => {
      setSkipped(false);
      setTime(0);
      setSceneIdx(0);
    }, 2500);
  }, [onSkip]);

  const ctxValue = useMemo(
    () => ({ time, duration, scenes }),
    [time, duration, scenes]
  );

  const isFirst = sceneIdx === 0;
  const isLast = sceneIdx >= scenes.length - 1;
  const nextLabel = isLast ? "Let's riff" : "Next";

  const currentScene = scenes[sceneIdx];
  let ready = false;
  if (currentScene) {
    const readyOffset =
      currentScene.readyAt != null
        ? currentScene.readyAt
        : currentScene.end - currentScene.start - 1;
    ready = time >= currentScene.start + readyOffset;
  }

  return (
    <div
      ref={stageRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          background: "#FFFEF8",
          transform: `scale(${scale})`,
          transformOrigin: "center",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <TutorialCtx.Provider value={ctxValue}>
          {!skipped &&
            children(time, {
              isManual: true,
              sceneIdx,
              isLast,
            })}
        </TutorialCtx.Provider>

        {skipped && <SkippedFrame />}

        {!skipped && (
          <>
            <SkipButton onClick={handleSkip} />
            <BackLink onClick={handleBack} disabled={isFirst} />
            <ProgressChips scenes={scenes} activeIdx={sceneIdx} time={time} />
            <NextCTA onClick={handleNext} label={nextLabel} ready={ready} />
          </>
        )}
      </div>
    </div>
  );
}

function SkipButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        top: 28,
        right: 36,
        background: "transparent",
        border: "none",
        padding: "4px 2px",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 300,
        color: hover ? "#000" : "#9C9C9C",
        cursor: "pointer",
        letterSpacing: "0.02em",
        transition: "color 0.15s",
        zIndex: 10,
      }}
    >
      Skip intro →
    </button>
  );
}

function BackLink({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(!disabled)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        bottom: 38,
        left: 36,
        background: "transparent",
        border: "none",
        padding: "6px 2px",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "0.02em",
        color: disabled ? "#CCCCCC" : "#000",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderBottom: `2px solid ${hover ? "#000" : "transparent"}`,
        transform: hover ? "translateX(-2px)" : "translateX(0)",
        transition: "transform 0.15s, border-color 0.15s",
        zIndex: 10,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M12 7H2M5 3L1.5 7L5 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back
    </button>
  );
}

function NextCTA({
  onClick,
  label,
  ready,
}: {
  onClick: () => void;
  label: string;
  ready: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const active = hover || ready;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      style={{
        position: "absolute",
        bottom: 32,
        right: 36,
        background: active ? "#00FF66" : "#FFF",
        border: "2px solid #000",
        boxShadow: press
          ? "2px 2px 0 0 #000"
          : active
            ? "6px 6px 0 0 #000"
            : "6px 6px 0 0 #00FF66",
        transform: press ? "translate(4px, 4px)" : "translate(0, 0)",
        padding: "10px 22px",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: "0.02em",
        color: "#000",
        cursor: "pointer",
        transition:
          "box-shadow 0.35s ease-out, background 0.35s ease-out, transform 0.06s",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 10,
      }}
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2 7h10M9 3l3.5 4-3.5 4"
          stroke="#000"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function ProgressChips({
  scenes,
  activeIdx,
  time,
}: {
  scenes: Scene[];
  activeIdx: number;
  time: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 44,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 10,
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {scenes
        .filter((s) => !s.skipProgress)
        .map((sc, i) => {
          const globalIdx = scenes.indexOf(sc);
          const isActive = globalIdx === activeIdx;
          const isPast = globalIdx < activeIdx;
          const localProgress = isActive
            ? Math.max(
                0,
                Math.min(
                  1,
                  (time - sc.start) / Math.max(0.001, sc.end - sc.start)
                )
              )
            : isPast
              ? 1
              : 0;
          return (
            <div
              key={i}
              style={{
                width: isActive ? 32 : 20,
                height: 2,
                background: "#E6E6E6",
                position: "relative",
                overflow: "hidden",
                transition: "width 0.3s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${localProgress * 100}%`,
                  background: "#000",
                  transition: isPast ? "width 0.3s" : "none",
                }}
              />
            </div>
          );
        })}
    </div>
  );
}

function SkippedFrame() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#FFFEF8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        animation: "riff-tutorial-fade-in 0.4s ease",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-dm-serif-text), Georgia, serif",
          fontSize: 28,
          color: "rgba(0,0,0,0.4)",
        }}
      >
        Loading your club…
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #000",
          borderTopColor: "transparent",
          borderRadius: 999,
          animation: "riff-tutorial-spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}

// Inject keyframes once (client-side only)
if (typeof document !== "undefined") {
  if (!document.getElementById("riff-tutorial-keyframes")) {
    const s = document.createElement("style");
    s.id = "riff-tutorial-keyframes";
    s.textContent = `
      @keyframes riff-tutorial-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes riff-tutorial-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes riff-tutorial-rise-in {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(s);
  }
}
