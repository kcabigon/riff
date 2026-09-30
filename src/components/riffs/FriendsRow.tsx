"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import type { FriendSummary } from "@/lib/friends";

interface FriendsRowProps {
  friends: FriendSummary[];
  onInvite: () => void;
  /** Whether the user has a revealed/published piece to invite with. When
   * false, the "+" tile is hidden entirely rather than opening a modal that
   * can't do anything — inviting always goes through a piece. */
  canInvite: boolean;
}

const FADE_PX = 48;

// Horizontal-scroll row of people you've shared a club or riff with — the
// circular avatar + name-below layout borrows from Instagram Stories, kept
// flat and minimal (no gradients, no "seen" state) to match Substack Home's
// plainer people row and this app's neo-brutalist palette. The trailing "+"
// tile is the one entry point into inviting someone (shown whenever the
// user can actually invite, even with zero friends yet).
export default function FriendsRow({
  friends,
  onInvite,
  canInvite,
}: FriendsRowProps) {
  const handleClick = useProfileNavigation();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Same edge check as HorizontalScrollRow: 1px of slack, since scrollLeft is
  // fractional on zoomed/high-DPI screens.
  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useLayoutEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges]);

  const firstName = (friend: FriendSummary) =>
    (friend.name || friend.username || "Friend").split(" ")[0];

  return (
    <>
      {/* Mobile-only: bleed the container to the true screen edge on both
          sides (Instagram Stories-style) so overscroll doesn't reveal a
          mismatched gap on the left; padding-left re-adds the 24px gutter
          so the resting position still matches the page's side padding.
          Desktop keeps the row inset in the page column, so instead of
          slicing an avatar at the column's hard edge, the side with more to
          scroll to fades out. Each fade shows only when there's something
          that way; neither shows when everyone fits. */}
      <style>{`
        @media (max-width: 767px) {
          .friends-row-scroll {
            margin-left: -24px;
            margin-right: -24px;
            padding-left: 24px;
          }
        }
        @media (min-width: 768px) {
          .friends-row-scroll {
            -webkit-mask-image: linear-gradient(to right, transparent 0, #000 var(--fade-left), #000 calc(100% - var(--fade-right)), transparent 100%);
            mask-image: linear-gradient(to right, transparent 0, #000 var(--fade-left), #000 calc(100% - var(--fade-right)), transparent 100%);
          }
        }
      `}</style>
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="friends-row-scroll"
        style={{
          ["--fade-left" as string]: canScrollLeft ? `${FADE_PX}px` : "0px",
          ["--fade-right" as string]: canScrollRight ? `${FADE_PX}px` : "0px",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
        }}
      >
        {friends.map((friend) => (
          <button
            key={friend.id}
            onClick={() => handleClick(friend.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              flexShrink: 0,
              width: "74px",
            }}
          >
            <Avatar user={friend} size={64} style={{ cursor: "pointer" }} />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#000000",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              {firstName(friend)}
            </span>
          </button>
        ))}

        {canInvite && (
          <button
            onClick={onInvite}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              flexShrink: 0,
              width: "74px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "64px",
                border: "2px dashed #CCCCCC",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "24px",
                fontWeight: 300,
                color: "#CCCCCC",
                lineHeight: "normal",
              }}
            >
              +
            </div>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#000000",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              Invite
            </span>
          </button>
        )}
      </div>
    </>
  );
}
