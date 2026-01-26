import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = "cmkvm27ve000f24332fu6zmbb";

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error("User not found!");
    process.exit(1);
  }

  console.log("Found user:", user.email);

  // Create club
  const club = await prisma.club.create({
    data: {
      name: "Write Club Test",
      description: "This is a test club description",
      adminId: userId,
      members: {
        create: {
          userId: userId,
          role: "ADMIN",
        },
      },
    },
  });

  console.log("Created club:", club.id, club.name);

  // Create riff with deadline (Note: Feb 30 doesn't exist, using Feb 28)
  const riff = await prisma.riff.create({
    data: {
      clubId: club.id,
      creatorId: userId,
      title: "Volume 1",
      prompt: "This is a test prompt for a test riff.",
      deadline: new Date("2026-02-28T23:59:59Z"),
      status: "ACTIVE",
    },
  });

  console.log("Created riff:", riff.id, riff.title);

  // Join the riff as a participant
  const participant = await prisma.riffParticipant.create({
    data: {
      riffId: riff.id,
      userId: userId,
    },
  });

  console.log("User joined riff as participant");

  console.log("\n✅ Test data created successfully!");
  console.log("Club ID:", club.id);
  console.log("Riff ID:", riff.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
