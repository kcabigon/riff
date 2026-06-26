import Avatar from "@/components/shared/Avatar";

interface ReadByMember {
  user: { id: string; name: string | null; avatarUrl: string | null };
  readCount: number;
}

function ProgressRingAvatar({
  member,
  totalPieces,
  index,
}: {
  member: ReadByMember;
  totalPieces: number;
  index: number;
}) {
  const progress = Math.min(member.readCount / totalPieces, 1);
  const deg = progress * 360;

  return (
    <div
      title={member.user.name ?? undefined}
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: `conic-gradient(#00FF66 ${deg}deg, #E6E6E6 ${deg}deg)`,
        padding: "2px",
        marginRight: "-8px",
        zIndex: index,
        flexShrink: 0,
      }}
    >
      <Avatar
        user={{ ...member.user, username: null }}
        size={40}
        borderColor="#FFFFFF"
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
  if (members.length === 0 || totalPieces === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
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
          alignItems: "center",
          paddingRight: "8px",
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
