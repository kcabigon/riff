"use client";

interface AdminBadgeProps {
  type?: "admin" | "moderator";
  size?: number;
}

export default function AdminBadge({ type = "admin", size = 14 }: AdminBadgeProps) {
  return (
    <div
      title={type === "admin" ? "Host" : "Moderator"}
      style={{
        position: "absolute",
        bottom: "-2px",
        right: "-2px",
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: type === "admin" ? "#EECF01" : "#955CB5",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #FFFFFF",
        zIndex: 2,
      }}
    >
      {type === "admin" ? (
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 10 10"
          fill="none"
        >
          <path
            d="M5 1L6.5 3.5L9 4L7 6L7.5 9L5 7.5L2.5 9L3 6L1 4L3.5 3.5L5 1Z"
            fill="#000000"
          />
        </svg>
      ) : (
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 8 8"
          fill="none"
        >
          <circle cx="4" cy="4" r="2" fill="#FFFFFF" />
        </svg>
      )}
    </div>
  );
}
