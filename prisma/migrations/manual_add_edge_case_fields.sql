-- Manual migration to add edge case tracking fields
-- Run this after deploying the code changes

-- Add fields to HuntParticipant table
ALTER TABLE "HuntParticipant"
  ADD COLUMN IF NOT EXISTS "requestExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isPaymentProcessing" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastRejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "waitlistPosition" INTEGER;

-- Add field to Hunt table
ALTER TABLE "Hunt"
  ADD COLUMN IF NOT EXISTS "hasParticipantsInTransition" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "HuntParticipant_requestExpiresAt_idx" ON "HuntParticipant"("requestExpiresAt");
CREATE INDEX IF NOT EXISTS "HuntParticipant_waitlistPosition_idx" ON "HuntParticipant"("waitlistPosition");

-- Update paymentStatus field to allow null for free hunts (if needed)
-- This might already be nullable, but ensuring it
ALTER TABLE "HuntParticipant"
  ALTER COLUMN "paymentStatus" DROP NOT NULL;
