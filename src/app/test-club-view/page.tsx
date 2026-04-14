/**
 * Static test page for ClubPageLayout.
 * No database or auth required — all data is hardcoded.
 * Exercises:
 *   • Club frame: 5 members, description, banner (null), stats
 *   • Active riff: current user joined, Alice submitted, Bob & Carol waiting
 *   • Completed riff 1: 3 pieces, no images → placeholder mosaic
 *   • Completed riff 2: 2 pieces, one with an embedded <img> → mixed mosaic
 *   • Admin = true (shows EmptyRiffState / CreateRiffModal path if no active riff)
 *
 * To test the "no active riff + admin" state, comment out `activeRiff` below.
 * To test the "not admin" state, set isAdmin to false.
 */

import ClubPageLayout from "@/components/clubs/ClubPageLayout";

// ---------------------------------------------------------------------------
// Fake users
// ---------------------------------------------------------------------------
const ME = { id: "user-me", name: "You", username: "youuser", avatarUrl: null };
const ALICE = {
  id: "user-alice",
  name: "Alice Chen",
  username: "alicechen",
  avatarUrl: null,
};
const BOB = {
  id: "user-bob",
  name: "Bob Rivera",
  username: "bobrivera",
  avatarUrl: null,
};
const CAROL = {
  id: "user-carol",
  name: "Carol Kim",
  username: "carolkim",
  avatarUrl: null,
};
const DAVE = {
  id: "user-dave",
  name: "Dave Okafor",
  username: "daveokafor",
  avatarUrl: null,
};

// ---------------------------------------------------------------------------
// Club
// ---------------------------------------------------------------------------
const club = {
  id: "club-test-1",
  name: "The Sunday Writers",
  description:
    "A small group of friends who write together every week. No pressure, just words on a page.",
  bannerImage: null as string | null,
  adminId: ME.id,
  members: [
    { user: ME },
    { user: ALICE },
    { user: BOB },
    { user: CAROL },
    { user: DAVE },
  ],
};

// ---------------------------------------------------------------------------
// Active riff — you joined, Alice submitted, Bob & Carol waiting, Dave didn't join
// ---------------------------------------------------------------------------
const activeRiff = {
  id: "riff-active-1",
  title: "Write About a Place",
  prompt:
    "Describe a place that has changed you — not where you live now, but somewhere you carry with you. Lean into the sensory details.",
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week out
  status: "ACTIVE",
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  creator: ME,
  participants: [{ user: ME }, { user: ALICE }, { user: BOB }, { user: CAROL }],
  pieces: [
    {
      submittedAt: new Date(),
      piece: {
        id: "piece-alice-active",
        title: "The Train Station in Prague",
        authorId: ALICE.id,
        currentContent:
          "<p>I first arrived at Prague's main station on a grey Tuesday in March. The ceiling arches above you like the ribcage of some enormous creature.</p>",
        wordCount: 58,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Completed riff 1 — 3 pieces, plain text only → placeholder mosaic colors
// ---------------------------------------------------------------------------
const completedRiff1 = {
  id: "riff-completed-1",
  title: "Childhood Memories",
  prompt: "Write about something you remember from before you were ten.",
  deadline: new Date("2026-01-15T23:59:59Z").toISOString(),
  status: "COMPLETED",
  createdAt: new Date("2025-12-01T10:00:00Z").toISOString(),
  creator: ME,
  participants: [{ user: ME }, { user: ALICE }, { user: BOB }],
  pieces: [
    {
      submittedAt: new Date(),
      piece: {
        id: "piece-me-cr1",
        title: "The Red Bicycle",
        authorId: ME.id,
        currentContent:
          "<p>The summer I turned seven, my father brought home a red bicycle. It was too big for me — my feet barely grazed the pedals — but I rode it anyway.</p>",
        wordCount: 42,
      },
    },
    {
      submittedAt: new Date(),
      piece: {
        id: "piece-alice-cr1",
        title: "Saturday Mornings",
        authorId: ALICE.id,
        currentContent:
          "<p>Saturday mornings meant cartoons and toast with too much butter. My sister and I would camp on the living room floor with blankets.</p>",
        wordCount: 36,
      },
    },
    {
      submittedAt: new Date(),
      piece: {
        id: "piece-bob-cr1",
        title: "Grandma's Kitchen",
        authorId: BOB.id,
        currentContent:
          "<p>The kitchen smelled like cardamom and something I still can't name. She never measured anything. She just knew.</p>",
        wordCount: 38,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Completed riff 2 — 2 pieces, one with an embedded <img> → mixed mosaic
// ---------------------------------------------------------------------------
const completedRiff2 = {
  id: "riff-completed-2",
  title: "Objects We Keep",
  prompt: "Pick an object you've carried for years. Why?",
  deadline: new Date("2025-12-20T23:59:59Z").toISOString(),
  status: "COMPLETED",
  createdAt: new Date("2025-11-10T10:00:00Z").toISOString(),
  creator: ME,
  participants: [{ user: CAROL }, { user: DAVE }],
  pieces: [
    {
      submittedAt: new Date(),
      piece: {
        id: "piece-carol-cr2",
        title: "The Compass",
        authorId: CAROL.id,
        currentContent:
          '<p>My grandfather\'s compass stopped working in 1998, but I still carry it.</p><img src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400" alt="compass"><p>It points nowhere now, but holding it makes me feel oriented.</p>',
        wordCount: 34,
      },
    },
    {
      submittedAt: new Date(),
      piece: {
        id: "piece-dave-cr2",
        title: "A Letter I Never Sent",
        authorId: DAVE.id,
        currentContent:
          "<p>I wrote it when I was nineteen. Folded it into thirds and put it in the front pocket of my wallet, where it stayed for six years.</p>",
        wordCount: 42,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Page — renders ClubPageLayout with all static data
// ---------------------------------------------------------------------------
export default function TestClubViewPage() {
  return (
    <ClubPageLayout
      club={club}
      userClubs={[
        { id: "club-test-1", name: "The Sunday Writers" },
        { id: "club-test-2", name: "Poetry & Prose" },
      ]}
      currentUserId={ME.id}
      isAdmin={true}
      activeRiff={activeRiff}
      revealedRiffs={[]}
      pastRevealedRiffs={[]}
      readCounts={{}}
      completedRiffs={[completedRiff1, completedRiff2]}
      stats={{ riffCount: 3, pieceCount: 6, wordCount: 250 }}
    />
  );
}
