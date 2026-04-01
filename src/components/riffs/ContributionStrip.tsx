import Avatar from "@/components/shared/Avatar";

interface ContributionStripProps {
  members: Array<{
    user: { id: string; name: string | null; avatarUrl: string | null };
    readCount: number;
    commentCount: number;
  }>;
  totalPieces: number;
}

export default function ContributionStrip({
  members,
  totalPieces,
}: ContributionStripProps) {
  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "20px",
          fontWeight: 300,
          color: "#808080",
          margin: "0 0 16px 0",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Making Noise
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "24px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}
      >
        {members.map(({ user, readCount, commentCount }) => {
          const firstName = user.name?.split(" ")[0] ?? "—";
          return (
            <div
              key={user.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                minWidth: "80px",
                maxWidth: "100px",
              }}
            >
              <Avatar
                user={{
                  id: user.id,
                  name: user.name,
                  username: null,
                  avatarUrl: user.avatarUrl,
                }}
                size={40}
                borderColor="#000000"
              />
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#000000",
                  margin: 0,
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {firstName}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#808080",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {readCount}/{totalPieces}
              </p>
              {commentCount > 0 && (
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#808080",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  {commentCount} {commentCount === 1 ? "comment" : "comments"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
