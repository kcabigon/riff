"use client";

import { useState, useEffect } from "react";

interface OnboardingChecklistProps {
  clubId: string;
  hasMembers: boolean;
  hasActiveRiff: boolean;
  hasCompletedRiff: boolean;
  onStartRiff: () => void;
  onInvite: () => void;
}

export default function OnboardingChecklist({
  clubId,
  hasMembers,
  hasActiveRiff,
  hasCompletedRiff,
  onStartRiff,
  onInvite,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(true); // default to hidden until checked

  useEffect(() => {
    const key = `riff-checklist-dismissed-${clubId}`;
    setDismissed(localStorage.getItem(key) === "true");
  }, [clubId]);

  if (dismissed || hasCompletedRiff) return null;

  const steps = [
    { label: "Create club", done: true },
    { label: "Start a riff", done: hasActiveRiff, action: onStartRiff },
    { label: "Invite friends", done: hasMembers, action: onInvite },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  const handleDismiss = () => {
    localStorage.setItem(`riff-checklist-dismissed-${clubId}`, "true");
    setDismissed(true);
  };

  return (
    <div
      style={{
        border: "2px solid #000000",
        padding: "24px",
        marginBottom: "32px",
        backgroundColor: "#FAFAFA",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 700,
            color: "#000000",
            margin: 0,
          }}
        >
          Get started ({completedCount}/{steps.length})
        </h3>
        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: "#808080",
            padding: 0,
          }}
        >
          Dismiss
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Checkbox */}
            <div
              style={{
                width: "20px",
                height: "20px",
                border: step.done ? "none" : "2px solid #E6E6E6",
                backgroundColor: step.done ? "#00FF66" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {step.done && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: step.done ? "#808080" : "#000000",
                textDecoration: step.done ? "line-through" : "none",
                flex: 1,
              }}
            >
              {step.label}
            </span>

            {/* Action link */}
            {!step.done && step.action && (
              <button
                onClick={step.action}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#00FF66",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Do this
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
