import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * E2E seed script — creates users at different onboarding stages,
 * a club with riffs, and pieces so every flow can be tested locally.
 *
 * Idempotent: checks for existing users by email before creating.
 * Re-runnable: deletes clubs named "The Sunday Writers" first.
 *
 * Run with: npm run db:seed:dev
 */

interface SeedUser {
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  username: string | null;
  onboardingStep: "NAME" | "CLUB_CHOICE" | "INVITE" | "COMPLETED" | null;
  onboardingCompleted: boolean;
}

const SEED_USERS: SeedUser[] = [
  {
    email: "fresh@test.local",
    firstName: null,
    lastName: null,
    name: null,
    username: null,
    onboardingStep: "NAME",
    onboardingCompleted: false,
  },
  {
    email: "midway@test.local",
    firstName: "Midway",
    lastName: "Tester",
    name: "Midway Tester",
    username: "midwaytester",
    onboardingStep: "CLUB_CHOICE",
    onboardingCompleted: false,
  },
  {
    email: "writer@test.local",
    firstName: "Writer",
    lastName: "McPen",
    name: "Writer McPen",
    username: "writermcpen",
    onboardingStep: "COMPLETED",
    onboardingCompleted: true,
  },
  {
    email: "alice@test.local",
    firstName: "Alice",
    lastName: "Chen",
    name: "Alice Chen",
    username: "alicechen",
    onboardingStep: "COMPLETED",
    onboardingCompleted: true,
  },
  {
    email: "bob@test.local",
    firstName: "Bob",
    lastName: "Rivera",
    name: "Bob Rivera",
    username: "bobrivera",
    onboardingStep: "COMPLETED",
    onboardingCompleted: true,
  },
  {
    email: "carol@test.local",
    firstName: "Carol",
    lastName: "Kim",
    name: "Carol Kim",
    username: "carolkim",
    onboardingStep: "COMPLETED",
    onboardingCompleted: true,
  },
];

async function main() {
  console.log("=== E2E Seed Script ===\n");

  // -------------------------------------------------------------------------
  // 0. Cleanup previous seed data
  // -------------------------------------------------------------------------
  console.log("Cleaning up previous seed data...");

  // Delete clubs named "The Sunday Writers" (cascades to riffs, participants, pieces via relations)
  const oldClubs = await prisma.club.findMany({
    where: { name: "The Sunday Writers" },
    select: { id: true },
  });

  for (const club of oldClubs) {
    // Delete riff-related data first (foreign key constraints)
    const riffs = await prisma.riff.findMany({
      where: { clubId: club.id },
      select: { id: true },
    });
    const riffIds = riffs.map((r) => r.id);

    if (riffIds.length > 0) {
      // Delete pieceRiff entries for these riffs
      await prisma.pieceRiff.deleteMany({
        where: { riffId: { in: riffIds } },
      });
      // Delete riff participants
      await prisma.riffParticipant.deleteMany({
        where: { riffId: { in: riffIds } },
      });
      // Delete riffs
      await prisma.riff.deleteMany({
        where: { id: { in: riffIds } },
      });
    }

    // Delete club members
    await prisma.clubMember.deleteMany({
      where: { clubId: club.id },
    });

    // Delete the club
    await prisma.club.delete({ where: { id: club.id } });
  }

  if (oldClubs.length > 0) {
    console.log(`  Deleted ${oldClubs.length} old "The Sunday Writers" club(s)`);
  }

  // Delete pieces authored by test users
  const testEmails = SEED_USERS.map((u) => u.email);
  const existingTestUsers = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    select: { id: true },
  });
  const testUserIds = existingTestUsers.map((u) => u.id);

  if (testUserIds.length > 0) {
    // Delete pieceRiff entries for pieces by test users
    const testPieces = await prisma.piece.findMany({
      where: { authorId: { in: testUserIds } },
      select: { id: true },
    });
    const testPieceIds = testPieces.map((p) => p.id);

    if (testPieceIds.length > 0) {
      await prisma.pieceRiff.deleteMany({
        where: { pieceId: { in: testPieceIds } },
      });
      await prisma.piece.deleteMany({
        where: { id: { in: testPieceIds } },
      });
    }
  }

  console.log("  Cleanup complete.\n");

  // -------------------------------------------------------------------------
  // 1. Create or update users
  // -------------------------------------------------------------------------
  console.log("Creating users...");
  const users: Record<string, { id: string; email: string }> = {};

  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
    });

    if (existing) {
      // Update to match expected state
      const updated = await prisma.user.update({
        where: { email: u.email },
        data: {
          firstName: u.firstName,
          lastName: u.lastName,
          name: u.name,
          username: u.username,
          onboardingStep: u.onboardingStep,
          onboardingCompleted: u.onboardingCompleted,
        },
      });
      users[u.email] = { id: updated.id, email: updated.email };
      console.log(`  Updated: ${u.email}`);
    } else {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          name: u.name,
          username: u.username,
          onboardingStep: u.onboardingStep,
          onboardingCompleted: u.onboardingCompleted,
        },
      });
      users[u.email] = { id: created.id, email: created.email };
      console.log(`  Created: ${u.email}`);
    }
  }

  const writer = users["writer@test.local"];
  const alice = users["alice@test.local"];
  const bob = users["bob@test.local"];
  const carol = users["carol@test.local"];

  // -------------------------------------------------------------------------
  // 2. Create club
  // -------------------------------------------------------------------------
  console.log("\nCreating club...");
  const club = await prisma.club.create({
    data: {
      name: "The Sunday Writers",
      description:
        "A small group of friends who write together every week. No pressure, just words on a page.",
      adminId: writer.id,
      members: {
        create: [
          { userId: writer.id, role: "ADMIN" },
          { userId: alice.id, role: "MEMBER" },
          { userId: bob.id, role: "MEMBER" },
          { userId: carol.id, role: "MEMBER" },
        ],
      },
    },
  });
  console.log(`  Club: "${club.name}" (${club.id})`);

  // Set lastActiveClubId for completed-onboarding users
  await prisma.user.updateMany({
    where: {
      email: { in: ["writer@test.local", "alice@test.local", "bob@test.local", "carol@test.local"] },
    },
    data: { lastActiveClubId: club.id },
  });
  console.log("  Set lastActiveClubId for writer, alice, bob, carol");

  // -------------------------------------------------------------------------
  // 3. Active riff — "Write About a Place"
  // -------------------------------------------------------------------------
  console.log("\nCreating active riff...");
  const activeRiff = await prisma.riff.create({
    data: {
      clubId: club.id,
      creatorId: writer.id,
      title: "Write About a Place",
      prompt:
        "Describe a place that has changed you — not where you live now, but somewhere you carry with you. Lean into the sensory details.",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      status: "ACTIVE",
    },
  });
  console.log(`  Active riff: "${activeRiff.title}" (${activeRiff.id})`);

  // Participants: writer, alice, bob (NOT carol)
  await prisma.riffParticipant.createMany({
    data: [
      { riffId: activeRiff.id, userId: writer.id },
      { riffId: activeRiff.id, userId: alice.id },
      { riffId: activeRiff.id, userId: bob.id },
    ],
  });
  console.log("  Participants: writer, alice, bob (carol not joined)");

  // Alice's submitted piece
  const alicePiece = await prisma.piece.create({
    data: {
      title: "The Train Station in Prague",
      authorId: alice.id,
      currentContent:
        '<p>I first arrived at Prague\'s main station on a grey Tuesday in March. The ceiling arches above you like the ribcage of some enormous creature, and the light that filters through the glass panels is the color of old honey.</p><p>I stood there for twenty minutes, not moving, just watching the pigeons.</p>',
      wordCount: 58,
    },
  });
  await prisma.pieceRiff.create({
    data: { pieceId: alicePiece.id, riffId: activeRiff.id },
  });
  console.log("  Alice submitted piece to active riff");

  // -------------------------------------------------------------------------
  // 4. Completed riff — "Childhood Memories"
  // -------------------------------------------------------------------------
  console.log("\nCreating completed riff...");
  const completedRiff = await prisma.riff.create({
    data: {
      clubId: club.id,
      creatorId: writer.id,
      title: "Childhood Memories",
      prompt: "Write about something you remember from before you were ten.",
      deadline: new Date("2026-01-15T23:59:59Z"),
      status: "COMPLETED",
    },
  });
  console.log(`  Completed riff: "${completedRiff.title}" (${completedRiff.id})`);

  const completedPieces = [
    {
      title: "The Red Bicycle",
      authorId: writer.id,
      currentContent:
        "<p>The summer I turned seven, my father brought home a red bicycle. It was too big for me — my feet barely grazed the pedals — but I rode it anyway, all the way down Maple Street and back, three times a day.</p>",
      wordCount: 42,
    },
    {
      title: "Saturday Mornings",
      authorId: alice.id,
      currentContent:
        "<p>Saturday mornings meant cartoons and toast with too much butter. My sister and I would camp on the living room floor with blankets, and the whole world outside could wait.</p>",
      wordCount: 36,
    },
    {
      title: "Grandma's Kitchen",
      authorId: bob.id,
      currentContent:
        "<p>The kitchen smelled like cardamom and something I still can't name. She never measured anything. She just knew — a pinch here, a handful there — and it always came out perfect.</p>",
      wordCount: 38,
    },
  ];

  for (const p of completedPieces) {
    const piece = await prisma.piece.create({ data: p });
    await prisma.pieceRiff.create({
      data: { pieceId: piece.id, riffId: completedRiff.id },
    });
  }
  console.log("  Added 3 pieces (writer, alice, bob)");

  // -------------------------------------------------------------------------
  // 5. Summary
  // -------------------------------------------------------------------------
  console.log("\n========================================");
  console.log("  E2E seed data created successfully!");
  console.log("========================================\n");
  console.log("Club:", club.name, `(${club.id})`);
  console.log("Active riff:", activeRiff.title, `(${activeRiff.id})`);
  console.log("Completed riff:", completedRiff.title, `(${completedRiff.id})`);
  console.log("");
  console.log("Test scenarios (go to /dev-signin):");
  console.log("");
  console.log("  1. FRESH ONBOARDING");
  console.log("     fresh@test.local → /onboarding (starts at name step)");
  console.log("");
  console.log("  2. RESUME ONBOARDING");
  console.log("     midway@test.local → /onboarding (resumes at club-choice)");
  console.log("");
  console.log("  3. CLUB VIEW + EDITOR");
  console.log(`     writer@test.local → /clubs/${club.id}`);
  console.log('     Joined active riff, no piece. Click "Continue writing" → editor');
  console.log("");
  console.log("  4. SUBMITTED STATE");
  console.log(`     alice@test.local → /clubs/${club.id}`);
  console.log("     Has submitted piece to active riff");
  console.log("");
  console.log("  5. WAITING STATE");
  console.log(`     bob@test.local → /clubs/${club.id}`);
  console.log("     Joined active riff, no piece yet");
  console.log("");
  console.log("  6. NOT JOINED");
  console.log(`     carol@test.local → /clubs/${club.id}`);
  console.log("     Club member but not joined to active riff");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
