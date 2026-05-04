"use client";

import Image from "next/image";
import Link from "next/link";
import FakeCommentHighlight from "./FakeCommentHighlight";
import { useIsMobile } from "@/hooks/useMediaQuery";

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
  const isMobile = useIsMobile();

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
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? "8px" : "12px",
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
          doing stuff with friends is good times, and clubs are the social
          infrastructure to keep the good times spinning (like a record, baby,
          right round). If you want to tell more stories and be creative with
          your friends, you should start a write club.
        </p>

        <p style={bodyStyle}>
          We{" "}
          <FakeCommentHighlight
            comments={[
              {
                author: "Chris",
                avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
                text: "I blame it on Kyla",
                replies: [
                  {
                    author: "Kyla",
                    avatarSrc: "/images/about/founderAvatars/kyla-avatar.jpg",
                    text: '"i\'ve been wanting to create more and consume less" - Chris',
                  },
                  {
                    author: "Kyle",
                    avatarSrc: "/images/about/founderAvatars/kyle-avatar.jpg",
                    text: "haha",
                  },
                ],
              },
            ]}
          >
            accidentally
          </FakeCommentHighlight>{" "}
          started a write club after our Friendsgiving in 2024. The 5 of us
          enjoy writing and being creative, but never felt like{" "}
          <FakeCommentHighlight
            comments={[
              {
                author: "Derek",
                avatarSrc: "/images/about/founderAvatars/derek-avatar.png",
                text: "only jarric's mom reads his blog",
              },
            ]}
          >
            public blogging
          </FakeCommentHighlight>{" "}
          or email newsletters was our jam. So we started writing stories and
          essays in Google Docs, picked a due date, and shared the docs{" "}
          <FakeCommentHighlight
            comments={[
              {
                author: "Jarric",
                avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
                text: "Well, except for Derek who always waits until the night before to start his piece and always sends it late",
                replies: [
                  {
                    author: "Derek",
                    avatarSrc: "/images/about/founderAvatars/derek-avatar.png",
                    text: "only cuz i know it annoys you",
                  },
                ],
              },
            ]}
          >
            on that date
          </FakeCommentHighlight>
          . Other friends found out what we were doing and wanted in.{" "}
          <FakeCommentHighlight
            comments={[
              {
                author: "Chris",
                avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
                embed: {
                  type: "youtube",
                  videoId: "ZJdHNwUgsPI",
                  url: "https://www.youtube.com/watch?v=ZJdHNwUgsPI&list=RDZJdHNwUgsPI&start_radio=1",
                },
              },
            ]}
          >
            We&apos;re onto something.
          </FakeCommentHighlight>
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
          building Riff. This is a{" "}
          <FakeCommentHighlight
            comments={[
              {
                author: "Kyle",
                avatarSrc: "/images/about/founderAvatars/kyle-avatar.jpg",
                text: "except Jarric thinks this is his life mission",
                replies: [
                  {
                    author: "Kyla",
                    avatarSrc: "/images/about/founderAvatars/kyla-avatar.jpg",
                    text: "haha",
                  },
                ],
              },
            ]}
          >
            side project
          </FakeCommentHighlight>
          , a passion project, a scratch-your-own-itch project. There is a part
          of us that thinks this could never catch on — why start a club and
          write essays when you could just text the group chat? Why not try and
          get your writing published on Medium or monetized on Substack?
        </p>

        <p style={bodyStyle}>
          But there&apos;s a part of us that thinks maybe there are people and
          friend groups out there like us. Who just want to write with their
          friends because it&apos;s{" "}
          <FakeCommentHighlight
            comments={[
              {
                author: "Chris",
                avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
                embed: {
                  type: "youtube",
                  videoId: "sDwcHUeG6Nc",
                  url: "https://www.youtube.com/watch?v=sDwcHUeG6Nc",
                },
              },
            ]}
          >
            private
          </FakeCommentHighlight>{" "}
          and creative and fun. Who think that a writing experience that feels
          more like starting a garage band, storytelling around the campfire, a{" "}
          <FakeCommentHighlight
            comments={[
              {
                author: "Derek",
                avatarSrc: "/images/about/founderAvatars/derek-avatar.png",
                text: "whos bringing the 40s?",
              },
            ]}
          >
            kickback
          </FakeCommentHighlight>{" "}
          at the homie&apos;s place, a{" "}
          <FakeCommentHighlight
            comments={[
              {
                author: "Kyla",
                avatarSrc: "/images/about/founderAvatars/kyla-avatar.jpg",
                text: "🤘🤘",
              },
            ]}
          >
            literary mosh pit
          </FakeCommentHighlight>{" "}
          with friends is their jam. This is for you.
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
