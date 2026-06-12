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
    riff: {
      id: string;
      title: string | null;
      clubId: string;
      volumeNumber: number | null;
    } | null;
    piece: { id: string; title: string } | null;
    commentCount?: number;
  };
  onClose: () => void;
  onDismiss: (id: string) => void;
}

function getMessage(n: NotificationItemProps["notification"]): string {
  const actor = n.actor?.name || "Someone";

  switch (n.type) {
    case "CLUB_MEMBER_JOINED":
      return `${actor} joined ${n.club ? n.club.name : "the club"}`;
    case "RIFF_CREATED":
    case "RIFF_STARTED":
      return `New riff in ${n.club ? n.club.name : "your club"}`;
    case "PIECE_SUBMITTED_TO_RIFF":
      return `${actor} submitted a piece to ${n.club ? n.club.name : "your club"}`;
    case "RIFF_COMPLETED": {
      if (n.riff) {
        const display =
          n.riff.volumeNumber && n.riff.title
            ? `Volume ${n.riff.volumeNumber}: ${n.riff.title}`
            : n.riff.volumeNumber
              ? `Volume ${n.riff.volumeNumber}`
              : n.riff.title || "The riff";
        return `${display} has been revealed`;
      }
      return "A riff has been revealed";
    }
    case "RIFF_DEADLINE_CHANGED":
      return `Riff deadline change in ${n.club ? n.club.name : "your club"}`;
    case "NEW_COMMENT": {
      const count = n.commentCount ?? 1;
      const label = count === 1 ? "1 new comment" : `${count} new comments`;
      return `${label} on ${n.piece ? `"${n.piece.title}"` : "your piece"}`;
    }
    case "COMMENT_REPLY":
      return `${actor} replied to your comment`;
    case "CLUB_INVITATION":
      return `${actor} invited you to ${n.club ? n.club.name : "a club"}`;
    case "ALL_PIECES_SUBMITTED":
      return `All pieces submitted in ${n.club ? n.club.name : "your club"}`;
    default:
      return "New notification";
  }
}

function getLink(n: NotificationItemProps["notification"]): string {
  switch (n.type) {
    case "NEW_COMMENT":
    case "COMMENT_REPLY":
      if (n.piece) {
        const params = new URLSearchParams();
        if (n.riff?.id) params.set("riff", n.riff.id);
        params.set("notify", "1");
        return `/read/${n.piece.id}?${params.toString()}`;
      }
      if (n.riff) return `/riffs/${n.riff.id}`;
      break;
    case "CLUB_INVITATION":
    case "CLUB_MEMBER_JOINED":
    case "RIFF_CREATED":
    case "RIFF_DEADLINE_CHANGED":
      if (n.club) return `/clubs/${n.club.id}`;
      if (n.riff) return `/clubs/${n.riff.clubId}`;
      break;
    case "ALL_PIECES_SUBMITTED":
    case "PIECE_SUBMITTED_TO_RIFF":
      if (n.riff) return `/riffs/${n.riff.id}`;
      if (n.club) return `/clubs/${n.club.id}`;
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
