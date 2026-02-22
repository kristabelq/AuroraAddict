-- Migration: Add SpaceWeatherCache and CMERecord tables
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

-- CMERecord table for historical tracking and analytics
CREATE TABLE "CMERecord" (
    "id" TEXT NOT NULL,
    "activityID" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "sourceLocation" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "halfAngle" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "type" TEXT,
    "isEarthDirected" BOOLEAN NOT NULL DEFAULT false,
    "isMostAccurate" BOOLEAN NOT NULL DEFAULT false,
    "estimatedArrival" TIMESTAMP(3),
    "estimatedDuration" INTEGER,
    "kpIndex" DOUBLE PRECISION,
    "note" TEXT,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMERecord_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on activityID
CREATE UNIQUE INDEX "CMERecord_activityID_key" ON "CMERecord"("activityID");

-- Create indexes for analytics queries
CREATE INDEX "CMERecord_startTime_idx" ON "CMERecord"("startTime");
CREATE INDEX "CMERecord_isEarthDirected_idx" ON "CMERecord"("isEarthDirected");
CREATE INDEX "CMERecord_speed_idx" ON "CMERecord"("speed");
CREATE INDEX "CMERecord_estimatedArrival_idx" ON "CMERecord"("estimatedArrival");
