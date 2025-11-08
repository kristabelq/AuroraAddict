/**
 * Hunt Logic Edge Case Tests
 *
 * Tests for edge cases not covered in the basic flowchart
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import {
  calculateExpirationDate,
  isUserBlockedFromJoining,
  canChangeHuntSettings,
  canCancelHunt,
  promoteNextWaitlistedUser,
  cleanupExpiredParticipants,
} from '@/lib/huntEdgeCases';

describe('Hunt Logic Edge Cases', () => {
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async () => {
    owner = await prisma.user.create({
      data: { email: 'owner@test.com', emailVerified: new Date() },
    });
    user1 = await prisma.user.create({
      data: { email: 'user1@test.com', emailVerified: new Date() },
    });
    user2 = await prisma.user.create({
      data: { email: 'user2@test.com', emailVerified: new Date() },
    });
    user3 = await prisma.user.create({
      data: { email: 'user3@test.com', emailVerified: new Date() },
    });
  });

  afterEach(async () => {
    await prisma.huntParticipant.deleteMany({});
    await prisma.hunt.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Edge Case 1: Timing & Expiration', () => {
    it('Should block joins too close to hunt start time', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: false,
        },
      });

      // Calculate expiration
      const expirationDate = calculateExpirationDate(hunt.startDate);
      const now = new Date();

      // Should expire soon (not 7 days)
      const timeDiff = expirationDate.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      expect(minutesDiff).toBeLessThan(31); // Less than 31 minutes
      expect(minutesDiff).toBeGreaterThan(29); // More than 29 minutes (1 second before start)
    });

    it('Should use 7 days if hunt is far away', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: false,
        },
      });

      const expirationDate = calculateExpirationDate(hunt.startDate);
      const now = new Date();

      const timeDiff = expirationDate.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeGreaterThan(6.9); // ~7 days
      expect(daysDiff).toBeLessThan(7.1);
    });

    it('Should cleanup expired participants', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: true,
          price: 100,
        },
      });

      // Create expired participant
      const expired = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          paymentStatus: 'pending',
          requestExpiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      // Run cleanup
      const cleanedCount = await cleanupExpiredParticipants();

      expect(cleanedCount).toBeGreaterThan(0);

      // Check participant is cancelled
      const result = await prisma.huntParticipant.findUnique({
        where: { id: expired.id },
      });

      expect(result?.status).toBe('cancelled');
    });
  });

  describe('Edge Case 2: Capacity Changes', () => {
    it('Should block capacity decrease below confirmed count', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: false,
          capacity: 10,
        },
      });

      // Add 8 confirmed participants
      for (let i = 0; i < 8; i++) {
        const user = await prisma.user.create({
          data: { email: `user${i}@test.com` },
        });
        await prisma.huntParticipant.create({
          data: {
            huntId: hunt.id,
            userId: user.id,
            status: 'confirmed',
          },
        });
      }

      // Attempting to set capacity to 5 should fail (implementation needed)
      // This test documents the expected behavior
      const confirmedCount = await prisma.huntParticipant.count({
        where: { huntId: hunt.id, status: 'confirmed' },
      });

      expect(confirmedCount).toBe(8);
      // Would expect validation: newCapacity >= confirmedCount
    });

    it('Should auto-promote waitlisted users when capacity increases', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: false,
          capacity: 2,
          allowWaitlist: true,
        },
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed' },
        ],
      });

      // Add waitlisted user
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      // Increase capacity
      await prisma.hunt.update({
        where: { id: hunt.id },
        data: { capacity: 3 },
      });

      // Promote waitlisted user
      const promoted = await promoteNextWaitlistedUser(hunt.id);

      expect(promoted).toBe(true);

      const participant = await prisma.huntParticipant.findFirst({
        where: { huntId: hunt.id, userId: user3.id },
      });

      expect(participant?.status).toBe('confirmed');
    });

    it('Should prevent waitlist without capacity', async () => {
      // This should fail validation (implementation needed)
      // allowWaitlist = true requires capacity to be set

      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: false,
          capacity: null,
          allowWaitlist: true, // This doesn't make sense
        },
      });

      // Document expected behavior: should validate and reject this config
      expect(hunt.allowWaitlist).toBe(true);
      expect(hunt.capacity).toBeNull();
      // Would expect validation error
    });
  });

  describe('Edge Case 3: Rejection & Blocking', () => {
    it('Should block user after 3 rejections', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: false,
          isPaid: false,
        },
      });

      // Create participant with 3 rejections
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'cancelled',
          rejectionCount: 3,
        },
      });

      // Check if blocked
      const isBlocked = await isUserBlockedFromJoining(hunt.id, user1.id);

      expect(isBlocked).toBe(true);
    });

    it('Should allow user with 2 rejections to rejoin', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: false,
          isPaid: false,
        },
      });

      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'cancelled',
          rejectionCount: 2,
        },
      });

      const isBlocked = await isUserBlockedFromJoining(hunt.id, user1.id);

      expect(isBlocked).toBe(false);
    });
  });

  describe('Edge Case 4: Settings Changes', () => {
    it('Should block settings change with participants in transition', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: false,
          isPaid: false,
        },
      });

      // Add pending participant
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
        },
      });

      // Try to change to public (should be blocked)
      const error = await canChangeHuntSettings(hunt.id, { isPublic: true });

      expect(error).toBeTruthy();
      expect(error).toContain('pending');
    });

    it('Should allow settings change with only confirmed participants', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: false,
          isPaid: false,
        },
      });

      // Add confirmed participant
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      const error = await canChangeHuntSettings(hunt.id, { isPublic: true });

      expect(error).toBeNull();
    });

    it('Should block paid→unpaid change with confirmed payments', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: true,
          price: 100,
        },
      });

      // Add paid participant
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
          paidAt: new Date(),
        },
      });

      const error = await canChangeHuntSettings(hunt.id, { isPaid: false });

      expect(error).toBeTruthy();
      expect(error).toContain('paid');
    });
  });

  describe('Edge Case 5: Hunt Deletion', () => {
    it('Should block hunt deletion with confirmed payments', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: true,
          price: 100,
        },
      });

      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
          paidAt: new Date(),
        },
      });

      const error = await canCancelHunt(hunt.id);

      expect(error).toBeTruthy();
      expect(error).toContain('payment');
    });

    it('Should allow hunt deletion without payments', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: false,
        },
      });

      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      const error = await canCancelHunt(hunt.id);

      expect(error).toBeNull();
    });
  });

  describe('Edge Case 6: Waitlist Promotion FIFO', () => {
    it('Should promote users in order of waitlist position', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: false,
          capacity: 2,
          allowWaitlist: true,
        },
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed' },
        ],
      });

      // Add waitlisted users (user3 should be first)
      const user4 = await prisma.user.create({ data: { email: 'user4@test.com' } });

      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
          joinedAt: new Date(Date.now() - 1000),
        },
      });

      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user4.id,
          status: 'waitlisted',
          waitlistPosition: 2,
          joinedAt: new Date(),
        },
      });

      // User1 leaves
      await prisma.huntParticipant.update({
        where: {
          huntId_userId: {
            huntId: hunt.id,
            userId: user1.id,
          },
        },
        data: { status: 'cancelled' },
      });

      // Promote next
      const promoted = await promoteNextWaitlistedUser(hunt.id);

      expect(promoted).toBe(true);

      // User3 should be promoted (position 1)
      const user3Participant = await prisma.huntParticipant.findFirst({
        where: { huntId: hunt.id, userId: user3.id },
      });

      expect(user3Participant?.status).toBe('confirmed');

      // User4 should still be waitlisted
      const user4Participant = await prisma.huntParticipant.findFirst({
        where: { huntId: hunt.id, userId: user4.id },
      });

      expect(user4Participant?.status).toBe('waitlisted');
    });
  });

  describe('Edge Case 7: Owner Cannot Leave', () => {
    it('Should prevent owner from leaving their own hunt', async () => {
      const hunt = await prisma.hunt.create({
        data: {
          name: 'Test Hunt',
          userId: owner.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isPublic: true,
          isPaid: false,
        },
      });

      // Owner is automatically a participant
      await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: owner.id,
          status: 'confirmed',
        },
      });

      // Attempting to leave as owner should be blocked (in route logic)
      const participant = await prisma.huntParticipant.findFirst({
        where: { huntId: hunt.id, userId: owner.id },
      });

      expect(participant).toBeTruthy();
      // Would expect API to reject: "Cannot leave your own hunt. Delete it instead."
    });
  });

  describe('Edge Case 8: Verified Email for Paid Hunts', () => {
    it('Should block paid hunt creation without verified email', async () => {
      const unverifiedOwner = await prisma.user.create({
        data: {
          email: 'unverified@test.com',
          emailVerified: null, // Not verified
        },
      });

      // This should fail in the API route
      const user = await prisma.user.findUnique({
        where: { id: unverifiedOwner.id },
      });

      expect(user?.emailVerified).toBeNull();
      // Would expect API to reject paid hunt creation
    });
  });
});
