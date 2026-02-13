import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Deletes all e2e seed data: users with @test.local emails and
 * their associated clubs, riffs, pieces, etc.
 *
 * Run with: npm run db:reset:e2e
 */

async function main() {
  console.log("=== E2E Reset Script ===\n");

  // Find all test users
  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@test.local" } },
    select: { id: true, email: true },
  });

  if (testUsers.length === 0) {
    console.log("No @test.local users found. Nothing to clean up.");
    return;
  }

  const userIds = testUsers.map((u) => u.id);
  console.log(`Found ${testUsers.length} test user(s):`);
  testUsers.forEach((u) => console.log(`  - ${u.email}`));

  // 1. Delete clubs created by test users (and their riff data)
  const clubs = await prisma.club.findMany({
    where: { adminId: { in: userIds } },
    select: { id: true, name: true },
  });

  for (const club of clubs) {
    const riffs = await prisma.riff.findMany({
      where: { clubId: club.id },
      select: { id: true },
    });
    const riffIds = riffs.map((r) => r.id);

    if (riffIds.length > 0) {
      await prisma.pieceRiff.deleteMany({
        where: { riffId: { in: riffIds } },
      });
      await prisma.riffParticipant.deleteMany({
        where: { riffId: { in: riffIds } },
      });
      await prisma.riff.deleteMany({
        where: { id: { in: riffIds } },
      });
    }

    await prisma.clubMember.deleteMany({
      where: { clubId: club.id },
    });
    await prisma.club.delete({ where: { id: club.id } });
    console.log(`\nDeleted club: "${club.name}" (${club.id})`);
  }

  // 2. Delete pieces authored by test users
  const pieces = await prisma.piece.findMany({
    where: { authorId: { in: userIds } },
    select: { id: true, title: true },
  });

  if (pieces.length > 0) {
    const pieceIds = pieces.map((p) => p.id);
    await prisma.pieceRiff.deleteMany({
      where: { pieceId: { in: pieceIds } },
    });
    await prisma.piece.deleteMany({
      where: { id: { in: pieceIds } },
    });
    console.log(`\nDeleted ${pieces.length} piece(s)`);
  }

  // 3. Delete riff participations by test users (in non-test clubs)
  await prisma.riffParticipant.deleteMany({
    where: { userId: { in: userIds } },
  });

  // 4. Delete club memberships by test users (in non-test clubs)
  await prisma.clubMember.deleteMany({
    where: { userId: { in: userIds } },
  });

  // 5. Delete test users
  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
  console.log(`\nDeleted ${testUsers.length} test user(s)`);

  console.log("\n========================================");
  console.log("  E2E data cleaned up successfully!");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
