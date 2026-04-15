"use client";

import { useRouter } from "next/navigation";
import Avatar from "@/components/shared/Avatar";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    actor: { id: string; name: string | null; avatarUrl: string | null } | null;
    club: { id: string; name: string } | null;
    riff: { id: string; title: string | null; clubId: string } | null;
    piece: { id: string; title: string } | null;
  };
  onClose: () => void;
  onDismiss: (id: string) => void;
}

function getMessage(n: NotificationItemProps["notification"]): string {
  const actor = n.actor?.name || "Someone";

  switch (n.type) {
    case "RIFF_CREATED":
      return `${actor} started a new riff${n.riff ? `: "${n.riff.title}"` : ""}`;
    case "RIFF_STARTED":
      return `A new riff just dropped${n.riff ? `: "${n.riff.title}"` : ""}`;
    case "PIECE_SUBMITTED_TO_RIFF":
      return `${actor} submitted a piece${n.riff ? ` to "${n.riff.title}"` : ""}`;
    case "RIFF_COMPLETED":
      return `Pieces have been revealed${n.riff ? ` in "${n.riff.title}"` : ""}`;
    case "NEW_COMMENT":
      return `${actor} commented on ${n.piece ? `"${n.piece.title}"` : "your piece"}`;
    case "COMMENT_REPLY":
      return `${actor} replied to your comment`;
    case "CLUB_INVITATION":
      return `${actor} invited you to ${n.club ? n.club.name : "a club"}`;
    case "HOST_MESSAGE":
      return `Message from ${actor}${n.club ? ` in ${n.club.name}` : ""}`;
    default:
      return "New notification";
  }
}

function getLink(n: NotificationItemProps["notification"]): string {
  switch (n.type) {
    case "NEW_COMMENT":
    case "COMMENT_REPLY":
      if (n.piece) return `/read/${n.piece.id}`;
      if (n.riff) return `/riffs/${n.riff.id}`;
      break;
    case "HOST_MESSAGE":
    case "CLUB_INVITATION":
      if (n.club) return `/clubs/${n.club.id}`;
      break;
    case "RIFF_CREATED":
      if (n.riff) return `/clubs/${n.riff.clubId}`;
      break;
    default:
      if (n.riff) return `/riffs/${n.riff.id}`;
      if (n.club) return `/clubs/${n.club.id}`;
  }
  return "#";
}

export default function NotificationItem({
  notification,
  onClose,
  onDismiss,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = async () => {
    fetch(`/api/notifications/${notification.id}`, { method: "PATCH" });
    onDismiss(notification.id);
    onClose();
    router.push(getLink(notification));
  };

  const timeAgo = getTimeAgo(new Date(notification.createdAt));

  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        padding: "12px 16px",
        width: "100%",
        textAlign: "left",
        background: notification.isRead ? "transparent" : "#F9FFF9",
        border: "none",
        borderBottom: "1px solid #F5F5F5",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#F5F5F5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notification.isRead
          ? "transparent"
          : "#F9FFF9";
      }}
    >
      {notification.actor ? (
        <Avatar
          user={{
            id: notification.actor.id,
            name: notification.actor.name,
            username: null,
            avatarUrl: notification.actor.avatarUrl,
          }}
          size={32}
          showBorder={false}
        />
      ) : (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#E6E6E6",
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
            fontWeight: notification.isRead ? 300 : 400,
            color: "#000000",
            margin: "0 0 2px 0",
            lineHeight: 1.4,
          }}
        >
          {getMessage(notification)}
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "11px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          {timeAgo}
        </p>
      </div>

      {!notification.isRead && (
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#00FF66",
            flexShrink: 0,
            marginTop: "4px",
          }}
        />
      )}
    </button>
  );
}

function getTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
