-- Add allowWaitlist column to Hunt table
ALTER TABLE "Hunt" ADD COLUMN IF NOT EXISTS "allowWaitlist" BOOLEAN NOT NULL DEFAULT false;
