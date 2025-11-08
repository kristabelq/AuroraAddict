-- Add cancellationPolicy column to Hunt table
ALTER TABLE "Hunt" ADD COLUMN IF NOT EXISTS "cancellationPolicy" TEXT;
