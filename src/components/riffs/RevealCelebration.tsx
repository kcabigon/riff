"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";

interface RevealCelebrationProps {
  pieceCount: number;
  onDismiss: () => void;
}

export default function RevealCelebration({
  pieceCount,
  onDismiss,
}: RevealCelebrationProps) {
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 300); // wait for fade out
  }, [onDismiss]);

  useEffect(() => {
    // Fire confetti from multiple positions
    const fire = (x: number, angle: number) => {
      confetti({
        particleCount: 80,
        angle,
        spread: 60,
        origin: { x, y: 0.6 },
        colors: ["#00FF66", "#01EFFC", "#EECF01", "#FF6B35", "#C01582", "#955CB5"],
      });
    };

    fire(0.2, 60);
    fire(0.8, 120);
    setTimeout(() => fire(0.5, 90), 300);

    // Auto-dismiss after 4s
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "48px",
            fontWeight: 400,
            color: "#FFFFFF",
            margin: "0 0 16px 0",
            lineHeight: 1.2,
          }}
        >
          The pieces are in!
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "20px",
            fontWeight: 300,
            color: "#FFFFFF",
            margin: 0,
            opacity: 0.8,
          }}
        >
          {pieceCount} {pieceCount === 1 ? "piece" : "pieces"} revealed
        </p>
      </div>
    </div>
  );
}
