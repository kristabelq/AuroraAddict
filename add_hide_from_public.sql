-- Add hideFromPublic column to Hunt table if it doesn't exist
ALTER TABLE "Hunt"
ADD COLUMN IF NOT EXISTS "hideFromPublic" BOOLEAN NOT NULL DEFAULT false;
