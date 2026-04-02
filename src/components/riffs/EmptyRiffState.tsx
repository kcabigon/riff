"use client";

import { useState } from "react";
import { useDraftCreation } from "@/hooks/useDraftCreation";

interface EmptyRiffStateProps {
  onStartNewRiff: () => void;
  isAdmin?: boolean;
  hostName?: string | null;
}

export default function EmptyRiffState({
  onStartNewRiff,
  isAdmin = true,
  hostName,
}: EmptyRiffStateProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDraftHovered, setIsDraftHovered] = useState(false);
  const { createDraft, isCreating } = useDraftCreation();

  if (!isAdmin) {
    const hostFirstName = hostName?.split(" ")[0] ?? "The host";
    return (
      <>
        <div
          className="empty-riff-member"
          style={{
            backgroundColor: "#F9F9F9",
            border: "2px dashed #E6E6E6",
            padding: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "40px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#959595",
              margin: 0,
              flex: 1,
            }}
          >
            {hostFirstName} will start a new riff soon. You can start a new
            draft and attach it to the riff later.
          </p>
          <div className="empty-riff-member-cta">
            <button
              onClick={() => createDraft()}
              disabled={isCreating}
              onMouseEnter={() => setIsDraftHovered(true)}
              onMouseLeave={() => setIsDraftHovered(false)}
              style={{
                backgroundColor: isDraftHovered ? "#00FF66" : "#FFFFFF",
                border: "2px solid #000000",
                boxShadow: isDraftHovered
                  ? "8px 8px 0px 0px #000000"
                  : "8px 8px 0px 0px #00FF66",
                padding: "12px 48px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                cursor: isCreating ? "not-allowed" : "pointer",
                transition: "none",
                whiteSpace: "nowrap",
              }}
            >
              {isCreating ? "Creating…" : "New Draft"}
            </button>
          </div>
        </div>
        <style>{`
          @media (max-width: 767px) {
            .empty-riff-member {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 24px !important;
              padding: 24px !important;
            }
            .empty-riff-member-cta {
              width: 100%;
            }
            .empty-riff-member-cta button {
              width: 100% !important;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <button
        onClick={onStartNewRiff}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isHovered ? "#00FF66" : "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: isHovered
            ? "8px 8px 0px 0px #000000"
            : "8px 8px 0px 0px #01EFFC",
          padding: "12px 48px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          cursor: "pointer",
          transition: "none",
          whiteSpace: "nowrap",
        }}
      >
        Start new riff
      </button>
    </div>
  );
}
