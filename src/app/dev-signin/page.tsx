import { prisma } from "@/lib/prisma";

/**
 * Dev-only sign-in page. Shows seeded test users grouped by test scenario,
 * with redirect hints so each user lands at the right starting point.
 *
 * Queries the DB for seeded data (club ID, user IDs) and falls back
 * gracefully if seed data doesn't exist yet.
 */

interface Scenario {
  label: string;
  description: string;
  email: string;
  userName: string;
  redirect: string;
}

async function getSeedData() {
  // Find the seeded club
  const club = await prisma.club.findFirst({
    where: { name: "The Sunday Writers" },
    select: { id: true },
  });

  // Find the writer user for profile link
  const writer = await prisma.user.findUnique({
    where: { email: "writer@test.local" },
    select: { id: true },
  });

  return { clubId: club?.id ?? null, writerId: writer?.id ?? null };
}

export default async function DevSignInPage() {
  if (process.env.NODE_ENV === "production") {
    return <p>Not available in production.</p>;
  }

  const { clubId, writerId } = await getSeedData();
  const hasSeeded = clubId !== null;

  const scenarios: Scenario[] = hasSeeded
    ? [
        {
          label: "Scenario 1: Fresh onboarding",
          description:
            "Start here to test the full onboarding flow from scratch (name → club choice → create club → banner → invite).",
          email: "fresh@test.local",
          userName: "Fresh User",
          redirect: "/onboarding",
        },
        {
          label: "Scenario 2: Resume onboarding",
          description:
            "Onboarding resumes at the club-choice step (name already set).",
          email: "midway@test.local",
          userName: "Midway User",
          redirect: "/onboarding",
        },
        {
          label: "Scenario 3: Host (all read)",
          description:
            'Club admin. Active riff: "Continue writing". Revealed riff: all 4/4 read → appears in Completed Riffs.',
          email: "writer@test.local",
          userName: "Writer (Host)",
          redirect: `/clubs/${clubId}`,
        },
        {
          label: "Scenario 4: Continue reading",
          description:
            'Revealed riff: 2/4 pieces read → "Continue reading" CTA in Ready to Reveal section.',
          email: "alice@test.local",
          userName: "Alice Chen",
          redirect: `/clubs/${clubId}`,
        },
        {
          label: "Scenario 5: First reveal",
          description:
            'Revealed riff: 0/4 pieces read → "Reveal" CTA. Click to see pieces gallery.',
          email: "bob@test.local",
          userName: "Bob Rivera",
          redirect: `/clubs/${clubId}`,
        },
        {
          label: "Scenario 6: Not joined to riff",
          description:
            "Club member but hasn't joined the active riff.",
          email: "carol@test.local",
          userName: "Carol Kim",
          redirect: `/clubs/${clubId}`,
        },
        ...(writerId
          ? [
              {
                label: "Scenario 7: Profile + drafts",
                description:
                  'Test the "Start writing" button on the drafts tab.',
                email: "writer@test.local",
                userName: "Writer (profile)",
                redirect: `/profile/${writerId}`,
              },
            ]
          : []),
      ]
    : [];

  return (
    <div
      style={{
        padding: "64px 24px",
        fontFamily: "sans-serif",
        maxWidth: "520px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
        Dev Sign In
      </h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "32px" }}>
        Sets a cookie — no email required. Persists until you click{" "}
        <strong>Sign out</strong>.
      </p>

      {!hasSeeded && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          <strong>Seed data not found.</strong> Run{" "}
          <code style={{ backgroundColor: "#eee", padding: "2px 6px" }}>
            npm run db:seed:dev
          </code>{" "}
          to create test users and scenarios.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {scenarios.map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#999",
                marginBottom: "6px",
              }}
            >
              {s.label}
            </div>
            <a
              href={`/api/dev/set-user?email=${encodeURIComponent(s.email)}&redirect=${encodeURIComponent(s.redirect)}`}
              style={{
                display: "block",
                padding: "14px 18px",
                border: "2px solid #000",
                backgroundColor: "#fff",
                fontSize: "15px",
                textDecoration: "none",
                color: "#000",
                boxShadow: "4px 4px 0px #000",
              }}
            >
              <strong>{s.userName}</strong>
              <span
                style={{ color: "#666", fontSize: "13px", marginLeft: "8px" }}
              >
                {s.email}
              </span>
              <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
                {s.description}
              </div>
            </a>
          </div>
        ))}
      </div>

      <a
        href="/api/dev/set-user"
        style={{
          display: "block",
          marginTop: "28px",
          padding: "14px 18px",
          border: "2px solid #000",
          backgroundColor: "#ffe0e0",
          fontSize: "15px",
          textDecoration: "none",
          color: "#000",
          boxShadow: "4px 4px 0px #000",
          textAlign: "center" as const,
        }}
      >
        Sign out (clear dev session)
      </a>
    </div>
  );
}
