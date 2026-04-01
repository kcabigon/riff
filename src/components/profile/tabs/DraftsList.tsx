"use client";

interface DraftPiece {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  riffs: Array<{ id: string; title: string | null; clubName: string }>;
}

interface DraftsListProps {
  drafts: DraftPiece[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DraftsList({ drafts }: DraftsListProps) {
  if (drafts.length === 0) {
    return (
      <div
        style={{
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          No drafts yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0", width: "100%" }}>
      {drafts.map((draft, index) => {
        const hasTitle = draft.title && draft.title.trim().length > 0;
        const dateLabel = hasTitle
          ? formatDate(draft.createdAt)
          : `Last updated: ${formatDate(draft.updatedAt)}`;

        return (
          <a
            key={draft.id}
            href={`/write/${draft.id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div
              style={{
                height: "103px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingLeft: "24px",
                paddingRight: "24px",
                paddingTop: "12px",
                backgroundColor: "#FFFFFF",
                borderBottom:
                  index < drafts.length - 1 ? "1px solid #959595" : "none",
                boxSizing: "border-box",
              }}
            >
              {/* Title */}
              <p
                style={{
                  fontFamily: "var(--font-dm-serif-text)",
                  fontSize: "20px",
                  fontWeight: 400,
                  color: "#000000",
                  margin: "0 0 4px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {draft.title || "Untitled"}
              </p>

              {/* Date */}
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: "0 0 8px 0",
                }}
              >
                {dateLabel}
              </p>

              {/* Status row: icon + label + riff pills */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {/* Status icon */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  {draft.isShared ? (
                    // Globe icon for Shared
                    <path
                      d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5c-.28 0-1.48-.9-2.15-3.5H12.15c-.67 2.6-1.87 3.5-2.15 3.5zM7.6 11.5c-.03-.47-.1-1-.1-1.5s.07-1.03.1-1.5h4.8c.03.47.1 1 .1 1.5s-.07 1.03-.1 1.5H7.6zm.55-5.5c.67-2.6 1.87-3.5 2.15-3.5s1.48.9 2.15 3.5H8.15zM5.5 6c.6-.84 1.52-1.47 2.58-1.78-.58.93-1 2.2-1.1 3.28H5.5V6zm0 5.5h1.48c-.03.47-.08.96-.08 1.5s.05 1.03.08 1.5H5.5c0-1 0-2 0-3zm8.52-5.5V6c-1.06.31-1.98.94-2.58 1.78-.1-1.08-.52-2.35-1.1-3.28 1.06.31 1.98.94 2.58 1.78h1.1zm0 5.5h-1.48c.03.47.08.96.08 1.5s-.05 1.03-.08 1.5h1.48c0-1 0-2 0-3z"
                      fill="#808080"
                    />
                  ) : (
                    // Lock icon for Draft
                    <path
                      d="M15 8h-1V6c0-2.21-1.79-4-4-4S6 3.79 6 6v2H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-6 0V6c0-1.1.9-2 2-2s2 .9 2 2v2H9z"
                      fill="#808080"
                    />
                  )}
                </svg>

                {/* Status label */}
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#808080",
                  }}
                >
                  {draft.isShared ? "Shared" : "Draft"}
                </span>

                {/* Riff pills */}
                {draft.riffs.map((riff) => (
                  <span
                    key={riff.id}
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "#000000",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #00FF66",
                      borderRadius: "2px",
                      padding: "4px 12px",
                    }}
                  >
                    {riff.title || `${riff.clubName}: Active Riff`}
                  </span>
                ))}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
