-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cachedSightingsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cachedHuntsCreatedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cachedHuntsJoinedCount" INTEGER NOT NULL DEFAULT 0;
