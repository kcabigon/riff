"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Scene } from "./tutorial-utils";

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
  canvasW?: number;
  canvasH?: number;
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
  canvasW = 1280,
  canvasH = 800,
  children,
}: TutorialStageProps) {
  const [time, setTime] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const autoAdvancedSceneRef = useRef<number>(-1);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const s = Math.min(el.clientWidth / canvasW, el.clientHeight / canvasH);
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
  }, [canvasW, canvasH]);

  useEffect(() => {
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
  }, [sceneIdx, scenes]);

  const handleNext = useCallback(() => {
    if (sceneIdx >= scenes.length - 1) {
      onSkip?.();
      return;
    }
    const nextIdx = sceneIdx + 1;
    setSceneIdx(nextIdx);
    setTime(scenes[nextIdx].start);
  }, [sceneIdx, scenes, onSkip]);

  useEffect(() => {
    const sc = scenes[sceneIdx];
    if (!sc?.autoAdvance) return;
    if (autoAdvancedSceneRef.current === sceneIdx) return;
    if (time >= sc.end - 0.002) {
      autoAdvancedSceneRef.current = sceneIdx;
      handleNext();
    }
  }, [time, sceneIdx, scenes, handleNext]);

  const handleBack = useCallback(() => {
    if (sceneIdx <= 0) return;
    const prevIdx = sceneIdx - 1;
    autoAdvancedSceneRef.current = -1;
    setSceneIdx(prevIdx);
    setTime(scenes[prevIdx].start);
  }, [sceneIdx, scenes]);

  const handleSkip = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  const ctxValue = useMemo(
    () => ({ time, duration, scenes }),
    [time, duration, scenes]
  );

  const compact = canvasW < 500;
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
          width: canvasW,
          height: canvasH,
          background: "#FFFEF8",
          transform: `scale(${scale})`,
          transformOrigin: "center",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <TutorialCtx.Provider value={ctxValue}>
          {children(time, {
            isManual: true,
            sceneIdx,
            isLast,
          })}
        </TutorialCtx.Provider>

        <SkipButton onClick={handleSkip} compact={compact} />
        <BackLink onClick={handleBack} disabled={isFirst} compact={compact} />
        <ProgressChips
          scenes={scenes}
          activeIdx={sceneIdx}
          time={time}
          compact={compact}
        />
        {!currentScene?.autoAdvance && (
          <NextCTA
            onClick={handleNext}
            label={nextLabel}
            ready={ready}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
}

function SkipButton({
  onClick,
  compact,
}: {
  onClick: () => void;
  compact?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        top: compact ? 20 : 28,
        right: compact ? 20 : 36,
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
  compact,
}: {
  onClick: () => void;
  disabled: boolean;
  compact?: boolean;
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
        bottom: compact ? 22 : 38,
        left: compact ? 20 : 36,
        background: "transparent",
        border: "none",
        padding: compact ? "6px 2px" : "8px 2px",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: compact ? 13 : 16,
        fontWeight: 500,
        letterSpacing: "0.02em",
        color: disabled ? "#CCCCCC" : "#000",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        borderBottom: `2px solid ${hover ? "#000" : "transparent"}`,
        transform: hover ? "translateX(-2px)" : "translateX(0)",
        transition: "transform 0.15s, border-color 0.15s",
        zIndex: 10,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
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
  compact,
}: {
  onClick: () => void;
  label: string;
  ready: boolean;
  compact?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const active = hover || ready;
  const shadow = compact ? "4px 4px 0 0" : "6px 6px 0 0";
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
        bottom: compact ? 18 : 32,
        right: compact ? 20 : 36,
        background: active ? "#00FF66" : "#FFF",
        border: "2px solid #000",
        boxShadow: press
          ? "2px 2px 0 0 #000"
          : active
            ? `${shadow} #000`
            : `${shadow} #00FF66`,
        transform: press
          ? `translate(${compact ? 3 : 4}px, ${compact ? 3 : 4}px)`
          : "translate(0, 0)",
        padding: compact ? "7px 16px" : "8px 24px",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: compact ? 13 : 16,
        fontWeight: 500,
        letterSpacing: "0.02em",
        color: "#000",
        cursor: "pointer",
        transition:
          "box-shadow 0.35s ease-out, background 0.35s ease-out, transform 0.06s",
        display: "flex",
        alignItems: "center",
        gap: compact ? 8 : 10,
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
  compact,
}: {
  scenes: Scene[];
  activeIdx: number;
  time: number;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: compact ? 26 : 44,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: compact ? 8 : 10,
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

          if (compact) {
            return (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isActive || isPast ? "#000" : "#E6E6E6",
                  transition: "background 0.3s",
                  flexShrink: 0,
                }}
              />
            );
          }

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
