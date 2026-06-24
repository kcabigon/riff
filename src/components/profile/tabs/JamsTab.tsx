"use client";

import { useState } from "react";

type JamType =
  | "spotify_album"
  | "spotify_track"
  | "spotify_playlist"
  | "youtube";

type MockJam = {
  id: string;
  type: JamType;
  title: string;
  artist?: string;
  thumbnailUrl: string | null;
  embedUrl: string;
  heading: string;
  timestamp: string;
  note: string;
};

const MOCK_JAMS: MockJam[] = [
  {
    id: "1",
    type: "spotify_album",
    title: "If Bangs Could Kill",
    artist: "Ella Langley",
    thumbnailUrl:
      "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e028606848da949bbaddf447d87",
    embedUrl:
      "https://open.spotify.com/embed/album/6nrtxtgaD9zSYBl9APvOCH?utm_source=generator",
    heading: "If Bangs Could Kill",
    timestamp: "today",
    note: "There's something about Ella Langley that feels like a window left open in summer — warm air carrying something you can't quite name. If Bangs Could Kill is the kind of record that makes you want to drive nowhere in particular, just to have a reason to keep it playing. She writes like she means every word, which in Nashville is rarer than it should be. The title track alone has lived rent-free in my head for weeks — equal parts sharp and tender, the way the best country always is.",
  },
  {
    id: "2",
    type: "spotify_album",
    title: "SABLE, fABLE",
    artist: "Bon Iver",
    thumbnailUrl:
      "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0230d93b9cce660d4f56770efb",
    embedUrl:
      "https://open.spotify.com/embed/album/3L3UjpXtom6T0Plt1j6l1T?utm_source=generator",
    heading: "On letting things take their time",
    timestamp: "2 days ago",
    note: "There's a particular kind of album that doesn't reveal itself all at once. SABLE, fABLE is one of them. I've been sitting with it for weeks, and every listen feels like discovering a room I hadn't noticed before. Justin Vernon has always built music that sounds like memory — not the clean, narrative kind, but the fragmentary, half-lit kind that arrives uninvited. What gets me about this one is the restraint. He could go bigger; he almost always has. Instead he pulls back, lets the silences do the heavy lifting.",
  },
  {
    id: "3",
    type: "spotify_track",
    title: "Starburster",
    artist: "Fontaines D.C.",
    thumbnailUrl:
      "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02f69e28716be1331924f25f2e",
    embedUrl:
      "https://open.spotify.com/embed/track/09ttHg3ZNVgDlYBZa1ZBw0?utm_source=generator",
    heading: "The escape velocity of a good song",
    timestamp: "5 days ago",
    note: "Some songs arrive like they've been running for a while before you hear them. Starburster is that. From the first thirty seconds you're already catching your breath. What I can't stop thinking about is how Grian Chatten delivers the lyrics — not like he wrote them down somewhere first, but like they're escaping him. The way the guitar pushes against the rhythm like it has somewhere to be. The bridge hits and you realize the song has been building toward something you didn't see coming.",
  },
  {
    id: "4",
    type: "youtube",
    title: "Sand In My Boots",
    artist: "Morgan Wallen & Ella Langley",
    thumbnailUrl: "https://i.ytimg.com/vi/i-WwYJI8mFE/hqdefault.jpg",
    embedUrl: "https://www.youtube.com/embed/i-WwYJI8mFE",
    heading: "Why live versions hit different",
    timestamp: "2 weeks ago",
    note: "I'm suspicious of live recordings because they so rarely capture what made the original worth hearing. This one is the exception. There's a version of this song I'd heard before and liked fine, and then I stumbled onto this SiriusXM session and it recalibrated everything. What Ella Langley does with the harmony in the chorus — the way she holds certain notes slightly longer than you expect — changes the emotional register of the whole song. It sounds like grief and relief at the same time.",
  },
];

const COVER_SIZE = 88;

function CoverPlaceholder({
  title,
  artist,
}: {
  title: string;
  artist?: string;
}) {
  const initials = (artist || title)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: COVER_SIZE,
        height: COVER_SIZE,
        flexShrink: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "20px",
          fontWeight: 400,
          color: "#00FF66",
        }}
      >
        {initials}
      </span>
    </div>
  );
}

export default function JamsTab() {
  const [selectedId, setSelectedId] = useState(MOCK_JAMS[0].id);
  const selected = MOCK_JAMS.find((j) => j.id === selectedId)!;

  const iframeHeight =
    selected.type === "spotify_track"
      ? "152px"
      : selected.type === "spotify_album"
        ? "352px"
        : selected.type === "spotify_playlist"
          ? "450px"
          : null;

  return (
    <div>
      {/* Horizontal covers strip */}
      <div
        style={{
          borderBottom: "1px solid #E6E6E6",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            gap: "8px",
            justifyContent: "center",
          }}
        >
          {MOCK_JAMS.map((jam) => {
            const isSelected = jam.id === selectedId;
            return (
              <button
                key={jam.id}
                onClick={() => setSelectedId(jam.id)}
                title={`${jam.title}${jam.artist ? ` · ${jam.artist}` : ""}`}
                style={{
                  padding: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: isSelected ? "4px 4px 0px 0px #00FF66" : "none",
                  transition: "box-shadow 150ms ease",
                }}
              >
                {jam.thumbnailUrl ? (
                  <img
                    src={jam.thumbnailUrl}
                    alt={jam.title}
                    style={{
                      width: COVER_SIZE,
                      height: COVER_SIZE,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <CoverPlaceholder title={jam.title} artist={jam.artist} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Jam content */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        <div style={{ maxWidth: "720px" }}>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "32px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 6px",
              lineHeight: 1.2,
            }}
          >
            {selected.heading}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              margin: "0 0 20px",
            }}
          >
            {selected.timestamp}
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 28px",
              lineHeight: 1.6,
            }}
          >
            {selected.note}
          </p>

          {selected.type === "youtube" ? (
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
              }}
            >
              <iframe
                src={selected.embedUrl}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <iframe
              src={selected.embedUrl}
              width="100%"
              height={iframeHeight!}
              style={{ border: "none", display: "block" }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
