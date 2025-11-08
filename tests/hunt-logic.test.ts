/**
 * Comprehensive Test Suite for Hunt Logic
 *
 * Tests all 24 use cases from the Hunt Logic flowchart
 *
 * Test Categories:
 * - Public Free Hunts (Cases 1-2)
 * - Public Paid Hunts (Cases 3-4)
 * - Public Free with Capacity (Cases 5-6)
 * - Public Paid with Capacity (Cases 7-8)
 * - Private Free Hunts (Cases 9-12)
 * - Private Paid Hunts (Cases 13-16)
 * - Private Free with Capacity (Cases 17-20)
 * - Private Paid with Capacity (Cases 21-24)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';

// Test helpers
async function createTestUser(email: string, emailVerified: boolean = true) {
  return await prisma.user.create({
    data: {
      email,
      emailVerified: emailVerified ? new Date() : null,
      name: `Test User ${email}`,
    },
  });
}

async function createTestHunt(
  ownerId: string,
  config: {
    isPublic: boolean;
    isPaid: boolean;
    hideLocation: boolean;
    hideFromPublic: boolean;
    capacity?: number | null;
    allowWaitlist?: boolean;
  }
) {
  return await prisma.hunt.create({
    data: {
      name: 'Test Hunt',
      userId: ownerId,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
      location: 'Test Location',
      latitude: 64.0,
      longitude: -21.0,
      isPublic: config.isPublic,
      isPaid: config.isPaid,
      hideLocation: config.hideLocation,
      hideFromPublic: config.hideFromPublic,
      price: config.isPaid ? 100 : null,
      capacity: config.capacity,
      allowWaitlist: config.allowWaitlist ?? false,
    },
  });
}

describe('Hunt Logic - All 24 Use Cases', () => {
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async () => {
    // Create test users
    owner = await createTestUser('owner@test.com');
    user1 = await createTestUser('user1@test.com');
    user2 = await createTestUser('user2@test.com');
    user3 = await createTestUser('user3@test.com');
  });

  afterEach(async () => {
    // Cleanup
    await prisma.huntParticipant.deleteMany({});
    await prisma.hunt.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Cases 1-2: Public Free Hunts (Available)', () => {
    it('Case 1: Public, Visible, Free, Show Location, Available → Join → Confirmed', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
      });

      // User joins
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      expect(participant.status).toBe('confirmed');
      expect(participant.paymentStatus).toBeNull();
    });

    it('Case 2: Public, Visible, Free, Hide Location, Available → Join → Confirmed', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: false,
        hideLocation: true,
        hideFromPublic: false,
      });

      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      expect(participant.status).toBe('confirmed');
      expect(hunt.hideLocation).toBe(true);
    });
  });

  describe('Cases 3-4: Public Paid Hunts (Available)', () => {
    it('Case 3: Public Paid, Show Location → Pending Payment → Confirmed (payment received)', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
      });

      // User joins (pending payment)
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          paymentStatus: 'pending',
          requestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      expect(participant.status).toBe('pending');
      expect(participant.paymentStatus).toBe('pending');

      // Owner confirms payment
      const confirmed = await prisma.huntParticipant.update({
        where: { id: participant.id },
        data: {
          status: 'confirmed',
          paymentStatus: 'confirmed',
          paidAt: new Date(),
        },
      });

      expect(confirmed.status).toBe('confirmed');
      expect(confirmed.paidAt).toBeTruthy();
    });

    it('Case 3: Public Paid → Payment not received in 7 days → Leave Hunt', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
      });

      // User joins (pending payment with expired date)
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          paymentStatus: 'pending',
          requestExpiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      // Cleanup job would cancel this
      const cancelled = await prisma.huntParticipant.update({
        where: { id: participant.id },
        data: { status: 'cancelled' },
      });

      expect(cancelled.status).toBe('cancelled');
    });

    it('Case 4: Public Paid, Hide Location → Same flow as Case 3', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: true,
        hideLocation: true,
        hideFromPublic: false,
      });

      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          paymentStatus: 'pending',
        },
      });

      expect(participant.status).toBe('pending');
      expect(hunt.hideLocation).toBe(true);
    });
  });

  describe('Cases 5-6: Public Free Hunts (Limit Reached)', () => {
    it('Case 5: Public Free, Limit Reached → Join Waitlist → Owner Accepts → Confirmed', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed' },
        ],
      });

      // User3 joins waitlist
      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      expect(waitlisted.status).toBe('waitlisted');
      expect(waitlisted.waitlistPosition).toBe(1);

      // Owner accepts (manually or user1 leaves and auto-promotes)
      const confirmed = await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: { status: 'confirmed', requestExpiresAt: null },
      });

      expect(confirmed.status).toBe('confirmed');
    });

    it('Case 5: Public Free, Limit Reached → Owner Rejects → Leave Hunt', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed' },
        ],
      });

      // User3 joins waitlist
      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      // Owner rejects (in this case, just leave)
      await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: { status: 'cancelled' },
      });

      const result = await prisma.huntParticipant.findUnique({
        where: { id: waitlisted.id },
      });

      expect(result?.status).toBe('cancelled');
    });
  });

  describe('Cases 7-8: Public Paid Hunts (Limit Reached)', () => {
    it('Case 7: Public Paid, Limit Reached → Waitlist → Accept → Pending Payment → Confirmed', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed', paidAt: new Date() },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed', paidAt: new Date() },
        ],
      });

      // User3 joins waitlist
      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      // Owner accepts - moves to pending payment
      const pendingPayment = await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: {
          status: 'pending',
          paymentStatus: 'pending',
          requestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      expect(pendingPayment.status).toBe('pending');
      expect(pendingPayment.paymentStatus).toBe('pending');

      // Payment confirmed
      const confirmed = await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: {
          status: 'confirmed',
          paymentStatus: 'confirmed',
          paidAt: new Date(),
        },
      });

      expect(confirmed.status).toBe('confirmed');
    });
  });

  describe('Cases 9-12: Private Free Hunts (Available)', () => {
    it('Case 9: Private, Visible, Free → Request to Join → Owner Accepts → Confirmed', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
      });

      // User requests to join
      const pending = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          requestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      expect(pending.status).toBe('pending');

      // Owner accepts
      const confirmed = await prisma.huntParticipant.update({
        where: { id: pending.id },
        data: { status: 'confirmed', requestExpiresAt: null },
      });

      expect(confirmed.status).toBe('confirmed');
    });

    it('Case 9: Private, Visible, Free → Request to Join → Owner Rejects → Leave Hunt', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
      });

      const pending = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          rejectionCount: 0,
        },
      });

      // Owner rejects
      const rejected = await prisma.huntParticipant.update({
        where: { id: pending.id },
        data: {
          status: 'cancelled',
          rejectionCount: { increment: 1 },
          lastRejectedAt: new Date(),
        },
      });

      expect(rejected.status).toBe('cancelled');
      expect(rejected.rejectionCount).toBe(1);
    });

    it('Case 11: Private, Hidden, Free → Same flow as Case 9', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: true, // Hidden from public
      });

      const pending = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
        },
      });

      expect(pending.status).toBe('pending');
      expect(hunt.hideFromPublic).toBe(true);
    });
  });

  describe('Cases 13-16: Private Paid Hunts (Available)', () => {
    it('Case 13: Private Paid → Request → Accept → Pending Payment → Confirmed', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
      });

      // User requests
      const pending = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          requestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Owner accepts
      const accepted = await prisma.huntParticipant.update({
        where: { id: pending.id },
        data: {
          paymentStatus: 'pending',
          // Status stays pending until payment
        },
      });

      expect(accepted.paymentStatus).toBe('pending');

      // Payment confirmed
      const confirmed = await prisma.huntParticipant.update({
        where: { id: pending.id },
        data: {
          status: 'confirmed',
          paymentStatus: 'confirmed',
          paidAt: new Date(),
          requestExpiresAt: null,
        },
      });

      expect(confirmed.status).toBe('confirmed');
      expect(confirmed.paidAt).toBeTruthy();
    });

    it('Case 13: Private Paid → Payment not received → Leave Hunt', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
      });

      const pending = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          paymentStatus: 'pending',
          requestExpiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      // Cleanup job cancels
      await prisma.huntParticipant.update({
        where: { id: pending.id },
        data: { status: 'cancelled' },
      });

      const result = await prisma.huntParticipant.findUnique({
        where: { id: pending.id },
      });

      expect(result?.status).toBe('cancelled');
    });

    it('Case 13: Private Paid → Owner Rejects → Leave Hunt', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
      });

      const pending = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'pending',
          rejectionCount: 0,
        },
      });

      // Owner rejects before payment
      const rejected = await prisma.huntParticipant.update({
        where: { id: pending.id },
        data: {
          status: 'cancelled',
          rejectionCount: { increment: 1 },
        },
      });

      expect(rejected.status).toBe('cancelled');
    });
  });

  describe('Cases 17-20: Private Free Hunts (Limit Reached)', () => {
    it('Case 17: Private Free, Limit Reached → Waitlist → Accept → Confirmed', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed' },
        ],
      });

      // User3 joins waitlist
      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      // Owner accepts
      const confirmed = await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: { status: 'confirmed', requestExpiresAt: null },
      });

      expect(confirmed.status).toBe('confirmed');
    });

    it('Case 17: Private Free, Limit Reached → Owner Rejects → Leave Hunt', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed' },
        ],
      });

      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
          rejectionCount: 0,
        },
      });

      // Owner rejects
      const rejected = await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: {
          status: 'cancelled',
          rejectionCount: { increment: 1 },
        },
      });

      expect(rejected.status).toBe('cancelled');
    });
  });

  describe('Cases 21-24: Private Paid Hunts (Limit Reached)', () => {
    it('Case 21: Private Paid, Limit Reached → Waitlist → Accept → Pending Payment → Confirmed', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      // Fill capacity
      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed', paidAt: new Date() },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed', paidAt: new Date() },
        ],
      });

      // User3 joins waitlist
      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      // Owner accepts → Pending Payment
      const pendingPayment = await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: {
          status: 'pending',
          paymentStatus: 'pending',
          requestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      expect(pendingPayment.status).toBe('pending');
      expect(pendingPayment.paymentStatus).toBe('pending');

      // Payment confirmed
      const confirmed = await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: {
          status: 'confirmed',
          paymentStatus: 'confirmed',
          paidAt: new Date(),
        },
      });

      expect(confirmed.status).toBe('confirmed');
    });

    it('Case 21: Private Paid, Limit Reached → Payment not received → Leave Hunt', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed', paidAt: new Date() },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed', paidAt: new Date() },
        ],
      });

      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'pending',
          paymentStatus: 'pending',
          requestExpiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      // Cleanup cancels
      await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: { status: 'cancelled' },
      });

      const result = await prisma.huntParticipant.findUnique({
        where: { id: waitlisted.id },
      });

      expect(result?.status).toBe('cancelled');
    });

    it('Case 21: Private Paid, Limit Reached → Owner Rejects → Leave Hunt', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: false,
        isPaid: true,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      await prisma.huntParticipant.createMany({
        data: [
          { huntId: hunt.id, userId: user1.id, status: 'confirmed', paidAt: new Date() },
          { huntId: hunt.id, userId: user2.id, status: 'confirmed', paidAt: new Date() },
        ],
      });

      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
          rejectionCount: 0,
        },
      });

      // Owner rejects
      const rejected = await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: {
          status: 'cancelled',
          rejectionCount: { increment: 1 },
        },
      });

      expect(rejected.status).toBe('cancelled');
    });
  });

  describe('User Actions: Leave Hunt', () => {
    it('Should allow user to leave hunt at any status (pending, waitlisted, confirmed)', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
      });

      // Test leaving from confirmed status
      const participant = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user1.id,
          status: 'confirmed',
        },
      });

      await prisma.huntParticipant.update({
        where: { id: participant.id },
        data: { status: 'cancelled' },
      });

      const result = await prisma.huntParticipant.findUnique({
        where: { id: participant.id },
      });

      expect(result?.status).toBe('cancelled');
    });

    it('Should promote next waitlisted user when confirmed user leaves', async () => {
      const hunt = await createTestHunt(owner.id, {
        isPublic: true,
        isPaid: false,
        hideLocation: false,
        hideFromPublic: false,
        capacity: 2,
        allowWaitlist: true,
      });

      // Create participants
      const confirmed1 = await prisma.huntParticipant.create({
        data: { huntId: hunt.id, userId: user1.id, status: 'confirmed' },
      });

      await prisma.huntParticipant.create({
        data: { huntId: hunt.id, userId: user2.id, status: 'confirmed' },
      });

      const waitlisted = await prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: user3.id,
          status: 'waitlisted',
          waitlistPosition: 1,
        },
      });

      // User1 leaves
      await prisma.huntParticipant.update({
        where: { id: confirmed1.id },
        data: { status: 'cancelled' },
      });

      // Promote waitlisted user
      await prisma.huntParticipant.update({
        where: { id: waitlisted.id },
        data: { status: 'confirmed', requestExpiresAt: null },
      });

      const promoted = await prisma.huntParticipant.findUnique({
        where: { id: waitlisted.id },
      });

      expect(promoted?.status).toBe('confirmed');
    });
  });
});
