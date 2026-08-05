"use client";

import { CSSProperties } from "react";
import { AvatarUser } from "@/types";
import AdminBadge from "./AdminBadge";

interface AvatarProps {
  user: AvatarUser;
  size?: 24 | 32 | 40 | 48 | 120; // Default: 32
  borderColor?: string; // Default: '#000000' (black)
  tag?: string | null; // Optional label (e.g., "H" for host)
  badge?: "admin" | "moderator" | null; // Optional role badge
  onClick?: (userId: string) => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Avatar component displays a single user avatar with photo or initials fallback.
 *
 * Features:
 * - Flexible sizing: 24px, 32px, 40px, 48px
 * - Customizable borders (color + width)
 * - Optional tag/label (e.g., "H" for host)
 * - Click handler for navigation
 * - Tooltip on hover showing user's full name
 * - Follows neo-brutalist design system
 */
export default function Avatar({
  user,
  size = 32,
  borderColor = "#000000",
  tag = null,
  badge = null,
  onClick,
  className = "",
  style = {},
}: AvatarProps) {
  // Safety check: return null if user is not provided
  if (!user) {
    return null;
  }

  // Calculate scaled sizes based on avatar size
  const textSize = getTextSize(size);
  const tagSize = getTagSize(size);
  const tagTextSize = getTagTextSize(size);
  const tagTopOffset = getTagTopOffset(size);

  // Get user initials (2 characters, uppercase)
  const getInitials = (): string => {
    if (user.name) {
      const parts = user.name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U"; // Ultimate fallback
  };

  // Get tooltip text
  const getTooltipText = (): string => {
    return user.name || user.username || "Unknown User";
  };

  // Handle click
  const handleClick = () => {
    if (onClick) {
      onClick(user.id);
    }
  };

  // Outer container: positioning + border, allows tag to overflow
  const avatarStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "64px", // Full circle
    border: `${getBorderWidth(size)}px solid ${borderColor}`,
    cursor: onClick ? "pointer" : "default",
    position: "relative",
    flexShrink: 0,
    ...style,
  };

  // Inner wrapper: circular clip for avatar content only
  const innerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: "64px",
    overflow: "hidden",
    backgroundColor: user.avatarUrl ? "transparent" : "#E6E6E6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      className={className}
      style={avatarStyle}
      onClick={handleClick}
      title={getTooltipText()}
    >
      {/* Inner wrapper: circular clip for photo or initials */}
      <div style={innerStyle}>
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={getTooltipText()}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: `${textSize}px`,
              fontWeight: 400,
              color: "#000000",
              lineHeight: "normal",
            }}
          >
            {getInitials()}
          </span>
        )}
      </div>

      {/* Optional role badge */}
      {badge && <AdminBadge type={badge} size={size <= 32 ? 12 : 14} />}

      {/* Optional tag/label — sibling to inner, not clipped */}
      {tag && (
        <div
          style={{
            position: "absolute",
            top: `${tagTopOffset}px`,
            left: "0",
            width: `${tagSize}px`,
            height: `${tagSize}px`,
            borderRadius: "16px",
            backgroundColor: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: `${tagTextSize}px`,
              fontWeight: 600,
              color: "#FFFFFF",
              lineHeight: "normal",
              textAlign: "center",
            }}
          >
            {tag}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper functions for scaled sizes

function getBorderWidth(avatarSize: number): number {
  return avatarSize <= 32 ? 1 : 2;
}

function getTextSize(avatarSize: number): number {
  const sizeMap: { [key: number]: number } = {
    24: 10,
    32: 12,
    40: 14,
    48: 16,
    120: 32,
  };
  return sizeMap[avatarSize] || 12;
}

function getTagSize(avatarSize: number): number {
  const sizeMap: { [key: number]: number } = {
    24: 18,
    32: 20,
    40: 22,
    48: 24,
    120: 36,
  };
  return sizeMap[avatarSize] || 20;
}

function getTagTextSize(avatarSize: number): number {
  const sizeMap: { [key: number]: number } = {
    24: 10,
    32: 12,
    40: 12,
    48: 12,
    120: 14,
  };
  return sizeMap[avatarSize] || 12;
}

function getTagTopOffset(avatarSize: number): number {
  const sizeMap: { [key: number]: number } = {
    24: -9,
    32: -10,
    40: -11,
    48: -12,
    120: -18,
  };
  return sizeMap[avatarSize] || -10;
}
