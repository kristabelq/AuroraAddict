import { NextResponse } from "next/server";
import { cleanupExpiredParticipants } from "@/lib/huntEdgeCases";

/**
 * Cron job to clean up expired hunt participants
 * This should be called periodically (e.g., every hour) by a cron service like Vercel Cron or GitHub Actions
 *
 * Edge cases handled:
 * 1. Expired pending payments (7 days)
 * 2. Expired pending requests (7 days)
 * 3. Waitlisted users when hunt is about to start (1 second before)
 * 4. Automatic promotion of next waitlisted user when capacity opens
 *
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-hunt-participants",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * Or use a cron service that calls this endpoint with the secret header
 */
export async function GET(req: Request) {
  try {
    // Verify request is from authorized source (cron job)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-key-here";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run cleanup
    console.log("Starting cleanup of expired hunt participants...");
    const cleanedCount = await cleanupExpiredParticipants();
    console.log(`Cleanup complete. Processed ${cleanedCount} expired participants.`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired participants`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cleanup cron job:", error);
    return NextResponse.json(
      { error: "Cleanup failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Support POST method as well for manual triggers
export async function POST(req: Request) {
  return GET(req);
}
