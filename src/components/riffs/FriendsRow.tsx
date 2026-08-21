"use client";

import Avatar from "@/components/shared/Avatar";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";

interface Friend {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  hasUnread: boolean;
}

interface FriendsRowProps {
  friends: Friend[];
}

// Horizontal-scroll row of people you've shared a club or riff with — the
// circular avatar + name-below layout borrows from Instagram Stories, kept
// flat and minimal (no gradients, no "seen" state) to match Substack Home's
// plainer people row and this app's neo-brutalist palette.
export default function FriendsRow({ friends }: FriendsRowProps) {
  const handleClick = useProfileNavigation();

  if (friends.length === 0) return null;

  const firstName = (friend: Friend) =>
    (friend.name || friend.username || "Friend").split(" ")[0];

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        overflowX: "auto",
        paddingBottom: "8px",
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
            width: "66px",
          }}
        >
          <Avatar
            user={friend}
            size={56}
            ringColor={friend.hasUnread ? "#00FF66" : "transparent"}
          />
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
    </div>
  );
}
