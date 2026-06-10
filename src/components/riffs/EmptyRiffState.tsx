"use client";

import CTAButton from "@/components/CTAButton";

interface EmptyRiffStateProps {
  onStartNewRiff: () => void;
  isAdmin?: boolean;
  hostName?: string | null;
}

export default function EmptyRiffState({
  onStartNewRiff,
  isAdmin = true,
  hostName,
}: EmptyRiffStateProps) {
  if (!isAdmin) {
    const hostFirstName = hostName?.split(" ")[0] ?? "The host";
    return (
      <div
        style={{
          padding: "40px",
          backgroundColor: "#F9F9F9",
          border: "2px dashed #E6E6E6",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#959595",
            margin: 0,
          }}
        >
          {hostFirstName} will start the next riff soon.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <CTAButton onClick={onStartNewRiff}>Let&apos;s riff</CTAButton>
    </div>
  );
}
