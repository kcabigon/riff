"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll for unread count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const { count } = await res.json();
          setUnreadCount(count);
        }
      } catch {
        // silent
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Image
          src="/icons/notification.svg"
          alt="Notifications"
          width={24}
          height={24}
        />

        {unreadCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              minWidth: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "#FF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "10px",
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          onClose={() => setIsOpen(false)}
          onMarkAllRead={() => setUnreadCount(0)}
        />
      )}
    </div>
  );
}
