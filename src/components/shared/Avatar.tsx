"use client";

import { CSSProperties } from "react";
import { AvatarUser } from "@/types";

interface AvatarProps {
  user: AvatarUser;
  size?: 24 | 32 | 40 | 48; // Default: 32
  showBorder?: boolean; // Default: true
  borderColor?: string; // Default: '#000000' (black)
  borderWidth?: number; // Default: 2 (in pixels)
  tag?: string | null; // Optional label (e.g., "H" for host)
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
  showBorder = true,
  borderColor = "#000000",
  borderWidth = 2,
  tag = null,
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

  // Base avatar style
  const avatarStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "64px", // Full circle
    backgroundColor: user.avatarUrl ? "transparent" : "#E6E6E6",
    border: showBorder ? `${borderWidth}px solid ${borderColor}` : "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    cursor: onClick ? "pointer" : "default",
    position: "relative",
    flexShrink: 0,
    ...style,
  };

  return (
    <div
      className={className}
      style={avatarStyle}
      onClick={handleClick}
      title={getTooltipText()}
    >
      {/* Avatar content: photo or initials */}
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

      {/* Optional tag/label */}
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

function getTextSize(avatarSize: number): number {
  const sizeMap: { [key: number]: number } = {
    24: 10,
    32: 12,
    40: 14,
    48: 16,
  };
  return sizeMap[avatarSize] || 12;
}

function getTagSize(avatarSize: number): number {
  const sizeMap: { [key: number]: number } = {
    24: 18,
    32: 20,
    40: 22,
    48: 24,
  };
  return sizeMap[avatarSize] || 20;
}

function getTagTextSize(avatarSize: number): number {
  const sizeMap: { [key: number]: number } = {
    24: 10,
    32: 12,
    40: 12,
    48: 12,
  };
  return sizeMap[avatarSize] || 12;
}

function getTagTopOffset(avatarSize: number): number {
  const sizeMap: { [key: number]: number } = {
    24: -9,
    32: -10,
    40: -11,
    48: -12,
  };
  return sizeMap[avatarSize] || -10;
}
