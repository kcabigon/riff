"use client";

interface EmptyRiffStateProps {
  isAdmin?: boolean;
  hostName?: string | null;
}

// Admins/co-hosts get nothing here — the nav bar's "Let's Riff" button is
// the only start-a-riff CTA now, so there's no admin state left to render.
export default function EmptyRiffState({
  isAdmin = true,
  hostName,
}: EmptyRiffStateProps) {
  if (isAdmin) return null;

  const hostFirstName = hostName?.split(" ")[0] ?? "The host";
  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: "#F5F5F5",
        border: "2px dashed #E6E6E6",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#9C9C9C",
          margin: 0,
        }}
      >
        {hostFirstName} will start the next riff soon.
      </p>
    </div>
  );
}
