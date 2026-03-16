"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NoiseBackground from "@/components/NoiseBackground";

export default function AboutPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", position: "relative" }}>
      <NoiseBackground fillMode="cover" />

      {/* Navigation Bar — mirrors landing page */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#000000",
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: "8px 42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <Image
              src="/images/landing/riff_logo.svg"
              alt="Riff logo"
              width={30}
              height={22}
              priority
            />
            <span
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "32px",
                fontWeight: 900,
                fontStyle: "italic",
                color: "#FFFFFF",
                lineHeight: 1,
              }}
              className="about-hidden-mobile"
            >
              Riff
            </span>
          </a>

          {/* Desktop nav */}
          <div className="about-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "40px" }}>
            <a
              href="/about#story"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#FFFFFF",
                textDecoration: "none",
              }}
            >
              What is this?
            </a>
            <a
              href="/about#team"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#FFFFFF",
                textDecoration: "none",
              }}
            >
              Who built this?
            </a>
            <button
              onClick={() => router.push("/login")}
              style={{
                backgroundColor: "#000000",
                border: "2px solid #FFFFFF",
                padding: "12px 24px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 400,
                color: "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.color = "#000000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#000000";
                e.currentTarget.style.color = "#FFFFFF";
              }}
            >
              Sign In
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="about-mobile-nav"
            onClick={() => setDrawerOpen(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "none",
            }}
            aria-label="Open menu"
          >
            <Image src="/images/landing/menu_icon.svg" alt="Menu" width={32} height={32} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 199,
          }}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "280px",
          backgroundColor: "#000000",
          zIndex: 200,
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          gap: "24px",
        }}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            color: "#FFFFFF",
            fontSize: "24px",
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="Close menu"
        >
          ✕
        </button>
        <button
          onClick={() => { setDrawerOpen(false); router.push("/login"); }}
          style={{
            backgroundColor: "#000000",
            border: "2px solid #FFFFFF",
            padding: "12px 24px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 400,
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
        <a
          href="/about#story"
          onClick={() => setDrawerOpen(false)}
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#FFFFFF",
            textDecoration: "none",
          }}
        >
          What is this?
        </a>
        <a
          href="/about#team"
          onClick={() => setDrawerOpen(false)}
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#FFFFFF",
            textDecoration: "none",
          }}
        >
          Who built this?
        </a>
      </div>

      {/* Page Content */}
      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "64px 24px 96px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Hero */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "48px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 16px 0",
            lineHeight: 1.2,
          }}
        >
          It started with five friends at Friendsgiving.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "18px",
            fontWeight: 300,
            color: "#808080",
            margin: "0 0 64px 0",
            lineHeight: 1.6,
          }}
        >
          One conversation changed everything.
        </p>

        {/* The Story */}
        <section id="story" style={{ marginBottom: "64px" }}>
          <h2
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "20px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 32px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            The Story
          </h2>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 24px 0",
              lineHeight: 1.8,
            }}
          >
            We were sitting around a table after Friendsgiving dinner, full of turkey and wine,
            when someone said: &ldquo;Remember when we used to write? Like, actually write?&rdquo;
          </p>

          {/* Photo placeholder */}
          <div
            style={{
              width: "100%",
              height: "240px",
              border: "2px dashed #E6E6E6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
              backgroundColor: "#FAFAFA",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#959595",
              }}
            >
              Photo coming soon
            </p>
          </div>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 24px 0",
              lineHeight: 1.8,
            }}
          >
            Not tweets. Not captions. Not emails about work. Real writing &mdash; the kind where you
            sit down and try to say something true. The kind that scares you a little because it
            means someone might actually see who you are.
          </p>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 24px 0",
              lineHeight: 1.8,
            }}
          >
            So we made a pact. Every month, someone picks a prompt. Everyone writes something.
            No one reads anything until everyone&apos;s done. Then we share, all at once, and talk
            about it.
          </p>

          {/* Photo placeholder */}
          <div
            style={{
              width: "100%",
              height: "240px",
              border: "2px dashed #E6E6E6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
              backgroundColor: "#FAFAFA",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#959595",
              }}
            >
              Photo coming soon
            </p>
          </div>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 24px 0",
              lineHeight: 1.8,
            }}
          >
            We called it a riff &mdash; because that&apos;s what it felt like. Someone drops a
            theme, and everyone riffs on it in their own way. No rules about length or format.
            Just write something honest.
          </p>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 0 0",
              lineHeight: 1.8,
            }}
          >
            It started as a Google Doc. Then a group chat. Then we realized: this should be its own
            thing. Something simple. Something private. Something that gets out of the way and lets
            friends write together.
          </p>
        </section>

        {/* Team */}
        <section id="team" style={{ marginBottom: "64px" }}>
          <h2
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "20px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 32px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Who Built This
          </h2>

          {/* Photo placeholder */}
          <div
            style={{
              width: "100%",
              height: "240px",
              border: "2px dashed #E6E6E6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
              backgroundColor: "#FAFAFA",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#959595",
              }}
            >
              Photo coming soon
            </p>
          </div>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 0 0",
              lineHeight: 1.8,
            }}
          >
            Just a group of friends who missed writing together. We built Riff because we wanted
            it to exist &mdash; and we think you might want it too.
          </p>
        </section>

        {/* Our Promise */}
        <section>
          <h2
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "20px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 32px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Our Promise
          </h2>

          <div
            style={{
              border: "2px solid #000000",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {[
              "Your data is yours. We will never sell it or use it for ads.",
              "You can export all your writing at any time.",
              "You can delete your account and all your data whenever you want.",
              "We built this for our friends, not for investors.",
            ].map((promise, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#00FF66",
                    lineHeight: 1.8,
                    flexShrink: 0,
                  }}
                >
                  &bull;
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: "#000000",
                    margin: 0,
                    lineHeight: 1.8,
                  }}
                >
                  {promise}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          .about-hidden-mobile { display: none !important; }
          .about-desktop-nav { display: none !important; }
          .about-mobile-nav { display: flex !important; }
        }
        @media (min-width: 768px) {
          .about-mobile-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
