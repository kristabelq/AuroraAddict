import { prisma } from "@/lib/prisma";

interface CMEAnalysis {
  time21_5?: string;
  latitude?: number;
  longitude?: number;
  halfAngle?: number;
  speed?: number;
  type?: string;
  isMostAccurate?: boolean;
  note?: string;
  enlilList?: Array<{
    estimatedShockArrivalTime?: string;
    estimatedDuration?: number;
    kpIndex?: number;
  }>;
}

interface CMEData {
  activityID: string;
  startTime: string;
  sourceLocation?: string;
  note?: string;
  linkedEvents?: Array<{ activityID: string }>;
  cmeAnalyses?: CMEAnalysis[];
}

/**
 * Determine if a CME is Earth-directed based on its properties
 */
export function isEarthDirected(
  latitude?: number,
  longitude?: number,
  halfAngle?: number,
  enlilList?: any[]
): boolean {
  // ENLIL model predictions indicate Earth impact
  if (enlilList && enlilList.length > 0) return true;

  // Full or partial halo CMEs are more likely Earth-directed
  if (halfAngle && halfAngle >= 60) return true;

  // CMEs from near disk center are Earth-directed
  if (latitude !== undefined && longitude !== undefined) {
    return Math.abs(latitude) <= 30 && Math.abs(longitude) <= 30;
  }

  return false;
}

/**
 * Parse and store CME records from NASA DONKI API response
 * Returns number of records created/updated
 */
export async function storeCMERecords(cmeDataList: CMEData[]): Promise<number> {
  let count = 0;

  for (const cme of cmeDataList) {
    try {
      // Get the most accurate analysis or fallback to first
      const analysis = cme.cmeAnalyses?.find((a) => a.isMostAccurate) || cme.cmeAnalyses?.[0];

      if (!analysis) {
        console.warn(`[CME Parser] No analysis for ${cme.activityID}, skipping`);
        continue;
      }

      const earthDirected = isEarthDirected(
        analysis.latitude,
        analysis.longitude,
        analysis.halfAngle,
        analysis.enlilList
      );

      const enlilData = analysis.enlilList?.[0];

      // Upsert the CME record (update if exists, create if not)
      await prisma.cMERecord.upsert({
        where: {
          activityID: cme.activityID,
        },
        update: {
          startTime: new Date(cme.startTime),
          sourceLocation: cme.sourceLocation,
          latitude: analysis.latitude,
          longitude: analysis.longitude,
          halfAngle: analysis.halfAngle,
          speed: analysis.speed,
          type: analysis.type,
          isEarthDirected: earthDirected,
          isMostAccurate: analysis.isMostAccurate || false,
          estimatedArrival: enlilData?.estimatedShockArrivalTime
            ? new Date(enlilData.estimatedShockArrivalTime)
            : null,
          estimatedDuration: enlilData?.estimatedDuration,
          kpIndex: enlilData?.kpIndex,
          note: cme.note,
          rawData: cme as any,
          updatedAt: new Date(),
        },
        create: {
          activityID: cme.activityID,
          startTime: new Date(cme.startTime),
          sourceLocation: cme.sourceLocation,
          latitude: analysis.latitude,
          longitude: analysis.longitude,
          halfAngle: analysis.halfAngle,
          speed: analysis.speed,
          type: analysis.type,
          isEarthDirected: earthDirected,
          isMostAccurate: analysis.isMostAccurate || false,
          estimatedArrival: enlilData?.estimatedShockArrivalTime
            ? new Date(enlilData.estimatedShockArrivalTime)
            : null,
          estimatedDuration: enlilData?.estimatedDuration,
          kpIndex: enlilData?.kpIndex,
          note: cme.note,
          rawData: cme as any,
        },
      });

      count++;
    } catch (error) {
      console.error(`[CME Parser] Error storing ${cme.activityID}:`, error);
    }
  }

  return count;
}

/**
 * Get recent CME records from database
 */
export async function getRecentCMERecords(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await prisma.cMERecord.findMany({
    where: {
      startTime: {
        gte: startDate,
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });
}

/**
 * Get Earth-directed CME records
 */
export async function getEarthDirectedCMEs(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await prisma.cMERecord.findMany({
    where: {
      startTime: {
        gte: startDate,
      },
      isEarthDirected: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });
}
