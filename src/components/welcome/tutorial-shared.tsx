"use client";

import confetti from "canvas-confetti";
import React, { useEffect, useRef } from "react";
import NoiseBackground from "@/components/NoiseBackground";
import {
  BRUSH_FILTERS,
  Ease,
  PAPER_WHITE,
  rangeProgress,
  type IntroCopy,
} from "./tutorial-utils";

export function BrushHighlight({
  children,
  color = "#EECF01",
  padding = 14,
}: {
  children: React.ReactNode;
  color?: string;
  padding?: number;
}) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        padding: `0 ${padding}px`,
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

export function useRevealConfetti(
  shouldFire: boolean,
  leftOrigin: [number, number],
  rightOrigin: [number, number],
  centerOrigin: [number, number],
  counts: [number, number, number] = [80, 80, 60]
) {
  const hasFired = useRef(false);
  const paramsRef = useRef({ leftOrigin, rightOrigin, centerOrigin, counts });
  paramsRef.current = { leftOrigin, rightOrigin, centerOrigin, counts };

  useEffect(() => {
    if (!shouldFire || hasFired.current) return;
    hasFired.current = true;
    const {
      leftOrigin: l,
      rightOrigin: r,
      centerOrigin: c,
      counts: cnt,
    } = paramsRef.current;
    const colors = [
      "#00FF66",
      "#01EFFC",
      "#EECF01",
      "#FF6B35",
      "#C01582",
      "#955CB5",
    ];
    confetti({
      particleCount: cnt[0],
      angle: 60,
      spread: 60,
      origin: { x: l[0], y: l[1] },
      colors,
    });
    confetti({
      particleCount: cnt[1],
      angle: 120,
      spread: 60,
      origin: { x: r[0], y: r[1] },
      colors,
    });
    const timer = setTimeout(
      () =>
        confetti({
          particleCount: cnt[2],
          angle: 90,
          spread: 70,
          origin: { x: c[0], y: c[1] },
          colors,
        }),
      300
    );
    return () => clearTimeout(timer);
  }, [shouldFire]);
}

export function IntroOrbit({
  time,
  copies,
  cx,
  cy,
  centerSize,
}: {
  time: number;
  copies: IntroCopy[];
  cx: number;
  cy: number;
  centerSize: number;
}) {
  const centerIn = rangeProgress(time, 0, 0.5, Ease.out);
  const centerOut = rangeProgress(time, 4.4, 5.2, Ease.out);
  const centerOpacity = centerIn * (1 - centerOut);
  const orbitT = rangeProgress(time, 2.2, 3.8, Ease.linear);
  const collapseT = rangeProgress(time, 3.8, 4.6, Ease.inOut);

  return (
    <>
      <NoiseBackground fillMode="cover" />
      {copies.map((copy, i) => {
        const burstT = rangeProgress(time, 1.0 + copy.delay, 2.0, Ease.outBack);
        const prog = burstT * (1 - collapseT);
        const copyOpacity = Math.min(burstT, 1 - collapseT);
        if (copyOpacity <= 0) return null;
        const θ = orbitT * Math.PI * 2 * copy.speed;
        const dx = copy.x - cx;
        const dy = copy.y - cy;
        const targetX = cx + dx * Math.cos(θ) - dy * Math.sin(θ);
        const targetY = cy + dx * Math.sin(θ) + dy * Math.cos(θ);
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
              left: cx + (targetX - cx) * prog,
              top: cy + (targetY - cy) * prog,
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
            width: centerSize,
            height: "auto",
            left: cx,
            top: cy,
            transform: "translate(-50%, -50%)",
            opacity: centerOpacity,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}

export function LockBadge({
  t,
  accentColor,
  svgW = 76,
  svgH = 92,
  ringSize = 92,
}: {
  t: number;
  accentColor: string;
  svgW?: number;
  svgH?: number;
  ringSize?: number;
}) {
  if (t < 0) return null;
  const stampIn = rangeProgress(t, 0, 0.4, Ease.outBack);
  if (stampIn <= 0) return null;

  const wobbleDecay = Math.max(0, 1 - Math.max(0, t - 0.4) / 0.6);
  const wobble =
    wobbleDecay > 0 ? Math.sin((t - 0.4) * 28) * wobbleDecay * 5 : 0;
  const ring1 = rangeProgress(t, 0.25, 0.95, Ease.out);
  const ring2 = rangeProgress(t, 0.4, 1.15, Ease.out);
  const scale = 2.2 - 1.2 * stampIn;

  return (
    <>
      {ring1 > 0 && ring1 < 1 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: ringSize,
            height: ringSize,
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
            width: ringSize,
            height: ringSize,
            borderRadius: "50%",
            border: `4px solid ${accentColor}`,
            transform: `translate(-50%, -50%) scale(${0.45 + ring2 * 1.55})`,
            opacity: 0.85 * (1 - ring2),
          }}
        />
      )}
      <div
        style={{
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${-10 + wobble}deg)`,
          transformOrigin: "center",
          opacity: stampIn,
          filter: "drop-shadow(3px 3px 0 rgba(0,0,0,0.9))",
        }}
      >
        <svg
          width={svgW}
          height={svgH}
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
    </>
  );
}

type CommentData = {
  name: string;
  color: string;
  text: string;
  x: number;
  y: number;
  rot: number;
  delay: number;
  w: number;
};

export function CommentCard({
  comment,
  t,
  compact = false,
}: {
  comment: CommentData;
  t: number;
  compact?: boolean;
}) {
  const cardIn = rangeProgress(
    t,
    comment.delay,
    comment.delay + (compact ? 0.5 : 0.55),
    Ease.outBack
  );
  if (cardIn <= 0) return null;
  const ty = (1 - cardIn) * (compact ? 20 : 24);
  const scale = compact ? 0.88 + 0.12 * cardIn : 0.85 + 0.15 * cardIn;
  const avatarSize = compact ? 22 : 28;
  const shadowPx = compact ? 4 : 5;

  return (
    <div
      style={{
        position: "absolute",
        left: comment.x,
        top: comment.y,
        width: comment.w,
        transform: `translateY(${ty}px) rotate(${comment.rot}deg) scale(${scale})`,
        transformOrigin: "center",
        opacity: cardIn,
        background: PAPER_WHITE,
        border: "2px solid #000",
        boxShadow: `${shadowPx}px ${shadowPx}px 0 0 ${comment.color}`,
        padding: compact ? "6px 10px 10px" : "8px 12px 12px",
        display: "flex",
        gap: compact ? 8 : 10,
        alignItems: "flex-start",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%",
          background: comment.color,
          border: "1.5px solid #000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: compact ? 11 : 13,
          color: "#000",
        }}
      >
        {comment.name[0]}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: compact ? 10 : 12,
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: compact ? 3 : 4,
          }}
        >
          {comment.name}
        </div>
        <div
          style={{
            fontSize: compact ? 11 : 13,
            fontWeight: 400,
            lineHeight: 1.3,
            color: "#000",
          }}
        >
          {comment.text}
        </div>
      </div>
    </div>
  );
}

export function MobileWordNote({
  words,
  time,
  startTime,
  top,
  rotate = 0,
  opacity = 1,
  canvasW = 390,
}: {
  words: string[];
  time: number;
  startTime: number;
  top: number;
  rotate?: number;
  opacity?: number;
  canvasW?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        top,
        maxWidth: canvasW - 48,
        fontFamily: "var(--font-over-the-rainbow), cursive",
        fontSize: 26,
        color: "#000",
        lineHeight: 1.3,
        transform: `rotate(${rotate}deg)`,
        pointerEvents: "none",
        textShadow: `0 0 6px ${PAPER_WHITE}, 0 0 6px ${PAPER_WHITE}`,
        zIndex: 5,
        opacity,
      }}
    >
      {words.map((word, wi) => {
        const wIn = rangeProgress(
          time,
          startTime + wi * 0.14,
          startTime + wi * 0.14 + 0.18,
          Ease.out
        );
        return (
          <span
            key={wi}
            style={{
              display: "inline-block",
              opacity: wIn,
              transform: `translateY(${(1 - wIn) * 5}px)`,
              marginRight: wi < words.length - 1 ? "0.25em" : 0,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
