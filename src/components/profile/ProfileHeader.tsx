import Avatar from "@/components/shared/Avatar";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    username: string | null;
  };
  stats: {
    pieceCount: number;
    totalWordCount: number;
  };
}

export default function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.name ||
    user.username ||
    "Anonymous";

  const formattedWordCount = stats.totalWordCount.toLocaleString();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "48px 24px 32px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Avatar with black border */}
      <div
        style={{
          border: "2px solid #000000",
          borderRadius: "50%",
          overflow: "hidden",
          width: "52px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Avatar user={user} size={48} showBorder={false} />
      </div>

      {/* Name */}
      <h1
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "32px",
          fontWeight: 400,
          color: "#000000",
          margin: 0,
          textAlign: "center",
        }}
      >
        {displayName}
      </h1>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 700,
              color: "#000000",
            }}
          >
            {stats.pieceCount}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
            }}
          >
            pieces
          </span>
        </div>

        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
          }}
        >
          ·
        </span>

        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 700,
              color: "#000000",
            }}
          >
            {formattedWordCount}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
            }}
          >
            words
          </span>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            margin: 0,
            textAlign: "center",
            maxWidth: "480px",
            lineHeight: 1.5,
          }}
        >
          {user.bio}
        </p>
      )}
    </div>
  );
}
