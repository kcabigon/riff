"use client";

import Avatar from "@/components/shared/Avatar";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface ReadByMember {
  user: { id: string; name: string | null; avatarUrl: string | null };
  readCount: number;
  commentCount: number;
}

function ProgressRingAvatar({
  member,
  totalPieces,
}: {
  member: ReadByMember;
  totalPieces: number;
  index: number;
}) {
  const firstName = member.user.name?.split(" ")[0] ?? "Someone";
  const tooltipText =
    member.commentCount === 0
      ? firstName
      : `${firstName} · ${member.commentCount === 1 ? "1 comment" : `${member.commentCount} comments`}`;
  const progress = Math.min(member.readCount / totalPieces, 1);
  const deg = progress * 360;

  return (
    <div
      title={tooltipText}
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background:
          progress === 1
            ? "#000000"
            : `conic-gradient(#00FF66 ${deg}deg, #E6E6E6 ${deg}deg)`,
        padding: "2px",
        flexShrink: 0,
      }}
    >
      <Avatar
        user={{ ...member.user, username: null }}
        size={40}
        borderColor="#FFFFFF"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}

export default function ReadByStrip({
  members,
  totalPieces,
}: {
  members: ReadByMember[];
  totalPieces: number;
}) {
  const isMobile = useIsMobile();

  if (members.length === 0 || totalPieces === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: "12px",
        marginTop: "40px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          margin: 0,
          flexShrink: 0,
        }}
      >
        Read by
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
        }}
      >
        {members.map((member, i) => (
          <ProgressRingAvatar
            key={member.user.id}
            member={member}
            totalPieces={totalPieces}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
