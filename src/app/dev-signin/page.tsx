/**
 * Dev-only user switcher. Sets a cookie that getSession() in auth-utils.ts
 * picks up — no NextAuth sign-in flow, no email required.
 *
 * Add rows to TEST_USERS as you seed more accounts.
 */

const TEST_USERS = [
  { label: "rifftest (seed owner)", email: "kyle.cabigon+rifftest@gmail.com" },
  { label: "kyle (main)", email: "kyle.cabigon@gmail.com" },
  { label: "Alice Chen", email: "alice@test.local" },
  { label: "Bob Rivera", email: "bob@test.local" },
  { label: "Carol Kim", email: "carol@test.local" },
  { label: "Dave Okafor", email: "dave@test.local" },
];

export default function DevSignInPage() {
  if (process.env.NODE_ENV === "production") {
    return <p>Not available in production.</p>;
  }

  return (
    <div
      style={{
        padding: "64px 24px",
        fontFamily: "sans-serif",
        maxWidth: "420px",
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

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {TEST_USERS.map((u) => (
          <a
            key={u.email}
            href={`/api/dev/set-user?email=${encodeURIComponent(u.email)}`}
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
            <strong>{u.label}</strong>
            <span style={{ color: "#666", fontSize: "13px", marginLeft: "8px" }}>
              {u.email}
            </span>
          </a>
        ))}

        <a
          href="/api/dev/set-user"
          style={{
            display: "block",
            marginTop: "16px",
            padding: "14px 18px",
            border: "2px solid #000",
            backgroundColor: "#ffe0e0",
            fontSize: "15px",
            textDecoration: "none",
            color: "#000",
            boxShadow: "4px 4px 0px #000",
          }}
        >
          Sign out (clear dev session)
        </a>
      </div>
    </div>
  );
}
