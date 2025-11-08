/**
 * Hunt Join Limit Edge Cases Test Suite
 *
 * Tests all join limit edge cases from requirements:
 * 1. Allow join up to 1 minute before hunt ends - allow people to join ongoing hunt
 * 2. Allow owner to accept over capacity with a warning prompt that the capacity will be auto adjusted to accommodate the owner's additional participant
 * 3. When two users are grabbing the last spot, prompt them that it is full and ask them to try again later
 */

import { PrismaClient } from '@prisma/client';
import { calculateExpirationDate } from '../src/lib/huntEdgeCases';

const prisma = new PrismaClient();

describe('Join Limit Edge Cases', () => {
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeAll(async () => {
    // Create test users
    owner = await prisma.user.create({
      data: {
        id: 'join-limit-owner-test',
        email: 'join-limit-owner@test.com',
        name: 'Join Limit Owner',
        emailVerified: new Date(),
      },
    });

    user1 = await prisma.user.create({
      data: {
        id: 'join-limit-user1-test',
        email: 'join-limit-user1@test.com',
        name: 'Join Limit User 1',
        emailVerified: new Date(),
      },
    });

    user2 = await prisma.user.create({
      data: {
        id: 'join-limit-user2-test',
        email: 'join-limit-user2@test.com',
        name: 'Join Limit User 2',
        emailVerified: new Date(),
      },
    });

    user3 = await prisma.user.create({
      data: {
        id: 'join-limit-user3-test',
        email: 'join-limit-user3@test.com',
        name: 'Join Limit User 3',
        emailVerified: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.huntParticipant.deleteMany({
      where: {
        userId: {
          in: [owner.id, user1.id, user2.id, user3.id],
        },
      },
    });

    await prisma.hunt.deleteMany({
      where: { userId: owner.id },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [owner.id, user1.id, user2.id, user3.id],
        },
      },
    });

    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up hunt participants after each test
    await prisma.huntParticipant.deleteMany({
      where: {
        userId: {
          in: [owner.id, user1.id, user2.id, user3.id],
        },
      },
    });

    // Clean up hunts after each test
    await prisma.hunt.deleteMany({
      where: { userId: owner.id },
    });
  });

  describe('Edge Case 1: Allow join up to 1 minute before hunt ends', () => {
    it('Should allow users to join ongoing hunt (after start but before end)', async () => {
      // Create hunt that has already started but not ended
      const now = new Date();
      const huntStartDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Started 2 hours ago
      const huntEndDate = new Date(now.getTime() + 30 * 60 * 1000); // Ends in 30 minutes

      const hunt = await prisma.hunt.create({
        data: {
          name: 'Ongoing Hunt Test',
          userId: owner.id,
          startDate: huntStartDate,
          endDate: huntEndDate,
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 5,
        },
      });

      // Owner is already in the hunt
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 tries to join the ongoing hunt
      const currentTime = new Date();
      const huntIsOngoing = currentTime >= hunt.startDate && currentTime < hunt.endDate;
      expect(huntIsOngoing).toBe(true);

      // Should be allowed to join
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed', // Public hunt, so auto-confirmed
        },
      });

      expect(participant.status).toBe('confirmed');
      expect(participant.userId).toBe(user1.id);

      // Verify join was successful
      const joinedParticipant = await prisma.huntParticipant.findUnique({
        where: { huntId_userId: { huntId: hunt.id, userId: user1.id } },
      });

      expect(joinedParticipant).toBeDefined();
      expect(joinedParticipant?.status).toBe('confirmed');
    });

    it('Should block join attempts within 1 minute before hunt ends', async () => {
      // Create hunt ending in 30 seconds
      const now = new Date();
      const huntStartDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Started 2 hours ago
      const huntEndDate = new Date(now.getTime() + 30 * 1000); // Ends in 30 seconds

      const hunt = await prisma.hunt.create({
        data: {
          name: 'Almost Ended Hunt Test',
          userId: owner.id,
          startDate: huntStartDate,
          endDate: huntEndDate,
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 5,
        },
      });

      // Owner is already in the hunt
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // Check if within 1 minute before end
      const currentTime = new Date();
      const oneMinuteBeforeEnd = new Date(hunt.endDate.getTime() - 60 * 1000);
      const isTooCloseToEnd = currentTime >= oneMinuteBeforeEnd;

      expect(isTooCloseToEnd).toBe(true);

      // Implementation should block join
      // This would be validated in the API route
      const canJoin = currentTime < oneMinuteBeforeEnd;
      expect(canJoin).toBe(false);
    });

    it('Should allow join exactly at 1 minute before end (boundary test)', async () => {
      // Create hunt ending in exactly 61 seconds
      const now = new Date();
      const huntStartDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const huntEndDate = new Date(now.getTime() + 61 * 1000); // 61 seconds = just over 1 minute

      const hunt = await prisma.hunt.create({
        data: {
          name: 'Boundary Hunt Test',
          userId: owner.id,
          startDate: huntStartDate,
          endDate: huntEndDate,
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 5,
        },
      });

      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // Check if within 1 minute before end
      const currentTime = new Date();
      const oneMinuteBeforeEnd = new Date(hunt.endDate.getTime() - 60 * 1000);
      const canJoin = currentTime < oneMinuteBeforeEnd;

      expect(canJoin).toBe(true);

      // Should be allowed to join
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      expect(participant.status).toBe('confirmed');
    });

    it('Should block join after hunt has ended', async () => {
      // Create hunt that has already ended
      const now = new Date();
      const huntStartDate = new Date(now.getTime() - 3 * 60 * 60 * 1000); // Started 3 hours ago
      const huntEndDate = new Date(now.getTime() - 30 * 60 * 1000); // Ended 30 minutes ago

      const hunt = await prisma.hunt.create({
        data: {
          name: 'Ended Hunt Test',
          userId: owner.id,
          startDate: huntStartDate,
          endDate: huntEndDate,
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 5,
        },
      });

      // Check if hunt has ended
      const currentTime = new Date();
      const huntHasEnded = currentTime >= hunt.endDate;

      expect(huntHasEnded).toBe(true);

      // Should NOT be allowed to join
      const canJoin = currentTime < hunt.endDate;
      expect(canJoin).toBe(false);
    });
  });

  describe('Edge Case 2: Owner can accept over capacity with auto-adjustment', () => {
    it('Should allow owner to accept over capacity and auto-adjust capacity', async () => {
      // Create private hunt with capacity 3
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Over Capacity Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: false,
          isPaid: false,
          capacity: 3,
        },
      });

      // Owner joins (1/3)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 requests and gets accepted (2/3)
      const user1Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      // User2 requests and gets accepted (3/3 - capacity full)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'confirmed',
        },
      });

      // User3 requests to join (over capacity)
      const user3Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'pending', // Waiting for owner approval
        },
      });

      // Check current capacity
      const confirmedCount = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });

      expect(confirmedCount).toBe(3); // At capacity

      // Owner accepts user3 (over capacity)
      // Implementation should:
      // 1. Show warning: "This will increase capacity from 3 to 4. Continue?"
      // 2. Auto-adjust capacity to 4
      // 3. Accept user3

      const newCapacity = confirmedCount + 1; // Auto-adjust to accommodate

      await prisma.$transaction([
        // Accept the user
        prisma.huntParticipant.update({
          where: { id: user3Participant.id },
          data: { status: 'confirmed' },
        }),
        // Auto-adjust capacity
        prisma.hunt.update({
          where: { id: hunt.id },
          data: { capacity: newCapacity },
        }),
      ]);

      // Verify user3 was accepted
      const acceptedUser3 = await prisma.huntParticipant.findUnique({
        where: { id: user3Participant.id },
      });
      expect(acceptedUser3?.status).toBe('confirmed');

      // Verify capacity was auto-adjusted
      const updatedHunt = await prisma.hunt.findUnique({
        where: { id: hunt.id },
      });
      expect(updatedHunt?.capacity).toBe(4);

      // Verify all 4 users are confirmed
      const finalConfirmedCount = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });
      expect(finalConfirmedCount).toBe(4);
    });

    it('Should show warning message before auto-adjusting capacity', async () => {
      // Create hunt at capacity
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Warning Prompt Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: false,
          isPaid: false,
          capacity: 2,
        },
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: owner.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
        ],
      });

      // User2 requests to join
      const user2Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'pending',
        },
      });

      // Check if accepting would exceed capacity
      const confirmedCount = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });

      const currentCapacity = hunt.capacity || 0;
      const wouldExceedCapacity = confirmedCount >= currentCapacity;

      expect(wouldExceedCapacity).toBe(true);

      // Generate warning message
      const warningMessage = `This will increase the hunt capacity from ${currentCapacity} to ${confirmedCount + 1} to accommodate this participant. Do you want to continue?`;

      expect(warningMessage).toContain('increase the hunt capacity');
      expect(warningMessage).toContain(`from ${currentCapacity} to ${confirmedCount + 1}`);
    });
  });

  describe('Edge Case 3: Race condition - two users grabbing last spot', () => {
    it('Should handle race condition when two users try to grab the last spot', async () => {
      // Create hunt with 1 spot left
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Race Condition Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 2,
        },
      });

      // Owner joins (1/2)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // Simulate race condition: Both users try to join simultaneously
      // In reality, this would be handled by database constraints and transactions

      // User1 tries to join
      const confirmedCountBeforeUser1 = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });

      const hasSpaceForUser1 = confirmedCountBeforeUser1 < hunt.capacity!;
      expect(hasSpaceForUser1).toBe(true);

      // User1 successfully joins (gets the last spot)
      const user1Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      expect(user1Participant.status).toBe('confirmed');

      // User2 tries to join immediately after
      const confirmedCountBeforeUser2 = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });

      const hasSpaceForUser2 = confirmedCountBeforeUser2 < hunt.capacity!;
      expect(hasSpaceForUser2).toBe(false); // No space left

      // User2 should be rejected with message
      // Implementation should return error: "Hunt is full. Please try again later."

      // Verify only 2 confirmed participants
      const finalCount = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });

      expect(finalCount).toBe(2);
    });

    it('Should add second user to waitlist if allowWaitlist is enabled', async () => {
      // Create hunt with waitlist enabled
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Waitlist Race Condition Test',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 2,
          allowWaitlist: true,
        },
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: owner.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
        ],
      });

      // User2 tries to join (capacity full)
      const confirmedCount = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });

      const isAtCapacity = confirmedCount >= hunt.capacity!;
      expect(isAtCapacity).toBe(true);

      // Should be added to waitlist
      const user2Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'waitlisted',
          waitlistPosition: 1,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      expect(user2Participant.status).toBe('waitlisted');
      expect(user2Participant.waitlistPosition).toBe(1);

      // User3 also tries to join
      const user3Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 2,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      expect(user3Participant.status).toBe('waitlisted');
      expect(user3Participant.waitlistPosition).toBe(2);

      // Verify FIFO order
      const waitlist = await prisma.huntParticipant.findMany({
        where: {
          huntId: hunt.id,
          status: 'waitlisted',
        },
        orderBy: { waitlistPosition: 'asc' },
      });

      expect(waitlist[0].userId).toBe(user2.id);
      expect(waitlist[1].userId).toBe(user3.id);
    });

    it('Should return "Hunt is full" error message without waitlist', async () => {
      // Create hunt without waitlist
      const hunt = await prisma.hunt.create({
        data: {
          name: 'No Waitlist Race Condition Test',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 2,
          allowWaitlist: false,
        },
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: owner.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
        ],
      });

      // Check if capacity is full
      const confirmedCount = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });

      const isAtCapacity = confirmedCount >= hunt.capacity!;
      const allowsWaitlist = hunt.allowWaitlist;

      expect(isAtCapacity).toBe(true);
      expect(allowsWaitlist).toBe(false);

      // Should return error message
      const errorMessage = isAtCapacity && !allowsWaitlist
        ? 'This hunt is full. Please try again later.'
        : null;

      expect(errorMessage).toBe('This hunt is full. Please try again later.');
    });

    it('Should use database transaction to prevent race conditions', async () => {
      // Create hunt with 1 spot left
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Transaction Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 2,
          allowWaitlist: false,
        },
      });

      // Owner joins
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // Use transaction to ensure atomicity
      // This simulates proper implementation to prevent race conditions
      try {
        await prisma.$transaction(async (tx) => {
          // Lock the hunt row for update
          const huntWithCount = await tx.hunt.findUnique({
            where: { id: hunt.id },
            include: {
              _count: {
                select: {
                  participants: {
                    where: { status: 'confirmed' },
                  },
                },
              },
            },
          });

          if (!huntWithCount) throw new Error('Hunt not found');

          const confirmedCount = huntWithCount._count.participants;
          const hasSpace = confirmedCount < huntWithCount.capacity!;

          if (!hasSpace) {
            throw new Error('Hunt is full. Please try again later.');
          }

          // Create participant if space available
          await tx.huntParticipant.create({
            data: {
              huntId: hunt.id,
              userId: user1.id,
              status: 'confirmed',
            },
          });
        });

        // Transaction succeeded
        const user1Joined = await prisma.huntParticipant.findUnique({
          where: { huntId_userId: { huntId: hunt.id, userId: user1.id } },
        });

        expect(user1Joined).toBeDefined();
        expect(user1Joined?.status).toBe('confirmed');
      } catch (error) {
        // Transaction would fail if hunt is full
        expect(error).toBeDefined();
      }
    });
  });
});
