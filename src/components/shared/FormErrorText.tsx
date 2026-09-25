"use client";

interface FormErrorTextProps {
  /** Renders nothing when empty, so callers don't need their own guard. */
  message?: string | null;
}

// The standard inline form error line, shared by the creation flows so their
// error states stay visually identical.
export default function FormErrorText({ message }: FormErrorTextProps) {
  if (!message) return null;

  return (
    <p
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "14px",
        fontWeight: 300,
        color: "#DC2626",
        margin: 0,
        textAlign: "center",
      }}
    >
      {message}
    </p>
  );
}
