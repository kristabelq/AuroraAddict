# Business Verification Setup

## Step 1: Add Database Columns

Go to your Supabase Dashboard → SQL Editor and run this:

```sql
-- Add missing business verification columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='User' AND column_name='businessDescription'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "businessDescription" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='User' AND column_name='businessEmail'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "businessEmail" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='User' AND column_name='businessCity'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "businessCity" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='User' AND column_name='businessCountry'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "businessCountry" TEXT DEFAULT 'Finland';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='User' AND column_name='businessLicenseUrl'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "businessLicenseUrl" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='User' AND column_name='idDocumentUrl'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "idDocumentUrl" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='User' AND column_name='verificationSubmittedAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "verificationSubmittedAt" TIMESTAMP(3);
    END IF;
END $$;

-- Verify columns were added
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
```

## Step 2: Seed Test Businesses

After the columns are added, run this in Supabase SQL Editor:

```sql
-- Seed Test Business Accounts

-- Arctic Adventures Levi (Tour Operator)
INSERT INTO "User" (
  id, name, email, username, "emailVerified",
  "userType", "businessName", "businessCategory", "businessDescription",
  "businessWebsite", "businessPhone", "businessEmail",
  "businessAddress", "businessCity", "businessCountry",
  "businessLicenseUrl", "idDocumentUrl",
  "verificationStatus", "verificationSubmittedAt", "verifiedAt", "verifiedBy",
  "onboardingComplete", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Arctic Adventures Levi',
  'test.arcticadventures@auroraaddict.test',
  'arcticadventureslevi',
  NOW(),
  'business',
  'Arctic Adventures Levi',
  'tour_operator',
  'Experience the magic of Lapland with our aurora hunting tours, husky sledding, and snowmobile adventures.',
  'https://www.arctictours.fi',
  '+358401234567',
  'info@arctictours.fi',
  'Levintie 1590',
  'Levi',
  'Finland',
  '/placeholder-business-license.pdf',
  '/placeholder-id-document.pdf',
  'verified',
  NOW(),
  NOW(),
  'system-seed',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  "userType" = 'business',
  "businessName" = 'Arctic Adventures Levi',
  "verificationStatus" = 'verified',
  "updatedAt" = NOW();

-- Northern Lights Village (Accommodation)
INSERT INTO "User" (
  id, name, email, username, "emailVerified",
  "userType", "businessName", "businessCategory", "businessDescription",
  "businessWebsite", "businessPhone", "businessEmail",
  "businessAddress", "businessCity", "businessCountry",
  "businessLicenseUrl", "idDocumentUrl",
  "verificationStatus", "verificationSubmittedAt", "verifiedAt", "verifiedBy",
  "onboardingComplete", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Northern Lights Village',
  'test.northernlightsvillage@auroraaddict.test',
  'northernlightsvillage',
  NOW(),
  'business',
  'Northern Lights Village',
  'accommodation',
  'Sleep under the northern lights in our luxury glass igloos.',
  'https://www.northernlightsvillage.fi',
  '+358501234568',
  'reservations@northernlightsvillage.fi',
  'Ounasjoentie 30',
  'Saariselkä',
  'Finland',
  '/placeholder-business-license.pdf',
  '/placeholder-id-document.pdf',
  'verified',
  NOW(),
  NOW(),
  'system-seed',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  "userType" = 'business',
  "businessName" = 'Northern Lights Village',
  "verificationStatus" = 'verified',
  "updatedAt" = NOW();

-- Lights Over Lapland (Photography)
INSERT INTO "User" (
  id, name, email, username, "emailVerified",
  "userType", "businessName", "businessCategory", "businessDescription",
  "businessWebsite", "businessPhone", "businessEmail",
  "businessAddress", "businessCity", "businessCountry",
  "businessLicenseUrl", "idDocumentUrl",
  "verificationStatus", "verificationSubmittedAt", "verifiedAt", "verifiedBy",
  "onboardingComplete", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Lights Over Lapland',
  'test.lightsoverlapland@auroraaddict.test',
  'lightsoverlapland',
  NOW(),
  'business',
  'Lights Over Lapland',
  'photography',
  'Professional aurora photography workshops and tours.',
  'https://www.lightsoverlapland.com',
  '+358451234569',
  'bookings@lightsoverlapland.com',
  'Lappeasuando 85',
  'Abisko',
  'Sweden',
  '/placeholder-business-license.pdf',
  '/placeholder-id-document.pdf',
  'verified',
  NOW(),
  NOW(),
  'system-seed',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  "userType" = 'business',
  "businessName" = 'Lights Over Lapland',
  "verificationStatus" = 'verified',
  "updatedAt" = NOW();

-- Restaurant Aanaar (Restaurant)
INSERT INTO "User" (
  id, name, email, username, "emailVerified",
  "userType", "businessName", "businessCategory", "businessDescription",
  "businessWebsite", "businessPhone", "businessEmail",
  "businessAddress", "businessCity", "businessCountry",
  "businessLicenseUrl", "idDocumentUrl",
  "verificationStatus", "verificationSubmittedAt", "verifiedAt", "verifiedBy",
  "onboardingComplete", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Restaurant Aanaar',
  'test.aanaar@auroraaddict.test',
  'restaurantaanaar',
  NOW(),
  'business',
  'Restaurant Aanaar',
  'restaurant',
  'Authentic Sámi cuisine featuring local ingredients.',
  'https://www.aanaar.fi',
  '+358161234570',
  'info@aanaar.fi',
  'Inarintie 40',
  'Inari',
  'Finland',
  '/placeholder-business-license.pdf',
  '/placeholder-id-document.pdf',
  'verified',
  NOW(),
  NOW(),
  'system-seed',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  "userType" = 'business',
  "businessName" = 'Restaurant Aanaar',
  "verificationStatus" = 'verified',
  "updatedAt" = NOW();

-- Harriniva Hotels & Safaris (Accommodation)
INSERT INTO "User" (
  id, name, email, username, "emailVerified",
  "userType", "businessName", "businessCategory", "businessDescription",
  "businessWebsite", "businessPhone", "businessEmail",
  "businessAddress", "businessCity", "businessCountry",
  "businessLicenseUrl", "idDocumentUrl",
  "verificationStatus", "verificationSubmittedAt", "verifiedAt", "verifiedBy",
  "onboardingComplete", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Harriniva Hotels & Safaris',
  'test.harriniva@auroraaddict.test',
  'harrinivahotels',
  NOW(),
  'business',
  'Harriniva Hotels & Safaris',
  'accommodation',
  'Family-run wilderness lodge offering aurora safaris.',
  'https://www.harriniva.fi',
  '+358401234571',
  'sales@harriniva.fi',
  'Harrinivantie 35',
  'Muonio',
  'Finland',
  '/placeholder-business-license.pdf',
  '/placeholder-id-document.pdf',
  'verified',
  NOW(),
  NOW(),
  'system-seed',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  "userType" = 'business',
  "businessName" = 'Harriniva Hotels & Safaris',
  "verificationStatus" = 'verified',
  "updatedAt" = NOW();

-- Arctic Gear Rovaniemi (Shop)
INSERT INTO "User" (
  id, name, email, username, "emailVerified",
  "userType", "businessName", "businessCategory", "businessDescription",
  "businessWebsite", "businessPhone", "businessEmail",
  "businessAddress", "businessCity", "businessCountry",
  "businessLicenseUrl", "idDocumentUrl",
  "verificationStatus", "verificationSubmittedAt", "verifiedAt", "verifiedBy",
  "onboardingComplete", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Arctic Gear Rovaniemi',
  'test.arcticgear@auroraaddict.test',
  'arcticgearrovaniemi',
  NOW(),
  'business',
  'Arctic Gear Rovaniemi',
  'shop',
  'Your one-stop shop for aurora hunting gear and photography equipment.',
  'https://www.arcticgear.fi',
  '+358161234572',
  'shop@arcticgear.fi',
  'Koskikatu 25',
  'Rovaniemi',
  'Finland',
  '/placeholder-business-license.pdf',
  '/placeholder-id-document.pdf',
  'verified',
  NOW(),
  NOW(),
  'system-seed',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  "userType" = 'business',
  "businessName" = 'Arctic Gear Rovaniemi',
  "verificationStatus" = 'verified',
  "updatedAt" = NOW();

-- Verify the test accounts were created
SELECT
  name,
  email,
  username,
  "businessName",
  "businessCategory",
  "businessCity",
  "businessCountry",
  "verificationStatus"
FROM "User"
WHERE email LIKE 'test.%@auroraaddict.test'
ORDER BY "businessCity";
```

## Step 3: Verify in Admin Dashboard

Visit: http://localhost:3002/admin/business-verifications

You should see 6 verified businesses:
- Arctic Adventures Levi (Tour Operator) - Levi
- Northern Lights Village (Accommodation) - Saariselkä
- Lights Over Lapland (Photography) - Abisko
- Restaurant Aanaar (Restaurant) - Inari
- Harriniva Hotels & Safaris (Accommodation) - Muonio
- Arctic Gear Rovaniemi (Shop) - Rovaniemi

## What We Built

Phase 2: Business Verification System is now complete!

### Features:
- ✅ User upgrade to business account form (/profile/business-upgrade)
- ✅ Document upload (business license + ID)
- ✅ Admin verification queue (/admin/business-verifications)
- ✅ Approve/reject verification with reason
- ✅ Status-based UI (pending, verified, rejected)
- ✅ 6 test businesses across different categories

### Test the Flow:
1. Go to /admin/business-verifications to see the verified businesses
2. Click any business to see full details and documents
3. Test creating a new business verification from /profile/edit
