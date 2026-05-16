"use client";

interface ReadToggleProps {
  isRiffMode: boolean;
  onToggle: (isRiffMode: boolean) => void;
}

export default function ReadToggle({ isRiffMode, onToggle }: ReadToggleProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "2px solid #000000",
        overflow: "hidden",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "14px",
      }}
    >
      <button
        onClick={() => onToggle(false)}
        style={{
          padding: "6px 16px",
          border: "none",
          cursor: "pointer",
          backgroundColor: !isRiffMode ? "#000000" : "#FFFFFF",
          color: !isRiffMode ? "#FFFFFF" : "#000000",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 400,
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
      >
        Read
      </button>
      <button
        onClick={() => onToggle(true)}
        style={{
          padding: "6px 16px",
          border: "none",
          borderLeft: "2px solid #000000",
          cursor: "pointer",
          backgroundColor: isRiffMode ? "#000000" : "#FFFFFF",
          color: isRiffMode ? "#FFFFFF" : "#000000",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 400,
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
      >
        Comment
      </button>
    </div>
  );
}
