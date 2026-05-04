import Image from "next/image";
import Link from "next/link";

const FOUNDERS = [
  {
    name: "Jarric",
    avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
  },
  {
    name: "Chris",
    avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
  },
  { name: "Kyle", avatarSrc: "/images/about/founderAvatars/kyle-avatar.jpg" },
  { name: "Derek", avatarSrc: "/images/about/founderAvatars/derek-avatar.png" },
  { name: "Kyla", avatarSrc: "/images/about/founderAvatars/kyla-avatar.jpg" },
];

function FounderAvatars() {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {FOUNDERS.map((f, i) => (
        <Image
          key={f.name}
          src={f.avatarSrc}
          alt={f.name}
          width={32}
          height={32}
          title={f.name}
          style={{
            borderRadius: "50%",
            border: "2px solid #FFFFFF",
            objectFit: "cover",
            flexShrink: 0,
            marginLeft: i === 0 ? 0 : "-8px",
            zIndex: FOUNDERS.length - i,
            position: "relative",
          }}
        />
      ))}
    </div>
  );
}

const bodyStyle: React.CSSProperties = {
  fontFamily: "var(--font-playfair), serif",
  fontSize: "18px",
  lineHeight: "normal",
  color: "#000000",
  margin: "0 0 1em 0",
};

export default function FoundersNotePage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Minimal header — matches public piece page */}
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

      {/* Content */}
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "48px 24px 96px",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "clamp(32px, 5vw, 40px)",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 24px 0",
            lineHeight: 1.2,
          }}
        >
          Why we are building Riff
        </h1>

        {/* Author + metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
            paddingBottom: "24px",
            borderBottom: "1px solid #E6E6E6",
          }}
        >
          <FounderAvatars />
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                margin: "0 0 2px 0",
              }}
            >
              Jarric, Chris, Kyle, Derek, and Kyla
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
              }}
            >
              May 2026 · 2 min read
            </p>
          </div>
        </div>

        {/* Body */}
        <p style={bodyStyle}>
          Riff is a club-driven writing platform for friends. Why clubs? Because
          your friends are a good time, and clubs are the social infrastructure
          to keep the good times spinning (like a record, baby, right round). If
          you want to tell more stories and be creative with your friends, you
          should start a write club.
        </p>

        <p style={bodyStyle}>
          We accidentally started a write club after our Friendsgiving in 2024.
          The 5 of us enjoy writing and being creative, but never felt like
          public blogging or email newsletters was our jam. So we started
          writing stories and essays in Google Docs, picked a due date, and
          shared the docs on that date. Other friends found out what we were
          doing and wanted in. We&apos;re onto something.
        </p>

        {/* GIF */}
        <div style={{ margin: "0 0 1em 0" }}>
          <img
            src="/images/about/friendsgiving2025.gif"
            alt="Friendsgiving 2025"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        <p style={bodyStyle}>
          Our write club has exchanged over 60 pieces and nearly 100,000 words,
          and we&apos;re still going strong. The original 5 of us are now
          building Riff. This is a side project, a passion project, a
          scratch-your-own-itch project. There is a part of us that thinks this
          could never catch on — why start a club and write essays when you
          could just text the group chat? Why not try and get your writing
          published on Medium or monetized on Substack?
        </p>

        <p style={bodyStyle}>
          But there&apos;s a part of us that thinks maybe there are people and
          friend groups out there like us. Who just want to write with their
          friends because it&apos;s private and creative and fun. Who think that
          a writing experience that feels more like starting a garage band,
          storytelling around the campfire, a kickback at the homie&apos;s
          place, a literary mosh pit with friends is their jam. This is for you.
        </p>

        {/* CTA */}
        <Link
          href="/login"
          style={{
            display: "inline-block",
            fontFamily: "var(--font-playfair), serif",
            fontSize: "18px",
            color: "#000000",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            margin: "1em 0 0 0",
          }}
        >
          Let&apos;s riff!
        </Link>
      </div>
    </div>
  );
}
