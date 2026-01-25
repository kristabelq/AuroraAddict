import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌌 Seeding test data for Aurora Addict...\n");

  // Create test users
  const hashedPassword = await bcrypt.hash("testpass123", 12);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@test.com" },
    update: {},
    create: {
      email: "organizer@test.com",
      username: "aurora_organizer",
      name: "Test Organizer",
      password: hashedPassword,
      image: "/default-avatar.png",
    },
  });
  console.log("✅ Created organizer:", organizer.email);

  const participant1 = await prisma.user.upsert({
    where: { email: "participant1@test.com" },
    update: {},
    create: {
      email: "participant1@test.com",
      username: "aurora_hunter1",
      name: "Test Participant 1",
      password: hashedPassword,
      image: "/default-avatar.png",
    },
  });
  console.log("✅ Created participant1:", participant1.email);

  const participant2 = await prisma.user.upsert({
    where: { email: "participant2@test.com" },
    update: {},
    create: {
      email: "participant2@test.com",
      username: "aurora_hunter2",
      name: "Test Participant 2",
      password: hashedPassword,
      image: "/default-avatar.png",
    },
  });
  console.log("✅ Created participant2:", participant2.email);

  // Helper to create dates
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Delete existing test hunts (by name pattern)
  await prisma.huntParticipant.deleteMany({
    where: {
      hunt: {
        name: { startsWith: "[TEST]" },
      },
    },
  });
  await prisma.hunt.deleteMany({
    where: { name: { startsWith: "[TEST]" } },
  });
  console.log("\n🗑️  Cleared existing test hunts\n");

  // 1. Free Public Hunt (Open to join)
  const freePublicHunt = await prisma.hunt.create({
    data: {
      name: "[TEST] Free Public Aurora Hunt",
      description: "A free public hunt for testing. Anyone can join immediately.",
      location: "Tromsø, Norway",
      latitude: 69.6492,
      longitude: 18.9553,
      startDate: tomorrow,
      endDate: nextWeek,
      isPublic: true,
      isPaid: false,
      capacity: 10,
      allowWaitlist: true,
      userId: organizer.id,
    },
  });
  console.log("✅ Created: Free Public Hunt");

  // 2. Free Private Hunt (Requires approval)
  const freePrivateHunt = await prisma.hunt.create({
    data: {
      name: "[TEST] Free Private Aurora Hunt",
      description: "A free private hunt. Requires organizer approval to join.",
      location: "Reykjavik, Iceland",
      latitude: 64.1466,
      longitude: -21.9426,
      startDate: tomorrow,
      endDate: nextWeek,
      isPublic: false,
      isPaid: false,
      capacity: 5,
      allowWaitlist: true,
      userId: organizer.id,
    },
  });
  console.log("✅ Created: Free Private Hunt");

  // 3. Paid Public Hunt (Payment tracking)
  const paidPublicHunt = await prisma.hunt.create({
    data: {
      name: "[TEST] Paid Public Aurora Hunt",
      description: "A paid public hunt for testing payment flow. $50/person.",
      location: "Fairbanks, Alaska, USA",
      latitude: 64.8378,
      longitude: -147.7164,
      startDate: tomorrow,
      endDate: nextWeek,
      isPublic: true,
      isPaid: true,
      price: 50.0,
      capacity: 8,
      allowWaitlist: true,
      cancellationPolicy: "Full refund if cancelled 48 hours before start. 50% refund within 48 hours.",
      whatsappNumber: "1234567890",
      userId: organizer.id,
    },
  });
  console.log("✅ Created: Paid Public Hunt ($50)");

  // 4. Paid Private Hunt (Approval + Payment)
  const paidPrivateHunt = await prisma.hunt.create({
    data: {
      name: "[TEST] Paid Private Aurora Hunt",
      description: "A paid private hunt. Requires approval AND payment confirmation.",
      location: "Yellowknife, Canada",
      latitude: 62.4540,
      longitude: -114.3718,
      startDate: nextWeek,
      endDate: twoWeeks,
      isPublic: false,
      isPaid: true,
      price: 150.0,
      capacity: 4,
      allowWaitlist: false,
      cancellationPolicy: "No refunds for private hunts.",
      userId: organizer.id,
    },
  });
  console.log("✅ Created: Paid Private Hunt ($150)");

  // 5. Full Hunt (At capacity - for waitlist testing)
  const fullHunt = await prisma.hunt.create({
    data: {
      name: "[TEST] Full Hunt (Waitlist Test)",
      description: "This hunt is at capacity to test waitlist functionality.",
      location: "Abisko, Sweden",
      latitude: 68.3496,
      longitude: 18.8310,
      startDate: tomorrow,
      endDate: nextWeek,
      isPublic: true,
      isPaid: false,
      capacity: 2,
      allowWaitlist: true,
      userId: organizer.id,
    },
  });

  // Add 2 confirmed participants to make it full
  await prisma.huntParticipant.create({
    data: {
      huntId: fullHunt.id,
      userId: participant1.id,
      status: "confirmed",
    },
  });
  await prisma.huntParticipant.create({
    data: {
      huntId: fullHunt.id,
      userId: participant2.id,
      status: "confirmed",
    },
  });
  console.log("✅ Created: Full Hunt (2/2 capacity)");

  // 6. Hunt with pending payment (for organizer confirmation testing)
  const huntWithPendingPayment = await prisma.hunt.create({
    data: {
      name: "[TEST] Hunt with Pending Payment",
      description: "This hunt has a participant awaiting payment confirmation.",
      location: "Rovaniemi, Finland",
      latitude: 66.5039,
      longitude: 25.7294,
      startDate: tomorrow,
      endDate: nextWeek,
      isPublic: true,
      isPaid: true,
      price: 75.0,
      capacity: 5,
      allowWaitlist: true,
      userId: organizer.id,
    },
  });

  // Add participant with marked_paid status
  await prisma.huntParticipant.create({
    data: {
      huntId: huntWithPendingPayment.id,
      userId: participant1.id,
      status: "pending",
      paymentStatus: "marked_paid",
    },
  });
  console.log("✅ Created: Hunt with Pending Payment Confirmation");

  // 7. Ongoing Hunt (currently active)
  const ongoingHunt = await prisma.hunt.create({
    data: {
      name: "[TEST] Ongoing Aurora Hunt",
      description: "This hunt is currently ongoing for testing active hunt features.",
      location: "Kiruna, Sweden",
      latitude: 67.8558,
      longitude: 20.2253,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Ends in 3 days
      isPublic: true,
      isPaid: false,
      capacity: 10,
      allowWaitlist: true,
      userId: organizer.id,
    },
  });
  console.log("✅ Created: Ongoing Hunt");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📋 TEST DATA SUMMARY");
  console.log("=".repeat(50));
  console.log("\n👤 TEST ACCOUNTS (password: testpass123):");
  console.log("   - organizer@test.com (creates hunts)");
  console.log("   - participant1@test.com (joins hunts)");
  console.log("   - participant2@test.com (joins hunts)");
  console.log("\n🎯 TEST HUNTS CREATED:");
  console.log("   1. Free Public Hunt - immediate join");
  console.log("   2. Free Private Hunt - requires approval");
  console.log("   3. Paid Public Hunt ($50) - payment tracking");
  console.log("   4. Paid Private Hunt ($150) - approval + payment");
  console.log("   5. Full Hunt - waitlist testing");
  console.log("   6. Hunt with Pending Payment - organizer confirmation");
  console.log("   7. Ongoing Hunt - active hunt features");
  console.log("\n" + "=".repeat(50));
  console.log("🚀 Ready for testing!");
  console.log("=".repeat(50) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
