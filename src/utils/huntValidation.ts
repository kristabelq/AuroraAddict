import { parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export interface HuntDateValidationResult {
  isValid: boolean;
  reason?: string;
  huntStartInPhotoTz?: Date;
  huntEndInPhotoTz?: Date;
  photoDateInPhotoTz?: Date;
}

/**
 * Validate if a photo's capture date/time falls within the hunt's date range
 * with a 24-hour window before and after, accounting for timezone differences
 *
 * @param photoDate - The photo's capture date (in photo's local time if timezone provided)
 * @param photoTimezone - Photo's IANA timezone (e.g., "America/New_York") or null
 * @param huntStartDate - Hunt start date ISO string (UTC)
 * @param huntEndDate - Hunt end date ISO string (UTC)
 * @param huntTimezone - Hunt's IANA timezone (e.g., "Europe/Oslo")
 * @param windowHours - Validation window in hours (default: 24 hours before/after)
 * @returns Validation result with details
 */
export function validatePhotoDateForHunt(
  photoDate: Date,
  photoTimezone: string | null | undefined,
  huntStartDate: string,
  huntEndDate: string,
  huntTimezone: string | null | undefined,
  windowHours: number = 24
): HuntDateValidationResult {
  try {
    const windowMs = windowHours * 60 * 60 * 1000;

    // Parse hunt dates (these are in UTC from database)
    const huntStartUTC = parseISO(huntStartDate);
    const huntEndUTC = parseISO(huntEndDate);

    // Validate parsed dates
    if (isNaN(huntStartUTC.getTime()) || isNaN(huntEndUTC.getTime())) {
      return {
        isValid: false,
        reason: "Invalid hunt dates",
      };
    }

    // Use the hunt's timezone, fallback to UTC
    const effectiveHuntTz = huntTimezone || "UTC";

    // Convert hunt dates to the hunt's local timezone
    const huntStartLocal = toZonedTime(huntStartUTC, effectiveHuntTz);
    const huntEndLocal = toZonedTime(huntEndUTC, effectiveHuntTz);

    // Add the window (24 hours before start, 24 hours after end)
    const validStartLocal = new Date(huntStartLocal.getTime() - windowMs);
    const validEndLocal = new Date(huntEndLocal.getTime() + windowMs);

    // Convert photo date to UTC if timezone is provided
    let photoDateUTC: Date;
    if (photoTimezone) {
      // Photo date is in local time, convert to UTC
      photoDateUTC = fromZonedTime(photoDate, photoTimezone);
    } else {
      // Assume photo date is already in UTC or treat as UTC
      photoDateUTC = photoDate;
    }

    // Convert photo date to hunt's local timezone for comparison
    const photoDateInHuntTz = toZonedTime(photoDateUTC, effectiveHuntTz);

    // Compare dates in hunt's local timezone
    const photoTimeMs = photoDateInHuntTz.getTime();
    const validStartMs = validStartLocal.getTime();
    const validEndMs = validEndLocal.getTime();

    const isValid = photoTimeMs >= validStartMs && photoTimeMs <= validEndMs;

    return {
      isValid,
      reason: isValid
        ? undefined
        : `Photo dated ${photoDateInHuntTz.toLocaleDateString()} is outside hunt period (${validStartLocal.toLocaleDateString()} - ${validEndLocal.toLocaleDateString()}) including ${windowHours}h window`,
      huntStartInPhotoTz: validStartLocal,
      huntEndInPhotoTz: validEndLocal,
      photoDateInPhotoTz: photoDateInHuntTz,
    };
  } catch (error) {
    console.error("Error validating photo date for hunt:", error);
    return {
      isValid: false,
      reason: "Error during validation",
    };
  }
}

/**
 * Simplified version: Check if photo date is outside hunt dates with 24-hour window
 * Returns true if OUTSIDE the valid range (for warning display)
 */
export function isPhotoOutsideHuntDates(
  photoDate: Date | null | undefined,
  photoTimezone: string | null | undefined,
  huntStartDate: string,
  huntEndDate: string,
  huntTimezone: string | null | undefined,
  windowHours: number = 24
): boolean {
  if (!photoDate) {
    return false; // No date to validate
  }

  const result = validatePhotoDateForHunt(
    photoDate,
    photoTimezone,
    huntStartDate,
    huntEndDate,
    huntTimezone,
    windowHours
  );

  return !result.isValid;
}

/**
 * Format validation window dates for display
 */
export function formatValidationWindow(
  huntStartDate: string,
  huntEndDate: string,
  huntTimezone: string | null | undefined,
  windowHours: number = 24
): { start: string; end: string } {
  try {
    const windowMs = windowHours * 60 * 60 * 1000;
    const effectiveHuntTz = huntTimezone || "UTC";

    const huntStartUTC = parseISO(huntStartDate);
    const huntEndUTC = parseISO(huntEndDate);

    const huntStartLocal = toZonedTime(huntStartUTC, effectiveHuntTz);
    const huntEndLocal = toZonedTime(huntEndUTC, effectiveHuntTz);

    const validStartLocal = new Date(huntStartLocal.getTime() - windowMs);
    const validEndLocal = new Date(huntEndLocal.getTime() + windowMs);

    return {
      start: validStartLocal.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      end: validEndLocal.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  } catch (error) {
    console.error("Error formatting validation window:", error);
    return { start: "N/A", end: "N/A" };
  }
}
