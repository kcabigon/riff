"use client";

import { useState, useEffect } from "react";
import NotificationItem from "./NotificationItem";
import { formatDateShort } from "@/lib/riff-utils";

interface NotificationData {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; name: string | null; avatarUrl: string | null } | null;
  club: { id: string; name: string } | null;
  riff: { id: string; title: string; clubId: string } | null;
  piece: { id: string; title: string } | null;
}

interface NotificationPanelProps {
  onClose: () => void;
  onMarkAllRead: () => void;
}

export default function NotificationPanel({
  onClose,
  onMarkAllRead,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNotificationDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notifications?limit=20");
        if (res.ok) {
          const { notifications: data } = await res.json();
          setNotifications(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications([]);
    onMarkAllRead();
  };

  // Group by date
  const grouped: Record<string, NotificationData[]> = {};
  notifications.forEach((n) => {
    const date = formatDateShort(n.createdAt);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(n);
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: "360px",
        maxHeight: "480px",
        overflowY: "auto",
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "4px 4px 0px 0px #000000",
        zIndex: 60,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid #E6E6E6",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 700,
            color: "#000000",
            margin: 0,
          }}
        >
          Notifications
        </h3>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: "24px", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
            }}
          >
            Loading...
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
            }}
          >
            No notifications yet
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "#FAFAFA",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                }}
              >
                {date}
              </p>
            </div>
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
                onDismiss={handleNotificationDismiss}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
