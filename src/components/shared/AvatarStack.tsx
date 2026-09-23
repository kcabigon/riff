"use client";

import { CSSProperties } from "react";
import { AvatarUserWithTag } from "@/types";
import Avatar from "./Avatar";

interface AvatarStackProps {
  users: AvatarUserWithTag[]; // Array supports per-user tags
  size?: 24 | 32 | 40 | 48; // Default: 32
  borderColor?: string; // Default: '#000000'
  onAvatarClick?: (userId: string) => void;
  // Appends a trailing dashed "+" tile to the stack, same treatment as
  // FriendsRow's invite tile. Omit to render the stack with no add action.
  onAddClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * AvatarStack displays a horizontal list of overlapping user avatars.
 *
 * IMPORTANT - Ordering:
 * The parent component is responsible for sorting users in the correct order.
 * - Club view: Host first (leftmost), then by join date ascending (last to join = rightmost)
 * - Riff view: Riff creator first (leftmost), then by join date ascending (last to join = rightmost)
 *
 * Visual stacking: Rightmost avatar appears on top (highest z-index).
 *
 * Features:
 * - Overlapping layout (-4px right margin)
 * - Z-index stacking (rightmost on top)
 * - Passes size, border, onClick to each Avatar
 * - No truncation - displays all avatars
 */
export default function AvatarStack({
  users,
  size = 32,
  borderColor = "#000000",
  onAvatarClick,
  onAddClick,
  className = "",
  style = {},
}: AvatarStackProps) {
  // Filter out any undefined/null users for safety
  const validUsers = users.filter((user) => user != null);

  if (validUsers.length === 0 && !onAddClick) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        paddingRight: "4px", // Compensate for last avatar's negative margin
        ...style,
      }}
    >
      {validUsers.map((user, index) => (
        <Avatar
          key={user.id}
          user={user}
          size={size}
          borderColor={borderColor}
          tag={user.tag}
          badge={user.badge}
          onClick={onAvatarClick}
          style={{
            marginRight: "-4px",
            zIndex: index, // 0, 1, 2, 3... (rightmost has highest z-index)
          }}
        />
      ))}
      {onAddClick &&
        (() => {
          // Matches FriendsRow's invite tile on a white/light backdrop
          // (light gray dashed + white fill). On a dark backdrop (banner
          // photo/overlay, borderColor passed as white to match the other
          // avatars' borders there) that same white fill read as a stark
          // solid blob next to real photos — swapped for a transparent
          // "empty slot" treatment with a white dashed border instead.
          const onDark = borderColor.toUpperCase() === "#FFFFFF";
          return (
            <button
              type="button"
              onClick={onAddClick}
              aria-label="Invite friends"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: `${size}px`,
                border: onDark
                  ? "2px dashed rgba(255, 255, 255, 0.7)"
                  : "2px dashed #CCCCCC",
                backgroundColor: onDark ? "transparent" : "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-dm-sans)",
                fontSize: `${Math.round(size * 0.375)}px`,
                fontWeight: 300,
                color: onDark ? "#FFFFFF" : "#CCCCCC",
                lineHeight: "normal",
                padding: 0,
                cursor: "pointer",
                flexShrink: 0,
                marginRight: "-4px",
                zIndex: validUsers.length,
              }}
            >
              +
            </button>
          );
        })()}
    </div>
  );
}
