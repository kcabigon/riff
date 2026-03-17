"use client";

import NoiseBackground from "@/components/NoiseBackground";
import LandingNavBar from "@/components/LandingNavBar";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", position: "relative" }}>
      <NoiseBackground fillMode="cover" />

      <LandingNavBar sticky />

      {/* Page Content */}
      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "64px 24px 96px",
          position: "relative",
          zIndex: 1,
          backgroundColor: "rgba(255, 255, 255, 1)",
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
            It started with a few good friends I can count on one of my hands. We were at our annual Friendsgiving, 
            riffing on ideas like we always do. My friends and I got on this tangent of wanting to create more and 
            consume less. The conversation ended in left field, like the best ones tend to do, the five of us agreeing 
            to exchange some long-form writing despite none of us being “writers.”
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
    </div>
  );
}
