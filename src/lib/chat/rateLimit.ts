/**
 * Rate Limiting Utility for Chat Messages
 *
 * Prevents spam by limiting:
 * - 10 messages per minute per user per chat
 * - 100 messages per hour per user per chat
 * - 20 images per hour per user per chat
 */

interface RateLimitRecord {
  count: number;
  resetAt: Date;
}

// In-memory storage for rate limits
// Key format: "userId:chatId:type" (type = 'messages' | 'images')
const rateLimits = new Map<string, RateLimitRecord>();

export const RATE_LIMITS = {
  messagesPerMinute: 10,
  messagesPerHour: 100,
  imagesPerHour: 20,
};

/**
 * Check if user is within rate limit for sending messages
 */
export function checkMessageRateLimit(
  userId: string,
  chatId: string
): { allowed: boolean; reason?: string; resetIn?: number } {
  const now = Date.now();

  // Check 1-minute limit
  const minuteKey = `${userId}:${chatId}:minute`;
  const minuteRecord = rateLimits.get(minuteKey);

  if (minuteRecord && now < minuteRecord.resetAt.getTime()) {
    if (minuteRecord.count >= RATE_LIMITS.messagesPerMinute) {
      const resetIn = Math.ceil((minuteRecord.resetAt.getTime() - now) / 1000);
      return {
        allowed: false,
        reason: `Too many messages. Please wait ${resetIn} seconds before sending more.`,
        resetIn,
      };
    }
  }

  // Check 1-hour limit
  const hourKey = `${userId}:${chatId}:hour`;
  const hourRecord = rateLimits.get(hourKey);

  if (hourRecord && now < hourRecord.resetAt.getTime()) {
    if (hourRecord.count >= RATE_LIMITS.messagesPerHour) {
      const resetIn = Math.ceil((hourRecord.resetAt.getTime() - now) / 1000);
      const minutesLeft = Math.ceil(resetIn / 60);
      return {
        allowed: false,
        reason: `Hourly message limit reached. Please try again in ${minutesLeft} minutes.`,
        resetIn,
      };
    }
  }

  return { allowed: true };
}

/**
 * Check if user is within rate limit for uploading images
 */
export function checkImageRateLimit(
  userId: string,
  chatId: string,
  imageCount: number = 1
): { allowed: boolean; reason?: string; resetIn?: number } {
  const now = Date.now();
  const key = `${userId}:${chatId}:images`;
  const record = rateLimits.get(key);

  if (record && now < record.resetAt.getTime()) {
    if (record.count + imageCount > RATE_LIMITS.imagesPerHour) {
      const resetIn = Math.ceil((record.resetAt.getTime() - now) / 1000);
      const minutesLeft = Math.ceil(resetIn / 60);
      return {
        allowed: false,
        reason: `Hourly image limit reached. You can upload ${RATE_LIMITS.imagesPerHour - record.count} more images in ${minutesLeft} minutes.`,
        resetIn,
      };
    }
  }

  return { allowed: true };
}

/**
 * Increment message count for rate limiting
 */
export function incrementMessageCount(userId: string, chatId: string): void {
  const now = Date.now();

  // Increment 1-minute counter
  const minuteKey = `${userId}:${chatId}:minute`;
  const minuteRecord = rateLimits.get(minuteKey);

  if (!minuteRecord || now >= minuteRecord.resetAt.getTime()) {
    rateLimits.set(minuteKey, {
      count: 1,
      resetAt: new Date(now + 60 * 1000), // 1 minute from now
    });
  } else {
    minuteRecord.count++;
  }

  // Increment 1-hour counter
  const hourKey = `${userId}:${chatId}:hour`;
  const hourRecord = rateLimits.get(hourKey);

  if (!hourRecord || now >= hourRecord.resetAt.getTime()) {
    rateLimits.set(hourKey, {
      count: 1,
      resetAt: new Date(now + 60 * 60 * 1000), // 1 hour from now
    });
  } else {
    hourRecord.count++;
  }
}

/**
 * Increment image upload count for rate limiting
 */
export function incrementImageCount(
  userId: string,
  chatId: string,
  count: number = 1
): void {
  const now = Date.now();
  const key = `${userId}:${chatId}:images`;
  const record = rateLimits.get(key);

  if (!record || now >= record.resetAt.getTime()) {
    rateLimits.set(key, {
      count,
      resetAt: new Date(now + 60 * 60 * 1000), // 1 hour from now
    });
  } else {
    record.count += count;
  }
}

/**
 * Reset rate limits for a specific user in a chat (used for testing or admin override)
 */
export function resetRateLimit(userId: string, chatId: string): void {
  rateLimits.delete(`${userId}:${chatId}:minute`);
  rateLimits.delete(`${userId}:${chatId}:hour`);
  rateLimits.delete(`${userId}:${chatId}:images`);
}

/**
 * Clean up expired rate limit records (call periodically to prevent memory leak)
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimits.forEach((record, key) => {
    if (now >= record.resetAt.getTime()) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimits.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`Cleaned up ${keysToDelete.length} expired rate limit records`);
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}
