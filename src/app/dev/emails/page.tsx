import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmailPreviews } from "./fixtures";

/**
 * Dev-only email preview. Renders every transactional email with sample data,
 * exactly as its send function would build it — nothing is sent and the
 * database is never touched. Every deployed environment runs with
 * NODE_ENV=production (see vercel.json), so this only exists locally.
 */

const WIDTHS = { desktop: 600, mobile: 375 } as const;
type Width = keyof typeof WIDTHS;

const sans = "var(--font-dm-sans)";
const serif = "var(--font-dm-serif-text)";

function href(email: string, variant: number, width: Width) {
  return `/dev/emails?email=${email}&v=${variant}&w=${width}`;
}

export default async function EmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; v?: string; w?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const previews = getEmailPreviews();
  const current = previews.find((p) => p.id === params.email) ?? previews[0];
  const variantIndex = Math.min(
    Math.max(Number(params.v) || 0, 0),
    current.variants.length - 1
  );
  const width: Width = params.w === "mobile" ? "mobile" : "desktop";
  const variant = current.variants[variantIndex];
  const email = variant.build();

  const pill = (active: boolean) => ({
    fontFamily: sans,
    fontSize: "12px",
    fontWeight: active ? 700 : 300,
    padding: "4px 12px",
    border: `2px solid ${active ? "#000000" : "#E6E6E6"}`,
    background: active ? "#00FF66" : "#FFFFFF",
    color: "#000000",
    textDecoration: "none",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: sans,
        background: "#FFFFFF",
      }}
    >
      <nav
        style={{
          width: "240px",
          flexShrink: 0,
          borderRight: "1px solid #E6E6E6",
          padding: "24px 0",
        }}
      >
        <h1
          style={{
            fontFamily: serif,
            fontSize: "24px",
            fontWeight: 400,
            margin: "0 24px 4px",
          }}
        >
          Emails
        </h1>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 300,
            color: "#808080",
            margin: "0 24px 16px",
          }}
        >
          Dev preview · nothing is sent
        </p>
        {previews.map((p, i) => {
          const active = p.id === current.id;
          return (
            <Link
              key={p.id}
              href={href(p.id, 0, width)}
              style={{
                display: "flex",
                gap: "8px",
                padding: "8px 24px",
                fontSize: "16px",
                fontWeight: active ? 500 : 300,
                color: active ? "#000000" : "#808080",
                background: active ? "#F5F5F5" : "transparent",
                borderLeft: `4px solid ${active ? "#00FF66" : "transparent"}`,
                textDecoration: "none",
              }}
            >
              <span style={{ width: "20px", color: "#9C9C9C" }}>{i + 1}</span>
              <span>{p.name}</span>
              {p.variants.length > 1 && (
                <span style={{ marginLeft: "auto", color: "#9C9C9C" }}>
                  {p.variants.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <main style={{ flex: 1, padding: "24px 40px", minWidth: 0 }}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: "32px",
            fontWeight: 400,
            margin: "0 0 8px",
          }}
        >
          {current.name}
        </h2>
        <p
          style={{
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: "0 0 16px",
          }}
        >
          {current.trigger}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          {current.variants.map((v, i) => (
            <Link
              key={v.label}
              href={href(current.id, i, width)}
              style={pill(i === variantIndex)}
            >
              {v.label}
            </Link>
          ))}
          <span style={{ flex: 1 }} />
          {(Object.keys(WIDTHS) as Width[]).map((w) => (
            <Link
              key={w}
              href={href(current.id, variantIndex, w)}
              style={pill(w === width)}
            >
              {w === "desktop" ? "Desktop" : "Mobile"}
            </Link>
          ))}
        </div>

        {/* The inbox row: what someone sees before opening the email */}
        <div
          style={{
            maxWidth: `${WIDTHS[width]}px`,
            border: "2px solid #000000",
            padding: "12px 16px",
            marginBottom: "16px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#808080" }}>
            Riff · Inbox
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700 }}>
            {email.subject}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "16px",
              fontWeight: 300,
              color: email.preview ? "#808080" : "#DC2626",
            }}
          >
            {email.preview ?? "No preview text"}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#9C9C9C" }}>
            Subject: {email.subject.length} characters
            {email.subject.length > 45 && " — over the 45 recommended"}
          </p>
        </div>

        <iframe
          title={`${current.name} — ${variant.label}`}
          srcDoc={email.html}
          sandbox=""
          style={{
            width: `${WIDTHS[width]}px`,
            maxWidth: "100%",
            height: "900px",
            border: "1px solid #E6E6E6",
            display: "block",
          }}
        />
      </main>
    </div>
  );
}
