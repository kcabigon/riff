"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Modal from "@/components/shared/Modal";
import { CopyIcon, CheckIcon, OpenLinkIcon } from "@/components/shared/icons";
import InvitePieceModal from "@/components/shared/InvitePieceModal";
import SendToFriendsModal from "@/components/shared/SendToFriendsModal";
import Tagline from "@/components/Tagline";

export interface PublicShare {
  id: string;
  shareType: "PUBLIC";
  isPublic: boolean;
}

interface ShareModalProps {
  pieceId: string;
  pieceTitle?: string | null;
  isRevealed: boolean;
  existingShare: PublicShare | null;
  onClose: () => void;
  onShareCreated: (share: PublicShare) => void;
  onShareRevoked: () => void;
}

// A row that navigates to a dedicated sub-modal (Google Docs' pattern —
// the entry modal just lists options, each opens its own screen on
// intention rather than expanding everything inline). Styled like the
// app's menu convention (Dropdown/ThreeDotButton) rather than CTAButton —
// these are disclosure rows, not decisive commit actions, so no heavy
// shadow, just a border and a hover fill.
function CTARow({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px",
        border: "2px solid #000000",
        backgroundColor: hovered && !disabled ? "#F5F5F5" : "#FFFFFF",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        textAlign: "left",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
        }}
      >
        {label}
      </span>
      <Image
        src="/icons/arrow_down.svg"
        alt=""
        width={16}
        height={16}
        style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
      />
    </button>
  );
}

// Copy/View are low-stakes, repeatable utility actions rather than a
// single decisive commit — same reasoning as CTARow above, so they get
// the same light border + hover-fill treatment instead of a heavy shadow.
function AccessActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "10px 16px",
        border: "2px solid #000000",
        backgroundColor: hovered ? "#F5F5F5" : "#FFFFFF",
        cursor: "pointer",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "16px",
        fontWeight: 300,
        color: "#000000",
      }}
    >
      {children}
    </button>
  );
}

interface AccessOption {
  value: "friends" | "public";
  label: string;
  description: string;
}

// Custom (not the shared Dropdown) because each option needs its own
// description line, like the CTA rows above. Opens upward — this sits at
// the bottom of the modal, and the shared Dropdown's menu isn't portaled,
// so opening downward here would get clipped by Modal's own
// overflow-y: auto on the dialog. Trigger styled like the CTA rows above
// (border + hover fill, no heavy shadow) — it's a disclosure trigger, not
// a commit action; the menu panel itself keeps the lighter brutal-half
// shadow that matches the app's other dropdown menus.
function AccessDropdown({
  value,
  options,
  onSelect,
}: {
  value: AccessOption["value"];
  options: AccessOption[];
  onSelect: (value: AccessOption["value"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          border: "2px solid #000000",
          backgroundColor: open || triggerHovered ? "#F5F5F5" : "#FFFFFF",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
          }}
        >
          {current.label}
        </span>
        <Image
          src="/icons/arrow_down.svg"
          alt=""
          width={16}
          height={16}
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            right: 0,
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px 0px #000000",
            zIndex: 60,
          }}
        >
          {options.map((option) => {
            // Friends is the ambient baseline and Public is additive on top
            // of it (never a replacement), so Friends stays visually
            // checked even once Public is also active — this hardcodes
            // that additive relationship rather than treating the two as
            // mutually exclusive. Revisit once a subtractive Private tier
            // ships alongside these two.
            const isSelected =
              option.value === "friends" || option.value === value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHoveredOption(option.value)}
                onMouseLeave={() => setHoveredOption(null)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  width: "100%",
                  border: "none",
                  borderBottom:
                    option === options[options.length - 1]
                      ? "none"
                      : "1px solid #E6E6E6",
                  backgroundColor: isSelected
                    ? "#F5F5F5"
                    : hoveredOption === option.value
                      ? "#F5F5F5"
                      : "#FFFFFF",
                  padding: "16px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "64px",
                    border: "2px solid #000000",
                    backgroundColor: isSelected ? "#00FF66" : "#FFFFFF",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#000000",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {option.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px",
                      fontWeight: 300,
                      color: "#000000",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ShareModal({
  pieceId,
  pieceTitle = null,
  isRevealed,
  existingShare,
  onClose,
  onShareCreated,
  onShareRevoked,
}: ShareModalProps) {
  const [share, setShare] = useState<PublicShare | null>(existingShare);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"main" | "invite" | "send">("main");

  const isPublic = share !== null;
  const publicDisabled = !isRevealed;

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${pieceId}`
      : `/p/${pieceId}`;

  const handleMakePublic = async () => {
    if (loading || isPublic) return;
    if (publicDisabled) {
      setError("Only revealed pieces can be shared publicly.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareType: "PUBLIC" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to make public.");
        return;
      }
      setShare(data.share);
      onShareCreated(data.share);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeFriendsOnly = async () => {
    if (loading || !share) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}/shares/${share.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update access.");
        return;
      }
      setShare(null);
      onShareRevoked();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied or unavailable — nothing to recover from.
    }
  };

  const handleOpen = () => {
    window.open(publicUrl, "_blank", "noopener,noreferrer");
  };

  if (view === "invite") {
    return (
      <InvitePieceModal
        pieceId={pieceId}
        pieceTitle={pieceTitle}
        onClose={onClose}
        onBack={() => setView("main")}
      />
    );
  }

  if (view === "send") {
    return (
      <SendToFriendsModal
        pieceId={pieceId}
        onClose={onClose}
        onBack={() => setView("main")}
      />
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Share" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Send */}
        <div>
          <div style={{ marginBottom: "12px" }}>
            <Tagline
              text="Send"
              color="#00FF66"
              textColor="#000000"
              fontSize={16}
              width={64}
              align="left"
            />
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <CTARow label="Send to friends" onClick={() => setView("send")} />
            <CTARow
              label="Invite a new friend"
              disabled={publicDisabled}
              onClick={() => setView("invite")}
            />
          </div>
        </div>

        <div style={{ borderTop: "1px solid #E6E6E6" }} />

        {/* Access */}
        <div>
          <div style={{ marginBottom: "12px" }}>
            <Tagline
              text="Access"
              color="#01EFFC"
              textColor="#000000"
              fontSize={16}
              width={88}
              align="left"
            />
          </div>
          <AccessDropdown
            value={isPublic ? "public" : "friends"}
            options={[
              {
                value: "friends",
                label: "Friends",
                description:
                  "All club-mates, riff-mates, and friends can view and comment on this piece.",
              },
              {
                value: "public",
                label: "Public",
                description:
                  "Anyone with the link can view, in addition to your friends — no login required.",
              },
            ]}
            onSelect={(value) =>
              value === "public" ? handleMakePublic() : handleMakeFriendsOnly()
            }
          />

          {isPublic && (
            <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
              <AccessActionButton onClick={handleCopy}>
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Copied" : "Copy"}
              </AccessActionButton>
              <AccessActionButton onClick={handleOpen}>
                <OpenLinkIcon />
                View
              </AccessActionButton>
            </div>
          )}

          {error && (
            <p style={{ ...errorTextStyle, marginTop: "8px" }}>{error}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

const errorTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "12px",
  fontWeight: 300,
  color: "#DC2626",
  margin: 0,
};
