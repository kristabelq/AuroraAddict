-- Manual Migration: Add Business Verification Fields
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql

-- Add missing business verification columns to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "businessDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "businessEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "businessCity" TEXT,
  ADD COLUMN IF NOT EXISTS "businessCountry" TEXT DEFAULT 'Finland',
  ADD COLUMN IF NOT EXISTS "businessLicenseUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "idDocumentUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "verificationSubmittedAt" TIMESTAMP(3);

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'User'
AND column_name IN (
  'businessDescription',
  'businessEmail',
  'businessCity',
  'businessCountry',
  'businessLicenseUrl',
  'idDocumentUrl',
  'verificationSubmittedAt'
)
ORDER BY column_name;
