"use client";

interface BackLinkProps {
  onClick: () => void;
}

// Small centered underlined text link for stepping back to a modal's
// previous screen — distinct from BackButton, which is page-level arrow-icon
// navigation, not a text link.
export default function BackLink({ onClick }: BackLinkProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={onClick}
        style={{
          backgroundColor: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          padding: "4px 12px",
          textDecoration: "underline",
        }}
      >
        Back
      </button>
    </div>
  );
}
