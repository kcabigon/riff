"use client";

import Avatar from "@/components/shared/Avatar";
import { useProfileNavigation } from "@/hooks/useProfileNavigation";
import type { FriendSummary } from "@/lib/friends";

interface FriendsRowProps {
  friends: FriendSummary[];
  onInvite: () => void;
}

// Horizontal-scroll row of people you've shared a club or riff with — the
// circular avatar + name-below layout borrows from Instagram Stories, kept
// flat and minimal (no gradients, no "seen" state) to match Substack Home's
// plainer people row and this app's neo-brutalist palette. The trailing "+"
// tile is always present, even with zero friends, as the one entry point
// into inviting someone.
export default function FriendsRow({ friends, onInvite }: FriendsRowProps) {
  const handleClick = useProfileNavigation();

  const firstName = (friend: FriendSummary) =>
    (friend.name || friend.username || "Friend").split(" ")[0];

  return (
    <div
      style={{
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
            width: "66px",
          }}
        >
          <Avatar user={friend} size={56} style={{ cursor: "pointer" }} />
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
          width: "66px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
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
    </div>
  );
}
