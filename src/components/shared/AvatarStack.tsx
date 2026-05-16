"use client";

import { CSSProperties } from "react";
import { AvatarUserWithTag } from "@/types";
import Avatar from "./Avatar";

interface AvatarStackProps {
  users: AvatarUserWithTag[]; // Array supports per-user tags
  size?: 24 | 32 | 40 | 48; // Default: 32
  showBorder?: boolean; // Default: true
  borderColor?: string; // Default: '#000000'
  borderWidth?: number; // Default: 2
  onAvatarClick?: (userId: string) => void;
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
  showBorder = true,
  borderColor = "#000000",
  borderWidth = 2,
  onAvatarClick,
  className = "",
  style = {},
}: AvatarStackProps) {
  if (users.length === 0) {
    return null;
  }

  // Filter out any undefined/null users for safety
  const validUsers = users.filter((user) => user != null);

  if (validUsers.length === 0) {
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
          showBorder={showBorder}
          borderColor={borderColor}
          borderWidth={borderWidth}
          tag={user.tag}
          badge={user.badge}
          onClick={onAvatarClick}
          style={{
            marginRight: "-4px",
            zIndex: index, // 0, 1, 2, 3... (rightmost has highest z-index)
          }}
        />
      ))}
    </div>
  );
}
