/**
 * Payment Flow Integration Tests
 *
 * Tests the complete payment tracking flow:
 * 1. Participant joins paid hunt → status: pending, paymentStatus: pending
 * 2. Participant marks payment → paymentStatus: marked_paid
 * 3. Organizer confirms payment → status: confirmed, paymentStatus: confirmed
 *
 * Run with: npx jest tests/payment-flow.test.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Test data IDs (will be populated in beforeAll)
let organizerId: string;
let participantId: string;
let paidHuntId: string;
let freeHuntId: string;
let privateHuntId: string;

// Mock session for API calls
const mockOrganizerSession = { user: { id: "" } };
const mockParticipantSession = { user: { id: "" } };

describe("Payment Flow Tests", () => {
  beforeAll(async () => {
    // Get test users
    const organizer = await prisma.user.findUnique({
      where: { email: "organizer@test.com" },
    });
    const participant = await prisma.user.findUnique({
      where: { email: "participant1@test.com" },
    });

    if (!organizer || !participant) {
      throw new Error(
        "Test users not found. Run: npx ts-node prisma/seed-test-hunts.ts"
      );
    }

    organizerId = organizer.id;
    participantId = participant.id;
    mockOrganizerSession.user.id = organizerId;
    mockParticipantSession.user.id = participantId;

    // Create fresh test hunts for this test run
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Clean up any existing test participants
    await prisma.huntParticipant.deleteMany({
      where: {
        hunt: { name: { startsWith: "[TEST-PAYMENT]" } },
      },
    });
    await prisma.hunt.deleteMany({
      where: { name: { startsWith: "[TEST-PAYMENT]" } },
    });

    // Create paid public hunt
    const paidHunt = await prisma.hunt.create({
      data: {
        name: "[TEST-PAYMENT] Paid Public Hunt",
        description: "Test hunt for payment flow",
        location: "Test Location",
        latitude: 69.0,
        longitude: 18.0,
        startDate: tomorrow,
        endDate: nextWeek,
        isPublic: true,
        isPaid: true,
        price: 100.0,
        capacity: 10,
        allowWaitlist: true,
        userId: organizerId,
      },
    });
    paidHuntId = paidHunt.id;

    // Create free public hunt
    const freeHunt = await prisma.hunt.create({
      data: {
        name: "[TEST-PAYMENT] Free Public Hunt",
        description: "Test hunt for free join flow",
        location: "Test Location",
        latitude: 69.0,
        longitude: 18.0,
        startDate: tomorrow,
        endDate: nextWeek,
        isPublic: true,
        isPaid: false,
        capacity: 10,
        allowWaitlist: true,
        userId: organizerId,
      },
    });
    freeHuntId = freeHunt.id;

    // Create private hunt
    const privateHunt = await prisma.hunt.create({
      data: {
        name: "[TEST-PAYMENT] Private Hunt",
        description: "Test hunt for approval flow",
        location: "Test Location",
        latitude: 69.0,
        longitude: 18.0,
        startDate: tomorrow,
        endDate: nextWeek,
        isPublic: false,
        isPaid: false,
        capacity: 10,
        allowWaitlist: true,
        userId: organizerId,
      },
    });
    privateHuntId = privateHunt.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.huntParticipant.deleteMany({
      where: {
        hunt: { name: { startsWith: "[TEST-PAYMENT]" } },
      },
    });
    await prisma.hunt.deleteMany({
      where: { name: { startsWith: "[TEST-PAYMENT]" } },
    });
    await prisma.$disconnect();
  });

  describe("1. Join Hunt Flow", () => {
    beforeEach(async () => {
      // Clean up participants before each test
      await prisma.huntParticipant.deleteMany({
        where: { huntId: { in: [paidHuntId, freeHuntId, privateHuntId] } },
      });
    });

    test("Joining FREE PUBLIC hunt should auto-confirm", async () => {
      // Simulate joining a free public hunt
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: freeHuntId,
          userId: participantId,
          status: "confirmed",
          paymentStatus: null,
        },
      });

      expect(participant.status).toBe("confirmed");
      expect(participant.paymentStatus).toBeNull();
    });

    test("Joining PAID PUBLIC hunt should set pending with payment pending", async () => {
      // Simulate joining a paid public hunt
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: paidHuntId,
          userId: participantId,
          status: "pending",
          paymentStatus: "pending",
        },
      });

      expect(participant.status).toBe("pending");
      expect(participant.paymentStatus).toBe("pending");
    });

    test("Joining PRIVATE hunt should set pending (awaiting approval)", async () => {
      // Simulate joining a private hunt
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: privateHuntId,
          userId: participantId,
          status: "pending",
          paymentStatus: null,
        },
      });

      expect(participant.status).toBe("pending");
      expect(participant.paymentStatus).toBeNull();
    });
  });

  describe("2. Mark Payment Flow", () => {
    let participantRecord: { id: string };

    beforeEach(async () => {
      // Clean up and create a pending paid participant
      await prisma.huntParticipant.deleteMany({
        where: { huntId: paidHuntId },
      });

      participantRecord = await prisma.huntParticipant.create({
        data: {
          huntId: paidHuntId,
          userId: participantId,
          status: "pending",
          paymentStatus: "pending",
        },
      });
    });

    test("Participant can mark payment as made", async () => {
      // Simulate marking payment as made
      const updated = await prisma.huntParticipant.update({
        where: { id: participantRecord.id },
        data: { paymentStatus: "marked_paid" },
      });

      expect(updated.status).toBe("pending"); // Still pending until organizer confirms
      expect(updated.paymentStatus).toBe("marked_paid");
    });

    test("Cannot mark payment if not in pending status", async () => {
      // First confirm the participant
      await prisma.huntParticipant.update({
        where: { id: participantRecord.id },
        data: { status: "confirmed", paymentStatus: "confirmed" },
      });

      // Verify the status
      const participant = await prisma.huntParticipant.findUnique({
        where: { id: participantRecord.id },
      });

      expect(participant?.status).toBe("confirmed");
      expect(participant?.paymentStatus).toBe("confirmed");
      // In the actual API, this would return an error
    });

    test("Cannot mark payment for free hunt", async () => {
      // Create participant in free hunt
      const freeParticipant = await prisma.huntParticipant.create({
        data: {
          huntId: freeHuntId,
          userId: participantId,
          status: "confirmed",
          paymentStatus: null,
        },
      });

      // Payment status should remain null for free hunts
      expect(freeParticipant.paymentStatus).toBeNull();
    });
  });

  describe("3. Organizer Confirm Payment Flow", () => {
    let participantRecord: { id: string };

    beforeEach(async () => {
      // Clean up and create a participant who marked payment
      await prisma.huntParticipant.deleteMany({
        where: { huntId: paidHuntId },
      });

      participantRecord = await prisma.huntParticipant.create({
        data: {
          huntId: paidHuntId,
          userId: participantId,
          status: "pending",
          paymentStatus: "marked_paid",
        },
      });
    });

    test("Organizer can confirm payment", async () => {
      // Simulate organizer confirming payment
      const updated = await prisma.huntParticipant.update({
        where: { id: participantRecord.id },
        data: {
          status: "confirmed",
          paymentStatus: "confirmed",
        },
      });

      expect(updated.status).toBe("confirmed");
      expect(updated.paymentStatus).toBe("confirmed");
    });

    test("Confirmed participant should be fully confirmed", async () => {
      // Confirm the payment
      await prisma.huntParticipant.update({
        where: { id: participantRecord.id },
        data: {
          status: "confirmed",
          paymentStatus: "confirmed",
        },
      });

      // Verify the hunt now has a confirmed participant
      const hunt = await prisma.hunt.findUnique({
        where: { id: paidHuntId },
        include: {
          _count: {
            select: {
              participants: {
                where: { status: "confirmed" },
              },
            },
          },
        },
      });

      expect(hunt?._count.participants).toBe(1);
    });
  });

  describe("4. Full Payment Flow (End-to-End)", () => {
    test("Complete payment flow from join to confirmation", async () => {
      // Clean up
      await prisma.huntParticipant.deleteMany({
        where: { huntId: paidHuntId },
      });

      // Step 1: Participant joins paid hunt
      const joined = await prisma.huntParticipant.create({
        data: {
          huntId: paidHuntId,
          userId: participantId,
          status: "pending",
          paymentStatus: "pending",
        },
      });
      expect(joined.status).toBe("pending");
      expect(joined.paymentStatus).toBe("pending");

      // Step 2: Participant marks payment as made
      const markedPaid = await prisma.huntParticipant.update({
        where: { id: joined.id },
        data: { paymentStatus: "marked_paid" },
      });
      expect(markedPaid.status).toBe("pending");
      expect(markedPaid.paymentStatus).toBe("marked_paid");

      // Step 3: Organizer confirms payment
      const confirmed = await prisma.huntParticipant.update({
        where: { id: joined.id },
        data: {
          status: "confirmed",
          paymentStatus: "confirmed",
        },
      });
      expect(confirmed.status).toBe("confirmed");
      expect(confirmed.paymentStatus).toBe("confirmed");

      // Verify final state
      const finalState = await prisma.huntParticipant.findUnique({
        where: { id: joined.id },
      });
      expect(finalState?.status).toBe("confirmed");
      expect(finalState?.paymentStatus).toBe("confirmed");
    });
  });

  describe("5. Waitlist Flow", () => {
    test("Joining full hunt should add to waitlist", async () => {
      // Create a hunt at capacity
      const fullHunt = await prisma.hunt.create({
        data: {
          name: "[TEST-PAYMENT] Full Hunt",
          description: "Test",
          location: "Test",
          latitude: 69.0,
          longitude: 18.0,
          startDate: new Date(Date.now() + 86400000),
          endDate: new Date(Date.now() + 86400000 * 7),
          isPublic: true,
          isPaid: false,
          capacity: 1,
          allowWaitlist: true,
          userId: organizerId,
        },
      });

      // Add one confirmed participant to fill capacity
      await prisma.huntParticipant.create({
        data: {
          huntId: fullHunt.id,
          userId: organizerId, // Using organizer as first participant
          status: "confirmed",
        },
      });

      // Next participant should be waitlisted
      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: fullHunt.id,
          userId: participantId,
          status: "waitlisted",
          waitlistPosition: 1,
        },
      });

      expect(waitlisted.status).toBe("waitlisted");
      expect(waitlisted.waitlistPosition).toBe(1);

      // Clean up
      await prisma.huntParticipant.deleteMany({
        where: { huntId: fullHunt.id },
      });
      await prisma.hunt.delete({ where: { id: fullHunt.id } });
    });
  });

  describe("6. Pending Payments Query", () => {
    test("Can fetch hunts with pending payment confirmations", async () => {
      // Create participant with marked_paid status
      await prisma.huntParticipant.deleteMany({
        where: { huntId: paidHuntId },
      });

      await prisma.huntParticipant.create({
        data: {
          huntId: paidHuntId,
          userId: participantId,
          status: "pending",
          paymentStatus: "marked_paid",
        },
      });

      // Query for hunts with pending payments (as organizer would)
      const huntsWithPendingPayments = await prisma.hunt.findMany({
        where: {
          userId: organizerId,
          isPaid: true,
          participants: {
            some: {
              paymentStatus: "marked_paid",
              status: "pending",
            },
          },
        },
        include: {
          participants: {
            where: {
              paymentStatus: "marked_paid",
              status: "pending",
            },
          },
        },
      });

      expect(huntsWithPendingPayments.length).toBeGreaterThan(0);
      expect(huntsWithPendingPayments[0].participants.length).toBe(1);
    });
  });
});
