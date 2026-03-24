"use client";

import NoiseBackground from "@/components/NoiseBackground";
import LandingNavBar from "@/components/LandingNavBar";

const FILTERS = {
  yellow: "none",
  orange: "brightness(0) saturate(100%) invert(57%) sepia(87%) saturate(2645%) hue-rotate(339deg) brightness(101%) contrast(101%)",
  pink:   "brightness(0) saturate(100%) invert(18%) sepia(82%) saturate(3721%) hue-rotate(307deg) brightness(95%) contrast(98%)",
  cyan:   "brightness(0) saturate(100%) invert(79%) sepia(91%) saturate(2670%) hue-rotate(137deg) brightness(103%) contrast(101%)",
};

function Highlight({ children, filter = FILTERS.yellow }: { children: string; filter?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <img
        src="/images/tagline_vector.svg"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "2px",
          left: "-4px",
          width: "calc(100% + 8px)",
          height: "22px",
          zIndex: 0,
          filter,
        }}
      />
      <strong style={{ position: "relative", zIndex: 1, fontWeight: 700 }}>{children}</strong>
    </span>
  );
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", position: "relative" }}>
      <NoiseBackground fillMode="cover" style={{ position: "fixed" }} />

      <LandingNavBar sticky />

      <main
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "64px 24px 96px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "80px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 24px 0",
            lineHeight: 1.15,
            textAlign: "center",
          }}
        >
          <span style={{ position: "relative", display: "inline-block" }}>
            <img
              src="/images/tagline_vector.svg"
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: "6px",
                left: "-6px",
                width: "calc(100% + 12px)",
                height: "28px",
                zIndex: 0,
                filter: FILTERS.cyan,
              }}
            />
            <strong style={{ fontWeight: 700, position: "relative", zIndex: 1 }}>
              Write clubs
            </strong>
          </span>

          {" are the new"}
          <br />
          {"book clubs"}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "28px",
            fontWeight: 300,
            color: "#000000",
            margin: "0 0 48px 0",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Clubs give a{" "}
          <Highlight>rhythm</Highlight>
          {" to a friend group."}
          <br />
          <Highlight filter={FILTERS.orange}>Writing</Highlight>
          {" on a rhythm with friends is "}
          <Highlight filter={FILTERS.pink}>riffing</Highlight>
          {"."}
        </p>

        {/* GIF */}
        <div
          style={{
            width: "100%",
            marginBottom: "64px",
            overflow: "hidden",
          }}
        >
          <img
            src="/images/about/friendsgiving2025.gif"
            alt="Friendsgiving 2025"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        {/* Riff tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            marginBottom: "64px",
          }}
        >
          <div style={{ width: "160px", height: "104px" }}>
            <img
              src="/images/riff_wordmark_black_outline.svg"
              alt="Riff"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "28px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Riff is the digital home for write clubs. Designed for friends, by friends.
          </p>
        </div>

        {/* Our Promise */}
        <section>
          <div
            style={{
              border: "2px solid #000000",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              backgroundColor: "#FFFFFF",
            }}
          >
            {[
              "Your data is yours. We will never sell it or use it for ads.",
              "You can export all your writing at any time.",
              "You can delete your account and all your data whenever you want.",
            ].map((promise, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
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
    </div>
  );
}

