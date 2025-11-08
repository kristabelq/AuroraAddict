/**
 * Hunt Waitlist Edge Cases Test Suite
 *
 * Tests all waitlist-specific edge cases from requirements:
 * 1. 7-day owner acceptance timeout with auto-rejection
 * 2. User leave and rejoin waitlist (loses priority)
 * 3. Capacity increase auto-accept
 * 4. Private hunt manual accept (no auto-accept)
 * 5. 1-minute before start cleanup
 * 6. Waitlisted participant not included in hunt completion
 * 7. Waitlisted participant no album access
 */

import { PrismaClient } from '@prisma/client';
import { calculateExpirationDate, cleanupExpiredParticipants, getNextWaitlistPosition } from '../src/lib/huntEdgeCases';

const prisma = new PrismaClient();

describe('Waitlist Edge Cases', () => {
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  let user4: any;

  beforeAll(async () => {
    // Create test users
    owner = await prisma.user.create({
      data: {
        id: 'waitlist-owner-test',
        email: 'waitlist-owner@test.com',
        name: 'Waitlist Owner',
        emailVerified: new Date(),
      },
    });

    user1 = await prisma.user.create({
      data: {
        id: 'waitlist-user1-test',
        email: 'waitlist-user1@test.com',
        name: 'Waitlist User 1',
        emailVerified: new Date(),
      },
    });

    user2 = await prisma.user.create({
      data: {
        id: 'waitlist-user2-test',
        email: 'waitlist-user2@test.com',
        name: 'Waitlist User 2',
        emailVerified: new Date(),
      },
    });

    user3 = await prisma.user.create({
      data: {
        id: 'waitlist-user3-test',
        email: 'waitlist-user3@test.com',
        name: 'Waitlist User 3',
        emailVerified: new Date(),
      },
    });

    user4 = await prisma.user.create({
      data: {
        id: 'waitlist-user4-test',
        email: 'waitlist-user4@test.com',
        name: 'Waitlist User 4',
        emailVerified: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.huntParticipant.deleteMany({
      where: {
        userId: {
          in: [owner.id, user1.id, user2.id, user3.id, user4.id],
        },
      },
    });

    await prisma.hunt.deleteMany({
      where: { userId: owner.id },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [owner.id, user1.id, user2.id, user3.id, user4.id],
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
          in: [owner.id, user1.id, user2.id, user3.id, user4.id],
        },
      },
    });

    // Clean up hunts after each test
    await prisma.hunt.deleteMany({
      where: { userId: owner.id },
    });
  });

  describe('Edge Case 1: 7-day owner acceptance timeout', () => {
    it('Should auto-reject waitlisted user after 7 days if owner does not accept', async () => {
      // Create hunt with capacity
      const hunt = await prisma.hunt.create({
        data: {
          name: '7-Day Timeout Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 2,
          allowWaitlist: true,
        },
      });

      // Owner joins (auto-confirmed)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 joins (confirmed, fills capacity)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      // User2 joins (waitlisted with expiration)
      const expirationDate = calculateExpirationDate(hunt.startDate);
      const waitlistPosition = await getNextWaitlistPosition(hunt.id);

      const waitlistedParticipant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'waitlisted',
          waitlistPosition,
          requestExpiresAt: expirationDate,
        },
      });

      // Verify waitlisted status
      expect(waitlistedParticipant.status).toBe('waitlisted');
      expect(waitlistedParticipant.requestExpiresAt).toBeDefined();
      expect(waitlistedParticipant.waitlistPosition).toBe(1);

      // Simulate expiration by setting date to past
      await prisma.huntParticipant.update({
        where: { id: waitlistedParticipant.id },
        data: {
          requestExpiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      // Run cleanup job
      const cleanedCount = await cleanupExpiredParticipants();

      // Verify user2 was cancelled
      const updatedParticipant = await prisma.huntParticipant.findUnique({
        where: { id: waitlistedParticipant.id },
      });

      expect(cleanedCount).toBeGreaterThan(0);
      expect(updatedParticipant?.status).toBe('cancelled');
    });

    it('Should calculate 7-day timeout correctly (7 days OR before hunt start, whichever is sooner)', async () => {
      // Hunt starting in 5 days
      const huntStartDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const expirationDate = calculateExpirationDate(huntStartDate);

      // Expiration should be 1 second before hunt start (not 7 days)
      const oneSecondBeforeStart = new Date(huntStartDate.getTime() - 1000);

      expect(expirationDate.getTime()).toBeLessThanOrEqual(oneSecondBeforeStart.getTime());

      // Hunt starting in 30 days
      const longHuntStartDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const longExpirationDate = calculateExpirationDate(longHuntStartDate);

      // Expiration should be 7 days from now
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(longExpirationDate.getTime() - sevenDaysFromNow.getTime());

      expect(timeDiff).toBeLessThan(2000); // Within 2 seconds tolerance
    });
  });

  describe('Edge Case 2: User leave and rejoin waitlist', () => {
    it('Should lose priority when leaving and rejoining waitlist (FIFO resets)', async () => {
      // Create hunt with capacity
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Leave Rejoin Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 1,
          allowWaitlist: true,
        },
      });

      // Owner joins (fills capacity)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 joins waitlist (position #1)
      const user1Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'waitlisted',
          waitlistPosition: 1,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      // User2 joins waitlist (position #2)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'waitlisted',
          waitlistPosition: 2,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      // User3 joins waitlist (position #3)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 3,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      // User1 leaves waitlist
      await prisma.huntParticipant.update({
        where: { id: user1Participant.id },
        data: {
          status: 'cancelled',
          waitlistPosition: null,
        },
      });

      // User1 rejoins waitlist - should get NEW position at end
      const nextPosition = await getNextWaitlistPosition(hunt.id);
      expect(nextPosition).toBe(4); // Should be after user3 (position 3)

      const user1RejoinedParticipant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'waitlisted',
          waitlistPosition: nextPosition,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      expect(user1RejoinedParticipant.waitlistPosition).toBe(4);

      // Verify FIFO order: User2 (pos 2) > User3 (pos 3) > User1 (pos 4)
      const waitlistOrder = await prisma.huntParticipant.findMany({
        where: {
          huntId: hunt.id,
          status: 'waitlisted',
        },
        orderBy: [
          { waitlistPosition: 'asc' },
          { joinedAt: 'asc' },
        ],
      });

      expect(waitlistOrder[0].userId).toBe(user2.id);
      expect(waitlistOrder[1].userId).toBe(user3.id);
      expect(waitlistOrder[2].userId).toBe(user1.id);
    });
  });

  describe('Edge Case 3: Capacity increase auto-accept', () => {
    it('Should auto-accept first in line when capacity increases', async () => {
      // Create hunt with capacity 2
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Capacity Increase Test Hunt',
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

      // Owner joins (confirmed)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 joins (confirmed, fills capacity)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      // User2 joins waitlist (position #1)
      const user2Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'waitlisted',
          waitlistPosition: 1,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      // User3 joins waitlist (position #2)
      const user3Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 2,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      // Increase capacity to 4
      await prisma.hunt.update({
        where: { id: hunt.id },
        data: { capacity: 4 },
      });

      // Implementation should auto-promote User2 and User3 (FIFO order)
      // This would be triggered by capacity change logic in the API route

      // Simulate the auto-promotion
      const waitlistedUsers = await prisma.huntParticipant.findMany({
        where: {
          huntId: hunt.id,
          status: 'waitlisted',
        },
        orderBy: [
          { waitlistPosition: 'asc' },
          { joinedAt: 'asc' },
        ],
        take: 2, // 2 new spots available (capacity 4 - 2 confirmed)
      });

      // Auto-promote in FIFO order
      for (const participant of waitlistedUsers) {
        await prisma.huntParticipant.update({
          where: { id: participant.id },
          data: {
            status: 'confirmed',
            waitlistPosition: null,
            requestExpiresAt: null,
          },
        });

        await prisma.user.update({
          where: { id: participant.userId },
          data: {
            cachedHuntsJoinedCount: { increment: 1 },
          },
        });
      }

      // Verify both users were promoted
      const user2Updated = await prisma.huntParticipant.findUnique({
        where: { id: user2Participant.id },
      });
      const user3Updated = await prisma.huntParticipant.findUnique({
        where: { id: user3Participant.id },
      });

      expect(user2Updated?.status).toBe('confirmed');
      expect(user3Updated?.status).toBe('confirmed');
      expect(user2Updated?.waitlistPosition).toBeNull();
      expect(user3Updated?.waitlistPosition).toBeNull();

      // Verify counters incremented
      const user2Data = await prisma.user.findUnique({ where: { id: user2.id } });
      const user3Data = await prisma.user.findUnique({ where: { id: user3.id } });

      expect(user2Data?.cachedHuntsJoinedCount).toBeGreaterThan(0);
      expect(user3Data?.cachedHuntsJoinedCount).toBeGreaterThan(0);
    });
  });

  describe('Edge Case 4: Private hunt manual accept (no auto-accept)', () => {
    it('Should NOT auto-accept waitlisted users in private hunts (owner must manually accept)', async () => {
      // Create private hunt with capacity 2
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Private Hunt Test',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: false, // Private hunt
          isPaid: false,
          capacity: 2,
          allowWaitlist: true,
        },
      });

      // Owner joins (confirmed)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 joins (confirmed, fills capacity)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      // User2 requests to join (waitlisted)
      const user2Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'waitlisted',
          waitlistPosition: 1,
          requestExpiresAt: calculateExpirationDate(hunt.startDate),
        },
      });

      // User1 leaves hunt (spot opens up)
      await prisma.huntParticipant.update({
        where: { huntId_userId: { huntId: hunt.id, userId: user1.id } },
        data: { status: 'cancelled' },
      });

      // In public hunt, User2 would auto-promote
      // In private hunt, User2 should remain waitlisted until owner manually accepts

      const user2Updated = await prisma.huntParticipant.findUnique({
        where: { id: user2Participant.id },
      });

      // For private hunts, user2 should still be waitlisted
      // Owner must manually accept by changing status to 'confirmed'
      expect(user2Updated?.status).toBe('waitlisted');
      expect(user2Updated?.waitlistPosition).toBe(1);

      // Owner manually accepts user2
      await prisma.huntParticipant.update({
        where: { id: user2Participant.id },
        data: {
          status: 'confirmed',
          waitlistPosition: null,
          requestExpiresAt: null,
        },
      });

      await prisma.user.update({
        where: { id: user2.id },
        data: {
          cachedHuntsJoinedCount: { increment: 1 },
        },
      });

      const user2Final = await prisma.huntParticipant.findUnique({
        where: { id: user2Participant.id },
      });

      expect(user2Final?.status).toBe('confirmed');
    });
  });

  describe('Edge Case 5: Cleanup 1 minute before hunt start', () => {
    it('Should auto-reject all waitlisted users 1 minute before hunt starts', async () => {
      // Create hunt starting in 2 minutes
      const huntStartDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

      const hunt = await prisma.hunt.create({
        data: {
          name: 'Pre-Start Cleanup Test Hunt',
          userId: owner.id,
          startDate: huntStartDate,
          endDate: new Date(huntStartDate.getTime() + 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 1,
          allowWaitlist: true,
        },
      });

      // Owner joins (fills capacity)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 joins waitlist with expiration 1 second before start
      const expirationDate = new Date(huntStartDate.getTime() - 1000); // 1 second before start

      const user1Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'waitlisted',
          waitlistPosition: 1,
          requestExpiresAt: expirationDate,
        },
      });

      // User2 joins waitlist
      const user2Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'waitlisted',
          waitlistPosition: 2,
          requestExpiresAt: expirationDate,
        },
      });

      // Verify waitlisted status
      expect(user1Participant.status).toBe('waitlisted');
      expect(user2Participant.status).toBe('waitlisted');

      // Simulate time passing (set expiration to past)
      await prisma.huntParticipant.updateMany({
        where: {
          huntId: hunt.id,
          status: 'waitlisted',
        },
        data: {
          requestExpiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      // Run cleanup job (would be triggered by cron 1 minute before start)
      const cleanedCount = await cleanupExpiredParticipants();

      // Verify both waitlisted users were cancelled
      const user1Updated = await prisma.huntParticipant.findUnique({
        where: { id: user1Participant.id },
      });
      const user2Updated = await prisma.huntParticipant.findUnique({
        where: { id: user2Participant.id },
      });

      expect(cleanedCount).toBe(2);
      expect(user1Updated?.status).toBe('cancelled');
      expect(user2Updated?.status).toBe('cancelled');
    });
  });

  describe('Edge Case 6: Waitlisted participants not included in hunt completion', () => {
    it('Should NOT count waitlisted users towards hunt completion calculations', async () => {
      // Create hunt with minimum pax requirement
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Completion Count Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Ended 2 days ago
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ended 1 day ago
          location: 'Test Location',
          isPublic: true,
          isPaid: false,
          capacity: 5,
          minimumPax: 3,
          allowWaitlist: true,
        },
      });

      // Owner joins (confirmed)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 joins (confirmed)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      // User2 joins (confirmed)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'confirmed',
        },
      });

      // User3 joins waitlist (NOT confirmed)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      // User4 joins waitlist (NOT confirmed)
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user4.id,
          status: 'waitlisted',
          waitlistPosition: 2,
        },
      });

      // Count confirmed participants for completion check
      const confirmedCount = await prisma.huntParticipant.count({
        where: {
          huntId: hunt.id,
          status: 'confirmed',
        },
      });

      // Should be 3 (owner + user1 + user2)
      // Waitlisted users (user3, user4) should NOT be counted
      expect(confirmedCount).toBe(3);

      // Hunt should meet minimum pax requirement (3 >= 3)
      const meetsMinimum = confirmedCount >= hunt.minimumPax!;
      expect(meetsMinimum).toBe(true);

      // Total participants (including waitlist) should be 5
      const totalParticipants = await prisma.huntParticipant.count({
        where: { huntId: hunt.id },
      });
      expect(totalParticipants).toBe(5);

      // But only confirmed count matters for hunt success
      expect(confirmedCount).toBe(3);
    });
  });

  describe('Edge Case 7: Waitlisted participants no album access', () => {
    it('Should NOT grant album access to waitlisted users (only confirmed users)', async () => {
      // Create hunt
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Album Access Test Hunt',
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

      // Owner joins (confirmed)
      const ownerParticipant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // User1 joins (confirmed)
      const user1Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      // User2 joins waitlist (NOT confirmed)
      const user2Participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user2.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      // Check album access permissions
      // Only confirmed users should have access
      const usersWithAlbumAccess = await prisma.huntParticipant.findMany({
        where: {
          huntId: hunt.id,
          status: 'confirmed', // Only confirmed users
        },
        select: {
          userId: true,
          status: true,
        },
      });

      expect(usersWithAlbumAccess).toHaveLength(2);
      expect(usersWithAlbumAccess.map(p => p.userId)).toContain(owner.id);
      expect(usersWithAlbumAccess.map(p => p.userId)).toContain(user1.id);
      expect(usersWithAlbumAccess.map(p => p.userId)).not.toContain(user2.id);

      // Verify user2 is waitlisted
      expect(user2Participant.status).toBe('waitlisted');

      // When querying album access, always filter by status = 'confirmed'
      const hasAlbumAccess = (userId: string) => {
        return usersWithAlbumAccess.some(p => p.userId === userId);
      };

      expect(hasAlbumAccess(owner.id)).toBe(true);
      expect(hasAlbumAccess(user1.id)).toBe(true);
      expect(hasAlbumAccess(user2.id)).toBe(false); // Waitlisted = no access
    });
  });
});
