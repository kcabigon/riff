"use client";

import Image from "next/image";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useMediaQuery";

// Accent palette (fallback for months without an explicit color below).
const ACCENTS = ["#00FF66", "#01EFFC", "#EECF01", "#C01582", "#955CB5"];

// Per-month theming — colors the month pill (bg + text) and that month's card shadows.
const MONTH_THEMES: Record<string, { color: string; pillText: string }> = {
  "June 2026": { color: "#00FF66", pillText: "#000000" }, // brand green
  "May 2026": { color: "#01EFFC", pillText: "#000000" }, // brand cyan
};

interface Release {
  date: string;
  title: string;
  body: string;
  credit?: string;
  creditEmoji?: string; // emoji before the shoutout (🎉 feedback, 🛠️ built, etc.)
  image?: { src: string; alt: string; maxWidth?: number };
}

// Shipped to production since mid-May 2026. End-user-facing only.
const RELEASES: Release[] = [
  {
    date: "June 2026",
    title: "Comments, now in stereo.",
    body: "Comments used to be one-shots. Now you can reply right back — desktop expands a thread inline on the card, mobile keeps it inside the existing comment sheet. Read a piece, leave a thought, get a response, keep it going.",
    credit: "Nice one, Derek!",
    creditEmoji: "🛠️",
  },
  {
    date: "June 2026",
    title: "New font, who dis?",
    body: "Not everyone loves Playfair Display as much as we do. So we added some more options: another serif, 2 sans serifs, and a mono (for you weirdos). Unfortunately, Wingdings didn't make the cut.",
    credit: "Shoutout Cass for the feedback!",
    creditEmoji: "🎉",
    image: {
      src: "/whats-new/font-picker.png",
      alt: "Font picker open in the editor toolbar",
    },
  },
  {
    date: "June 2026",
    title: "WTF is Riff?",
    body: "Jarric loves tutorials. So he made a new flow that walks you through a whole riff — writing, submitting, and the big reveal — plus a Getting Started checklist on your club page. If you're reading this, you probably won't get to see it (you're an existing user), but we hope new users will like it.",
    credit: "Built by Jarric.",
    creditEmoji: "🛠️",
    image: {
      src: "/whats-new/welcome.png",
      alt: "The welcome screen for a new write club",
      maxWidth: 360,
    },
  },
  {
    date: "June 2026",
    title: "Riffs that read better",
    body: "Untitled riffs now show their Volume number automatically, deadlines get an urgency-colored countdown as time runs low, dates read cleaner across the board, and “Join riff” became a more fitting “Let's riff.”",
    credit: "Also built by Jarric.",
    creditEmoji: "🛠️",
  },
  {
    date: "June 2026",
    title: "Room to breathe",
    body: "There's now more room to write at the bottom of the page while the toolbar stays out of your way. A redesigned submit step where you add your cover right on the preview makes submissions less scary (still kinda scary but we're talking about it). And image uploads bumped from 5MB to 10MB so you can upload some high-res stuff.",
    credit: "Thanks Puneet, Taylor, and Cass for the feedback!",
    creditEmoji: "🎉",
    image: {
      src: "/whats-new/write.png",
      alt: "The editor with a clean, spacious writing area",
    },
  },
  {
    date: "June 2026",
    title: "“Account,” not “Settings”",
    body: "You told us “Settings” vs “Profile” was confusing. Now it's clearer: your Profile is your public, social self — your Account is where you manage your personal stuff.",
    credit: "Jarric and Derek got in a fight over this.",
    creditEmoji: "🥊",
    image: { src: "/whats-new/account.png", alt: "Account in the avatar menu" },
  },
  {
    date: "May 2026",
    title: "Profiles & reading, fixed up",
    body: "Your profile now orders pieces by when you actually shared them, read pages show submitted dates, lock icons appear consistently on unrevealed pieces, and friends can click straight through to your public pieces.",
    credit: "I've lost track. Jarric, did you build this?",
    creditEmoji: "🛠️",
  },
  {
    date: "May 2026",
    title: "Club pages leveled up",
    body: "Avatar stacks now show up to ten members with a tidy +N for the rest, and club headers look consistent whether you're on mobile or desktop, banner or no banner.",
    credit:
      "Because who knows, you might want to start a write club with your entire basketball team.",
    creditEmoji: "🏀",
    image: {
      src: "/whats-new/club.png",
      alt: "A club page with member avatars and a read card",
    },
  },
];

const COMING_SOON: { title: string; body: string }[] = [
  {
    title: "Captions for images",
    body: "Add a caption beneath the images in your writing.",
  },
  {
    title: "Google Docs integration",
    body: "Bring a draft in from Google Docs without the copy-paste dance.",
  },
];

export default function WhatsNewPage() {
  const isMobile = useIsMobile();
  const pad = isMobile ? 24 : 32;

  // Group releases by month so each month label shows once (no duplicate pills).
  const months = RELEASES.reduce<{ month: string; items: Release[] }[]>(
    (acc, r) => {
      const last = acc[acc.length - 1];
      if (last && last.month === r.date) last.items.push(r);
      else acc.push({ month: r.date, items: [r] });
      return acc;
    },
    []
  );

  // Within each month, show features with images first; text-only ones sink to the bottom.
  for (const g of months) {
    g.items = [
      ...g.items.filter((r) => r.image),
      ...g.items.filter((r) => !r.image),
    ];
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Minimal header — matches about / public piece pages */}
      <div
        style={{
          borderBottom: "1px solid #E6E6E6",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: `${isMobile ? 40 : 64}px ${pad}px ${isMobile ? 64 : 96}px`,
          boxSizing: "border-box",
        }}
      >
        {/* Hero */}
        <header style={{ marginBottom: isMobile ? 40 : 56 }}>
          <h1
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: isMobile ? "28px" : "36px",
              lineHeight: 1.15,
              color: "#000000",
              margin: 0,
            }}
          >
            What&apos;s new
          </h1>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#808080",
              margin: "12px 0 0",
            }}
          >
            The stuff we&apos;ve shipped lately — and a peek at what&apos;s
            next. Built with friends, for write clubs.
          </p>
        </header>

        {/* Shipped — grouped by month */}
        <section
          aria-label="Recently shipped"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 48 : 64,
          }}
        >
          {months.map((g, gi) => {
            const theme = MONTH_THEMES[g.month] ?? {
              color: ACCENTS[gi % ACCENTS.length],
              pillText: "#000000",
            };
            return (
              <div key={g.month}>
                {/* Month pill — once per group */}
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: theme.color,
                    border: "2px solid #000000",
                    padding: "2px 10px",
                    fontFamily: "var(--font-dm-sans)",
                    fontWeight: 700,
                    fontSize: "11px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: theme.pillText,
                    marginBottom: isMobile ? "24px" : "28px",
                  }}
                >
                  {g.month}
                </span>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? 36 : 44,
                  }}
                >
                  {g.items.map((r) => (
                    <article
                      key={r.title}
                      style={{
                        border: "2px solid #000000",
                        boxShadow: `8px 8px 0px 0px ${theme.color}`,
                        backgroundColor: "#FFFFFF",
                        padding: pad,
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: isMobile ? "24px" : "28px",
                          lineHeight: 1.2,
                          color: "#000000",
                          margin: "0 0 10px",
                        }}
                      >
                        {r.title}
                      </h2>

                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontWeight: 300,
                          fontSize: "16px",
                          lineHeight: 1.6,
                          color: "#000000",
                          margin: 0,
                        }}
                      >
                        {r.body}
                      </p>

                      {r.credit && (
                        <div
                          style={{
                            marginTop: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "15px", flexShrink: 0 }}>
                            {r.creditEmoji}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-dm-sans)",
                              fontStyle: "italic",
                              fontWeight: 400,
                              fontSize: "14px",
                              color: "#000000",
                            }}
                          >
                            {r.credit}
                          </span>
                        </div>
                      )}

                      {r.image && (
                        <div
                          style={{
                            marginTop: "20px",
                            ...(r.image.maxWidth
                              ? {
                                  maxWidth: `${r.image.maxWidth}px`,
                                  marginLeft: "auto",
                                  marginRight: "auto",
                                }
                              : {}),
                            overflow: "hidden",
                            lineHeight: 0,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.image.src}
                            alt={r.image.alt}
                            style={{
                              width: "100%",
                              height: "auto",
                              display: "block",
                            }}
                          />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* What we're working on */}
        <section
          aria-label="What we're working on"
          style={{ marginTop: isMobile ? 56 : 80 }}
        >
          <h2
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: isMobile ? "28px" : "36px",
              lineHeight: 1.15,
              color: "#000000",
              margin: "0 0 8px",
            }}
          >
            What we&apos;re working on
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#808080",
              margin: "0 0 24px",
              maxWidth: "560px",
            }}
          >
            We hear you. A few of the most-requested things we&apos;re building
            next:
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {COMING_SOON.map((c) => (
              <div
                key={c.title}
                style={{
                  border: "2px dashed #CCCCCC",
                  padding: pad,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? "8px" : "16px",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    backgroundColor: "#EECF01",
                    border: "2px solid #000000",
                    padding: "2px 10px",
                    fontFamily: "var(--font-dm-sans)",
                    fontWeight: 700,
                    fontSize: "11px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#000000",
                  }}
                >
                  Soon
                </span>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "20px",
                      lineHeight: 1.2,
                      color: "#000000",
                      margin: "0 0 4px",
                    }}
                  >
                    {c.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 300,
                      fontSize: "15px",
                      lineHeight: 1.5,
                      color: "#000000",
                      margin: 0,
                    }}
                  >
                    {c.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <div style={{ marginTop: isMobile ? 48 : 64, textAlign: "center" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 700,
              fontSize: "15px",
              color: "#000000",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Back to riffing &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
