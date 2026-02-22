-- Migration: Add SpaceWeatherCache table
-- Run this in Supabase SQL Editor

CREATE TABLE "SpaceWeatherCache" (
    "id" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceWeatherCache_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX "SpaceWeatherCache_dataType_source_key" ON "SpaceWeatherCache"("dataType", "source");

-- Create indexes for performance
CREATE INDEX "SpaceWeatherCache_dataType_idx" ON "SpaceWeatherCache"("dataType");
CREATE INDEX "SpaceWeatherCache_expiresAt_idx" ON "SpaceWeatherCache"("expiresAt");
