"use client";

import NoiseBackground from "@/components/NoiseBackground";
import LandingNavBar from "@/components/LandingNavBar";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", position: "relative" }}>
      <NoiseBackground fillMode="cover" style={{ position: "fixed" }} />

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
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "48px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 12px 0",
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          It started with a few good friends...
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: "0 0 64px 0",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Jarric, Riff co-founder
        </p>

        {/* The Story */}
        <section id="story" style={{ marginBottom: "64px" }}>
          <p style={bodyStyle}>
            It started with a few good friends I can count on one of my hands. We were at our
            annual Friendsgiving, riffing on ideas like we always do. My friends and I got on
            this tangent of wanting to create more and consume less. The conversation ended in
            left field, like the best ones tend to do, the five of us agreeing to exchange some
            long-form writing despite none of us being &ldquo;writers.&rdquo;
          </p>

          {/* Photo: the Friendsgiving crew */}
          <div
            style={{
              width: "100%",
              marginBottom: "24px",
              overflow: "hidden",
            }}
          >
            <img
              src="/images/about/friendsgiving2023.jpg"
              alt="The Friendsgiving crew"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </div>

          <p style={bodyStyle}>
            Two weeks later, I&apos;m sipping my morning coffee and opened my email to find
            &ldquo;Sex Whoop.&rdquo; Over the next 10 minutes I laughed my ass off to a
            parody-piece on performance optimization while learning way more about my
            friend&apos;s actual bedroom analytics than I ever needed to know.
          </p>

          <p style={bodyStyle}>
            The next email read, &ldquo;Our Family Heritage - why I wrote a children&apos;s book
            to teach my daughter about her name.&rdquo; Heartwarming, surprising, and suddenly
            I&apos;m questioning if I&apos;ve been a terrible friend for not already knowing many
            of these things about one of my closest friends.
          </p>

          <p style={bodyStyle}>
            Then I got a text message. &ldquo;I just read your Baseball Love Letter, the part
            about your dad made me cry, it was beautiful.&rdquo;
          </p>

          <p style={bodyStyle}>
            Over the next few days and weeks, our group chat and conversations were electric. We
            talked about the writing, our favorite passages and what we discovered about each
            other. We talked about our creative process, it was like the dormant creative was
            awakened in all of us.
          </p>

          {/* Photo: group chat energy / writing together */}
          <div style={{ width: "100%", marginBottom: "24px", overflow: "hidden" }}>
            <img
              src="/images/about/chrisjarric.jpg"
              alt="Chris and Jarric"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          <p style={bodyStyle}>
            We kept writing. It was loose, we made it up on the fly. We shared passions and
            desires and anything on our minds. Reading Kerouac lines and listening to Zach Bryan
            songs was no longer just entertainment, it was inspiration. We were the mad ones,
            imaginations on fire, burn burn burning with more creativity, more storytelling, more
            vulnerability. At least that&apos;s what it felt like.
          </p>

          <p style={bodyStyle}>
            Slowly, word spread to some of our other friends. It would come up organically, and
            to our surprise, many of them were stoked on the whole idea. &ldquo;I&apos;ve been
            looking for a new creative outlet&rdquo; and &ldquo;I&apos;ve actually been writing a
            lot in my journal lately&rdquo; were common confessions. Turns out the initial 5 of
            us weren&apos;t weirdos after all, other friends actually wanted to crash the party.
          </p>

          <p style={bodyStyle}>
            &ldquo;Welcome to Write Club, the first rule of Write Club is&hellip;&rdquo; I would
            joke with new friends as they joined the crew. As we grew the group it only burned
            brighter, more voices, more diverse ideas led to more inspiration and more fun. We
            accidentally formed our own little creative collective, nine friends just
            groovin&apos; with words, like playin&apos; jazz baby!
          </p>

          {/* Photo: the expanded crew */}
          <div style={{ width: "100%", marginBottom: "24px", overflow: "hidden" }}>
            <img
              src="/images/about/communetrip2022.jpg"
              alt="Commune trip 2022"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          <p style={bodyStyle}>
            This wasn&apos;t writing like any of us had experienced before, it was actually fun.
            It was deep, it was raw, it was real. The writing felt more like riffing, and my
            friends and I love to riff. Friends everywhere love to riff. They gather in
            circles&ndash;around campfires, dinner tables, living rooms, and
            backyards&ndash;and have flowing conversations that include stories, witty banter,
            inside jokes and ideas that build off one another.
          </p>

          <p style={bodyStyle}>
            These riffing experiences deepen friendships, but that&apos;s not why we do it. We
            riff because it&apos;s human, and it&apos;s a damn good time. If only these verbal
            jam sessions weren&apos;t so rare. With growing families, busy schedules, and friends
            moving away, it becomes harder and harder to pull the crew together as we get older.
          </p>

          <p style={bodyStyle}>
            Riffing with friends feels intrinsically tied to in-person interactions, but through
            the medium of writing we discovered a way to capture the riffing experience
            asynchronously and on-demand. By moving the riff online, we were no longer
            constrained by busy schedules and geography, the riff could go on endlessly. Riffs
            could bounce from live conversations to long-form writing to the group chat and back
            to the blank page again.
          </p>

          {/* Photo: in-person hangout */}
          <div style={{ width: "100%", marginBottom: "24px", overflow: "hidden" }}>
            <img
              src="/images/about/friendsgiving2025.gif"
              alt="Friendsgiving 2025"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          <p style={bodyStyle}>
            Digital riffing felt similar to in-person riffing&ndash;the dynamic exchange of
            ideas, the humor and witty replies. But it was also very different, in some ways
            better. Crafted creativity versus spontaneous creativity. There was a level of
            emotional depth and thoughtful articulation not present in most live riffs. There were
            tangible and ever-lasting artifacts to riff on, versus the ephemeral nature of live
            conversations. In a world where in-person hangs are trending down and text messages
            are the go-to form of communication, this felt revolutionary.
          </p>

          <p style={bodyStyle}>
            The great irony of modern digital communication is that it allows us to be more
            connected than ever, yet we don&apos;t feel more connected at all. There is a feeling
            of proximity when we see our friends in our social feeds and know they are only a text
            away, yet there is a growing void with how friends meaningfully connect in the digital
            age.
          </p>

          <p style={bodyStyle}>
            In a world growing ever so lonely, my friends and I feel like we struck gold with our
            writing circle. We gave ourselves a platform for creative expression, a window into
            each other&apos;s minds, an excuse to get deep and be weird. This left field idea
            turned out to be a cheat code for being more creative and feeling more deeply
            connected.
          </p>

          <p style={bodyStyle}>
            Why don&apos;t more people write with their friends?
          </p>

          <p style={bodyStyle}>
            I think they should.
          </p>

          <p style={{ ...bodyStyle, margin: "0 0 0 0" }}>
            I have no clue if other people would be down to do this, but I imagine a world where
            they do. A world filled with more creativity, more storytelling, more vulnerability. A
            world less shallow and alone. A world where people feel more deeply connected to a few
            good friends they could count on one of their hands.
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

const bodyStyle = {
  fontFamily: "var(--font-playfair)",
  fontSize: "16px",
  fontWeight: 400 as const,
  color: "#000000",
  margin: "0 0 24px 0",
  lineHeight: 1.8,
};

function PhotoPlaceholder({ caption }: { caption: string }) {
  return (
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
        {caption}
      </p>
    </div>
  );
}
