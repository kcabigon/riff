"use client";

interface ToastProps {
  message: string;
  type: "success" | "error" | "loading";
  /** Shown as a dismiss button when provided. Auto-dismiss timing (if any)
   * is the caller's responsibility — some toasts persist until dismissed,
   * others clear on a timer, and that varies by context. */
  onDismiss?: () => void;
}

const DOT_COLOR: Record<ToastProps["type"], string> = {
  success: "#00FF66",
  error: "#DC2626",
  loading: "#EECF01",
};

export default function Toast({ message, type, onDismiss }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 60,
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "4px 4px 0px 0px #000000",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          flexShrink: 0,
          background: DOT_COLOR[type],
          ...(type === "loading" && {
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }),
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: type === "error" ? "#DC2626" : "#000000",
        }}
      >
        {message}
      </span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 0 0 4px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            color: "#808080",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
