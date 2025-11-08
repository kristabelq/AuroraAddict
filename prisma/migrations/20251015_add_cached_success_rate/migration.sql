-- Add cached success rate fields to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "cachedCompletedHuntsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "cachedSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "cachedLastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add comment explaining the fields
COMMENT ON COLUMN "User"."cachedCompletedHuntsCount" IS 'Total COMPLETED hunts (created or joined) - excludes ongoing/upcoming';
COMMENT ON COLUMN "User"."cachedSuccessRate" IS 'Average success rate from COMPLETED hunts only - prevents artificial drops from joining new hunts';
COMMENT ON COLUMN "User"."cachedLastUpdated" IS 'Timestamp of last cache update - used for debugging and monitoring';
