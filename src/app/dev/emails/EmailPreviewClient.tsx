"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Tagline from "@/components/Tagline";
import { useIsMobile } from "@/hooks/useMediaQuery";

// Browsing for the dev email preview (see page.tsx). Everything shown here was
// built on the server; this only switches between emails, versions and widths,
// and keeps the URL in step so a view can be linked to.

export interface PreviewEmail {
  id: string;
  name: string;
  trigger: string;
  variants: Array<{
    label: string;
    subject: string;
    preview?: string;
    html: string;
  }>;
}

export interface PreviewGroup {
  label: string;
  // A brand accent — the group's sidebar highlight and its inbox card shadow.
  color: string;
  emails: PreviewEmail[];
}

type Width = "desktop" | "mobile";
const WIDTHS: Record<Width, number> = { desktop: 600, mobile: 375 };
// The subject length past which mobile inboxes start truncating.
const SUBJECT_LIMIT = 45;

const sans = "var(--font-dm-sans)";
const serif = "var(--font-dm-serif-text)";

// Tagline highlights are sized by hand; this is close enough for short
// uppercase labels at 12px bold.
function taglineWidth(text: string) {
  return Math.round(text.length * 8.6 + 20);
}

export default function EmailPreviewClient({
  groups,
  initialEmail,
  initialVariant,
  initialWidth,
}: {
  groups: PreviewGroup[];
  initialEmail?: string;
  initialVariant: number;
  initialWidth: Width;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const all = groups.flatMap((g) => g.emails.map((e) => ({ ...e, group: g })));
  const totalVersions = all.reduce((n, e) => n + e.variants.length, 0);

  const [emailId, setEmailId] = useState(
    all.some((e) => e.id === initialEmail) ? initialEmail! : all[0].id
  );
  const [variantIndex, setVariantIndex] = useState(initialVariant);
  const [width, setWidth] = useState<Width>(initialWidth);

  const current = all.find((e) => e.id === emailId) ?? all[0];
  const vIndex = Math.min(
    Math.max(variantIndex, 0),
    current.variants.length - 1
  );
  const variant = current.variants[vIndex];

  // Keep the URL shareable without a page load per click.
  useEffect(() => {
    router.replace(`/dev/emails?email=${emailId}&v=${vIndex}&w=${width}`, {
      scroll: false,
    });
  }, [router, emailId, vIndex, width]);

  const selectEmail = useCallback((id: string) => {
    setEmailId(id);
    setVariantIndex(0);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      <TopBar emailCount={all.length} versionCount={totalVersions} />

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "stretch",
        }}
      >
        {isMobile ? (
          <ChipStrip
            groups={groups}
            activeId={current.id}
            onSelect={selectEmail}
          />
        ) : (
          <Sidebar
            groups={groups}
            activeId={current.id}
            onSelect={selectEmail}
          />
        )}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: isMobile ? "24px" : "40px",
          }}
        >
          <div style={{ maxWidth: "720px" }}>
            <h1
              style={{
                fontFamily: serif,
                fontSize: "32px",
                fontWeight: 400,
                lineHeight: 1.2,
                color: "#000000",
                margin: 0,
              }}
            >
              {current.name}
            </h1>
            <p
              style={{
                fontFamily: sans,
                fontSize: "16px",
                fontWeight: 300,
                lineHeight: 1.6,
                color: "#808080",
                margin: "8px 0 0",
              }}
            >
              {current.trigger}
            </p>

            <Controls
              variants={current.variants.map((v) => v.label)}
              active={vIndex}
              onVariant={setVariantIndex}
              width={width}
              onWidth={setWidth}
            />

            <InboxCard
              subject={variant.subject}
              preview={variant.preview}
              accent={current.group.color}
              maxWidth={WIDTHS[width]}
            />

            <EmailFrame
              key={`${current.id}:${vIndex}:${width}`}
              title={`${current.name} — ${variant.label}`}
              html={variant.html}
              width={width}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function TopBar({
  emailCount,
  versionCount,
}: {
  emailCount: number;
  versionCount: number;
}) {
  return (
    <header
      style={{
        borderBottom: "2px solid #000000",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <Link href="/" style={{ display: "flex" }}>
        <Image
          src="/images/riff_logo_black_shadow.svg"
          alt="Riff"
          width={44}
          height={28}
        />
      </Link>
      <span
        style={{
          fontFamily: sans,
          fontSize: "12px",
          fontWeight: 700,
          color: "#FFFFFF",
          backgroundColor: "#000000",
          padding: "4px 12px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Emails
      </span>
      <span
        style={{
          fontFamily: sans,
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
        }}
      >
        {emailCount} emails · {versionCount} versions
      </span>
    </header>
  );
}

function Sidebar({
  groups,
  activeId,
  onSelect,
}: {
  groups: PreviewGroup[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      style={{
        width: "280px",
        flexShrink: 0,
        borderRight: "1px solid #E6E6E6",
        padding: "16px 24px 40px",
        boxSizing: "border-box",
      }}
    >
      {groups.map((group) => (
        <div key={group.label} style={{ marginTop: "24px" }}>
          <Tagline
            text={group.label.toUpperCase()}
            color={group.color}
            width={taglineWidth(group.label)}
            fontSize={12}
            fontWeight={700}
            align="left"
            heightPadding={10}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginTop: "12px",
            }}
          >
            {group.emails.map((email) => (
              <SidebarItem
                key={email.id}
                email={email}
                accent={group.color}
                active={email.id === activeId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarItem({
  email,
  accent,
  active,
  onSelect,
}: {
  email: PreviewEmail;
  accent: string;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onSelect(email.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        width: "100%",
        textAlign: "left",
        padding: "8px 12px",
        border: `2px solid ${active ? "#000000" : "transparent"}`,
        boxShadow: active ? `4px 4px 0px 0px ${accent}` : "none",
        backgroundColor: active ? "#FFFFFF" : hover ? "#F5F5F5" : "transparent",
        fontFamily: sans,
        fontSize: "16px",
        fontWeight: active ? 500 : 300,
        color: "#000000",
        cursor: "pointer",
        marginBottom: active ? "4px" : 0,
      }}
    >
      <span>{email.name}</span>
      {email.variants.length > 1 && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: active ? "#000000" : "#808080",
            backgroundColor: active ? accent : "#E6E6E6",
            padding: "2px 8px",
          }}
        >
          {email.variants.length}
        </span>
      )}
    </button>
  );
}

// Phones: the sidebar becomes one scrolling row of chips.
function ChipStrip({
  groups,
  activeId,
  onSelect,
}: {
  groups: PreviewGroup[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      style={{
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        padding: "16px 24px 20px",
        borderBottom: "1px solid #E6E6E6",
      }}
    >
      {groups.flatMap((group) =>
        group.emails.map((email) => {
          const active = email.id === activeId;
          return (
            <button
              key={email.id}
              type="button"
              onClick={() => onSelect(email.id)}
              style={{
                flexShrink: 0,
                padding: "8px 12px",
                border: "2px solid #000000",
                boxShadow: active ? `4px 4px 0px 0px ${group.color}` : "none",
                backgroundColor: "#FFFFFF",
                fontFamily: sans,
                fontSize: "12px",
                fontWeight: active ? 700 : 300,
                color: "#000000",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {email.name}
            </button>
          );
        })
      )}
    </nav>
  );
}

function Controls({
  variants,
  active,
  onVariant,
  width,
  onWidth,
}: {
  variants: string[];
  active: number;
  onVariant: (i: number) => void;
  width: Width;
  onWidth: (w: Width) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        margin: "32px 0 40px",
      }}
    >
      {/* Versions — bordered chips, so they read as controls rather than as
          more of the description above them. The active one fills black. */}
      <div>
        <ControlLabel>Versions</ControlLabel>
        <div
          role="tablist"
          style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}
        >
          {variants.map((label, i) => {
            const on = i === active;
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onVariant(i)}
                style={{
                  padding: "8px 12px",
                  border: "2px solid #000000",
                  backgroundColor: on ? "#000000" : "#FFFFFF",
                  fontFamily: sans,
                  fontSize: "12px",
                  fontWeight: on ? 700 : 300,
                  color: on ? "#FFFFFF" : "#000000",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Width — a two-way switch */}
      <div>
        <ControlLabel>Width</ControlLabel>
        <div style={{ display: "flex", border: "2px solid #000000" }}>
          {(["desktop", "mobile"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWidth(w)}
              aria-pressed={width === w}
              style={{
                padding: "8px 12px",
                border: "none",
                borderLeft: w === "mobile" ? "2px solid #000000" : "none",
                backgroundColor: width === w ? "#000000" : "#FFFFFF",
                fontFamily: sans,
                fontSize: "12px",
                fontWeight: 700,
                color: width === w ? "#FFFFFF" : "#000000",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 8px",
        fontFamily: sans,
        fontSize: "11px",
        fontWeight: 700,
        color: "#808080",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </p>
  );
}

// What the email looks like before it's opened.
function InboxCard({
  subject,
  preview,
  accent,
  maxWidth,
}: {
  subject: string;
  preview?: string;
  accent: string;
  maxWidth: number;
}) {
  const over = subject.length > SUBJECT_LIMIT;
  return (
    <div
      style={{
        maxWidth: `${maxWidth}px`,
        boxSizing: "border-box",
        border: "2px solid #000000",
        boxShadow: `8px 8px 0px 0px ${accent}`,
        padding: "16px 20px",
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
        marginBottom: "40px",
      }}
    >
      <div
        aria-hidden
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "64px",
          backgroundColor: "#000000",
          color: "#FFFFFF",
          fontFamily: serif,
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        R
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
            fontFamily: sans,
            fontSize: "12px",
            color: "#808080",
          }}
        >
          <span style={{ fontWeight: 700, color: "#000000" }}>Riff</span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: over ? "#DC2626" : "#9C9C9C",
            }}
          >
            {subject.length} chars{over && ` · over ${SUBJECT_LIMIT}`}
          </span>
        </div>
        <p
          style={{
            margin: "4px 0 0",
            fontFamily: sans,
            fontSize: "16px",
            fontWeight: 700,
            color: "#000000",
            lineHeight: 1.4,
          }}
        >
          {subject}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontFamily: sans,
            fontSize: "16px",
            fontWeight: 300,
            lineHeight: 1.4,
            color: preview ? "#808080" : "#DC2626",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {preview ?? "No preview text"}
        </p>
      </div>
    </div>
  );
}

// The opened email, at the chosen width, grown to its full height so there's
// no scrolling inside a box. allow-same-origin (without allow-scripts) is what
// lets the page measure it; email HTML carries no scripts, and none could run.
function EmailFrame({
  title,
  html,
  width,
}: {
  title: string;
  html: string;
  width: Width;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(800);

  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (doc?.documentElement) setHeight(doc.documentElement.scrollHeight);
  }, []);

  return (
    <div>
      <p
        style={{
          margin: "0 0 12px",
          fontFamily: sans,
          fontSize: "11px",
          fontWeight: 700,
          color: "#808080",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {width} · {WIDTHS[width]}px
      </p>
      <div
        style={{
          width: `${WIDTHS[width]}px`,
          maxWidth: "100%",
          border: "2px solid #000000",
          boxShadow: "8px 8px 0px 0px #000000",
          backgroundColor: "#F5F5F5",
        }}
      >
        <iframe
          ref={ref}
          title={title}
          srcDoc={html}
          sandbox="allow-same-origin"
          onLoad={() => {
            measure();
            // Web fonts and images settle after load and can change height.
            setTimeout(measure, 400);
          }}
          style={{
            display: "block",
            width: "100%",
            height: `${height}px`,
            border: "none",
          }}
        />
      </div>
    </div>
  );
}
