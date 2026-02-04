import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = "cmkvm27ve000f24332fu6zmbb";

  // Check if the logged-in user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error("User not found! Make sure you have logged in at least once.");
    process.exit(1);
  }

  console.log("Found user:", user.email);

  // ---------------------------------------------------------------------------
  // 1. Create 4 dummy club members (in addition to the real user)
  // ---------------------------------------------------------------------------
  const dummyMembers = [
    { email: "alice@test.local", name: "Alice Chen", username: "alicechen", avatarUrl: null },
    { email: "bob@test.local", name: "Bob Rivera", username: "bobrivera", avatarUrl: null },
    { email: "carol@test.local", name: "Carol Kim", username: "carolkim", avatarUrl: null },
    { email: "dave@test.local", name: "Dave Okafor", username: "daveokafor", avatarUrl: null },
  ];

  const dummyUsers = [];
  for (const m of dummyMembers) {
    const existing = await prisma.user.findUnique({ where: { email: m.email } });
    if (existing) {
      dummyUsers.push(existing);
      console.log("  Found existing dummy user:", existing.email);
    } else {
      const created = await prisma.user.create({
        data: { ...m, onboardingCompleted: true },
      });
      dummyUsers.push(created);
      console.log("  Created dummy user:", created.email);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Create the club
  // ---------------------------------------------------------------------------
  const club = await prisma.club.create({
    data: {
      name: "The Sunday Writers",
      description:
        "A small group of friends who write together every week. No pressure, just words on a page.",
      bannerImage: null, // set to a URL if you want to test the banner
      adminId: userId,
      members: {
        create: [
          { userId: userId, role: "ADMIN" },
          { userId: dummyUsers[0].id, role: "MEMBER" },   // Alice
          { userId: dummyUsers[1].id, role: "MEMBER" },   // Bob
          { userId: dummyUsers[2].id, role: "MEMBER" },   // Carol
          { userId: dummyUsers[3].id, role: "MEMBER" },   // Dave
        ],
      },
    },
  });
  console.log("\nCreated club:", club.id, club.name);

  // ---------------------------------------------------------------------------
  // 3. ACTIVE riff — current riff the user has joined but not yet submitted
  //    Alice has submitted; Bob and Carol are waiting; Dave hasn't joined.
  //    This exercises: submitted avatars, waiting avatars, "Continue writing" button
  // ---------------------------------------------------------------------------
  const activeRiff = await prisma.riff.create({
    data: {
      clubId: club.id,
      creatorId: userId,
      title: "Write About a Place",
      prompt:
        "Describe a place that has changed you — not where you live now, but somewhere you carry with you. Lean into the sensory details.",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      status: "ACTIVE",
    },
  });
  console.log("Created active riff:", activeRiff.id, activeRiff.title);

  // Participants: you, Alice, Bob, Carol (not Dave)
  await prisma.riffParticipant.createMany({
    data: [
      { riffId: activeRiff.id, userId: userId },
      { riffId: activeRiff.id, userId: dummyUsers[0].id }, // Alice
      { riffId: activeRiff.id, userId: dummyUsers[1].id }, // Bob
      { riffId: activeRiff.id, userId: dummyUsers[2].id }, // Carol
    ],
  });

  // Alice's submitted piece for the active riff
  const alicePiece = await prisma.piece.create({
    data: {
      title: "The Train Station in Prague",
      authorId: dummyUsers[0].id,
      currentContent:
        '<p>I first arrived at Prague\'s main station on a grey Tuesday in March. The ceiling arches above you like the ribcage of some enormous creature, and the light that filters through the glass panels is the color of old honey.</p><p>I stood there for twenty minutes, not moving, just watching the pigeons.</p>',
      wordCount: 58,
    },
  });

  await prisma.pieceRiff.create({
    data: { pieceId: alicePiece.id, riffId: activeRiff.id },
  });
  console.log("  Alice submitted a piece to active riff");

  // ---------------------------------------------------------------------------
  // 4. COMPLETED riff #1 — "Childhood Memories"
  //    3 pieces submitted (exercises mosaic with 3 slivers, no images → placeholders)
  // ---------------------------------------------------------------------------
  const completedRiff1 = await prisma.riff.create({
    data: {
      clubId: club.id,
      creatorId: userId,
      title: "Childhood Memories",
      prompt: "Write about something you remember from before you were ten.",
      deadline: new Date("2026-01-15T23:59:59Z"),
      status: "COMPLETED",
    },
  });
  console.log("Created completed riff 1:", completedRiff1.id);

  // 3 pieces — plain text, no images → will use placeholder colors in mosaic
  const cr1Pieces = [
    {
      title: "The Red Bicycle",
      authorId: userId,
      currentContent:
        "<p>The summer I turned seven, my father brought home a red bicycle. It was too big for me — my feet barely grazed the pedals — but I rode it anyway, all the way down Maple Street and back, three times a day.</p>",
      wordCount: 42,
    },
    {
      title: "Saturday Mornings",
      authorId: dummyUsers[0].id, // Alice
      currentContent:
        "<p>Saturday mornings meant cartoons and toast with too much butter. My sister and I would camp on the living room floor with blankets, and the whole world outside could wait.</p>",
      wordCount: 36,
    },
    {
      title: "Grandma's Kitchen",
      authorId: dummyUsers[1].id, // Bob
      currentContent:
        "<p>The kitchen smelled like cardamom and something I still can't name. She never measured anything. She just knew — a pinch here, a handful there — and it always came out perfect.</p>",
      wordCount: 38,
    },
  ];

  for (const p of cr1Pieces) {
    const piece = await prisma.piece.create({ data: p });
    await prisma.pieceRiff.create({
      data: { pieceId: piece.id, riffId: completedRiff1.id },
    });
  }
  console.log("  Added 3 pieces to completed riff 1 (no images)");

  // ---------------------------------------------------------------------------
  // 5. COMPLETED riff #2 — "Objects We Keep"
  //    2 pieces, one with an embedded image tag → exercises mosaic image extraction
  // ---------------------------------------------------------------------------
  const completedRiff2 = await prisma.riff.create({
    data: {
      clubId: club.id,
      creatorId: userId,
      title: "Objects We Keep",
      prompt: "Pick an object you've carried for years. Why?",
      deadline: new Date("2025-12-20T23:59:59Z"),
      status: "COMPLETED",
    },
  });
  console.log("Created completed riff 2:", completedRiff2.id);

  const cr2Pieces = [
    {
      title: "The Compass",
      authorId: dummyUsers[2].id, // Carol
      currentContent:
        '<p>My grandfather\'s compass stopped working in 1998, but I still carry it.</p><img src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400" alt="compass"><p>It points nowhere now, but holding it makes me feel oriented.</p>',
      wordCount: 34,
    },
    {
      title: "A Letter I Never Sent",
      authorId: dummyUsers[3].id, // Dave
      currentContent:
        "<p>I wrote it when I was nineteen. Folded it into thirds and put it in the front pocket of my wallet, where it stayed for six years, the creases growing softer each time I opened my wallet to pay for something.</p>",
      wordCount: 42,
    },
  ];

  for (const p of cr2Pieces) {
    const piece = await prisma.piece.create({ data: p });
    await prisma.pieceRiff.create({
      data: { pieceId: piece.id, riffId: completedRiff2.id },
    });
  }
  console.log("  Added 2 pieces to completed riff 2 (one with image)");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n✅ Test data created successfully!");
  console.log("   Club:", club.name, `(${club.id})`);
  console.log("   → Navigate to: /clubs/" + club.id);
  console.log("");
  console.log("   States exercised:");
  console.log("   • Club frame: 5 members, description, stats (3 riffs, 6 pieces)");
  console.log("   • Active riff: you joined + submitted by Alice / waiting on Bob & Carol");
  console.log("   • Completed riff 1: 3 pieces, no images → placeholder mosaic");
  console.log("   • Completed riff 2: 2 pieces, one with embedded image → mixed mosaic");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
