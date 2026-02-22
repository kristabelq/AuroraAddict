-- Migration: Add CMERecord table only
-- Run this in Supabase SQL Editor

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
