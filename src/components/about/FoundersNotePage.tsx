"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import FakeCommentHighlight from "./FakeCommentHighlight";
import AboutCommentSidebar, { SidebarComment } from "./AboutCommentSidebar";
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

const COMMENTS: SidebarComment[] = [
  {
    id: "highlight-1",
    author: "Jarric",
    avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
    text: "i had a blog once",
    replies: [
      {
        author: "Derek",
        avatarSrc: "/images/about/founderAvatars/derek-avatar.png",
        text: "that only your mom read",
      },
    ],
  },
  {
    id: "highlight-2",
    author: "Chris",
    avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
    text: "create more, consume less",
    replies: [
      {
        author: "Jarric",
        avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
        text: "aka, chris needs to spend less time doomscrolling butts on instagram",
      },
    ],
  },
  {
    id: "highlight-3",
    author: "Jarric",
    avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
    text: "except derek",
    replies: [
      {
        author: "Derek",
        avatarSrc: "/images/about/founderAvatars/derek-avatar.png",
        text: "sorry, i can't help it if my best ideas come the night before the deadline",
      },
    ],
  },
  {
    id: "highlight-4",
    author: "Kyla",
    avatarSrc: "/images/about/founderAvatars/kyla-avatar.jpg",
    text: "i cried",
    replies: [
      {
        author: "Derek",
        avatarSrc: "/images/about/founderAvatars/derek-avatar.png",
        text: "really?",
      },
      {
        author: "Chris",
        avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
        text: "get in touch with your emotions derek",
      },
    ],
  },
  {
    id: "highlight-5",
    author: "Kyle",
    avatarSrc: "/images/about/founderAvatars/kyle-avatar.jpg",
    text: "sex whoop was not a parody",
    replies: [
      {
        author: "Chris",
        avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
        text: "either way, it was tmi",
      },
    ],
  },
  {
    id: "highlight-6",
    author: "Kyle",
    avatarSrc: "/images/about/founderAvatars/kyle-avatar.jpg",
    text: "i hate writing",
    replies: [
      {
        author: "Chris",
        avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
        text: "what do you like?",
      },
      {
        author: "Kyle",
        avatarSrc: "/images/about/founderAvatars/kyle-avatar.jpg",
        text: "i like lamps",
      },
    ],
  },
  {
    id: "highlight-7",
    author: "Derek",
    avatarSrc: "/images/about/founderAvatars/derek-avatar.png",
    text: "had no idea jarric was a Swiftie",
    replies: [
      {
        author: "Chris",
        avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
        text: "had no idea jarric was gay",
      },
    ],
  },
  {
    id: "highlight-8",
    author: "Kyla",
    avatarSrc: "/images/about/founderAvatars/kyla-avatar.jpg",
    text: "literary mosh pit with friends",
  },
  {
    id: "highlight-9",
    author: "Jarric",
    avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
    text: "write clubs are the new book clubs",
  },
  {
    id: "highlight-10",
    author: "Jarric",
    avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
    text: "friends should have more clubs",
    replies: [
      {
        author: "Kyla",
        avatarSrc: "/images/about/founderAvatars/kyla-avatar.jpg",
        text: "spicy margarita vinyl music club?",
      },
      {
        author: "Chris",
        avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
        text: "down",
      },
    ],
  },
  {
    id: "highlight-11",
    author: "Kyle",
    avatarSrc: "/images/about/founderAvatars/kyle-avatar.jpg",
    text: "jarric thinks this is his life mission",
  },
  {
    id: "highlight-12",
    author: "Jarric",
    avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
    text: "since we're the only write club that we know",
  },
  {
    id: "highlight-13",
    author: "Chris",
    avatarSrc: "/images/about/founderAvatars/chris-avatar.jpeg",
    text: "we can't be the only dorks out there who think this is cool?",
    replies: [
      {
        author: "Jarric",
        avatarSrc: "/images/about/founderAvatars/jarric-avatar.png",
        text: "i hear crickets",
      },
    ],
  },
];

function commentFor(id: string) {
  const c = COMMENTS.find((entry) => entry.id === id);
  return c ? [c] : [];
}

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
            border: "1px solid #000000",
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
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  function handleActivate(id: string) {
    setActiveCommentId((prev) => (prev === id ? null : id));
  }

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
          maxWidth: isMobile || COMMENTS.length === 0 ? "680px" : "1040px",
          margin: "0 auto",
          padding: "48px 24px 96px",
          display: "flex",
          gap: "40px",
          alignItems: "flex-start",
        }}
      >
        {/* Essay column */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
            For Friends, By Friends
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
                July 2026 · 2 min read
              </p>
            </div>
          </div>

          {/* Body */}
          <p style={bodyStyle}>
            We built a writing platform but not for writers.
          </p>

          <p style={bodyStyle}>
            The five of us are not writers in the{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-1")}
              commentId="highlight-1"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-1"}
            >
              have a blog
            </FakeCommentHighlight>
            , grow an audience, make money from our writing sense. We&apos;re
            just five friends with shared{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-2")}
              commentId="highlight-2"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-2"}
            >
              desires to be creative
            </FakeCommentHighlight>{" "}
            and maybe get a few laughs out of each other. We had this crazy
            idea, what if the five of us wrote something and just shared them
            with each other? Two weeks later, we shared five personal essays{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-3")}
              commentId="highlight-3"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-3"}
            >
              all at the same time
            </FakeCommentHighlight>
            : a{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-4")}
              commentId="highlight-4"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-4"}
            >
              baseball love letter
            </FakeCommentHighlight>
            , a children&apos;s book on a family heritage, a political rabbit
            hole, a letter to self, and a hilarious{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-5")}
              commentId="highlight-5"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-5"}
            >
              parody on bedroom analytics
            </FakeCommentHighlight>
            .
          </p>

          <p style={bodyStyle}>
            We were instantly hooked on writing with friends because it
            wasn&apos;t just{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-6")}
              commentId="highlight-6"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-6"}
            >
              about the writing
            </FakeCommentHighlight>
            . It was about the conversations sparked by the writing, the stories
            and perspectives that never came up in the routine of our
            relationships, and the{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-7")}
              commentId="highlight-7"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-7"}
            >
              deeper discovery of people we thought we already knew so well
            </FakeCommentHighlight>
            . &ldquo;Welcome to{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-8")}
              commentId="highlight-8"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-8"}
            >
              Write Club
            </FakeCommentHighlight>
            ,&rdquo; we said when other friends wanted to join in.{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-9")}
              commentId="highlight-9"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-9"}
            >
              Like a book club but for writing
            </FakeCommentHighlight>{" "}
            — the writing a{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-10")}
              commentId="highlight-10"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-10"}
            >
              reason to gather
            </FakeCommentHighlight>{" "}
            and a way to riff with friends.
          </p>

          <p style={bodyStyle}>
            <strong>
              <em>Riff</em>
            </strong>{" "}
            is not for writers but for friends. Built by friends, a{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-11")}
              commentId="highlight-11"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-11"}
            >
              passion project
            </FakeCommentHighlight>{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-12")}
              commentId="highlight-12"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-12"}
            >
              for ourselves
            </FakeCommentHighlight>
            . And if writing, storytelling, and riffing with your friends sounds
            like your thing, it&apos;s free and{" "}
            <FakeCommentHighlight
              comments={commentFor("highlight-13")}
              commentId="highlight-13"
              onActivate={handleActivate}
              isActive={activeCommentId === "highlight-13"}
            >
              it&apos;s for you
            </FakeCommentHighlight>
            .
          </p>

          {/* GIF */}
          <div style={{ margin: "1em 0" }}>
            <img
              src="/images/about/friendsgiving2025.gif"
              alt="Friendsgiving 2025"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          {/* CTA */}
          <Link
            href="/auth/post-login"
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

        {/* Sidebar — desktop only, hidden when no comments */}
        {!isMobile && COMMENTS.length > 0 && (
          <AboutCommentSidebar
            comments={COMMENTS}
            activeId={activeCommentId}
            onCardClick={handleActivate}
          />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #E6E6E6",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          Say hi. Product feedback. Rad ideas. Talk shit.{" "}
          <a
            href="mailto:jarric22@gmail.com"
            style={{ color: "#808080", textDecoration: "underline" }}
          >
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
