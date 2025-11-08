import { format as formatDate, parseISO } from "date-fns";
import { formatInTimeZone, getTimezoneOffset } from "date-fns-tz";

/**
 * Get IANA timezone name from coordinates using geo-tz (server-side only)
 * For client-side, this will return UTC and should be called via API
 */
export function getTimezoneFromCoordinates(
  lat: number,
  lng: number
): string {
  // Only run on server-side (Node.js environment)
  if (typeof window === 'undefined') {
    try {
      const geoTz = require('geo-tz');
      const tzNames = geoTz.find(lat, lng);

      if (tzNames && tzNames.length > 0) {
        return tzNames[0]; // Returns IANA timezone like "Asia/Singapore"
      }
    } catch (error) {
      console.error("Error getting timezone from coordinates:", error);
    }
  }

  // Fallback to UTC for client-side or if lookup fails
  return "UTC";
}

/**
 * Convert IANA timezone to GMT offset string for a specific date
 * This accounts for DST
 * Also handles GMT offset strings (e.g., "GMT+8") by returning them as-is
 */
export function getGMTOffsetString(
  date: Date,
  timezone: string
): string {
  try {
    // If the timezone is already a GMT offset string, return it as-is
    if (timezone.startsWith("GMT")) {
      return timezone;
    }

    // Handle IANA timezone
    // Get the offset in milliseconds for the specific date
    const offsetMs = getTimezoneOffset(timezone, date);
    const offsetHours = offsetMs / (1000 * 60 * 60); // Convert ms to hours

    if (offsetHours === 0) return "GMT";

    // Handle fractional hours (e.g., GMT+5:30 for India)
    if (offsetHours % 1 !== 0) {
      const sign = offsetHours > 0 ? '+' : '-';
      const hours = Math.floor(Math.abs(offsetHours));
      const minutes = Math.abs((offsetHours % 1) * 60);
      return `GMT${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    if (offsetHours > 0) return `GMT+${offsetHours}`;
    return `GMT${offsetHours}`;
  } catch (error) {
    console.error("Error getting GMT offset:", error, "timezone:", timezone);
    return "GMT";
  }
}

/**
 * Convert GMT offset string (e.g., "GMT-8", "GMT+5") to hours offset
 */
export function gmtToHoursOffset(gmtString: string): number {
  if (gmtString === "UTC") return 0;

  const match = gmtString.match(/GMT([+-])(\d+)/);
  if (!match) return 0;

  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);

  return sign * hours;
}

/**
 * Format a date string in the hunt's local timezone with DST support
 * The database stores dates in UTC and IANA timezone names
 * @param dateString ISO date string from the database (UTC)
 * @param ianaTimezone IANA timezone name (e.g., "Asia/Singapore") or null
 * @param formatString date-fns format string
 * @param showTimezone whether to show the timezone indicator
 */
export function formatHuntDate(
  dateString: string,
  timezone: string | null | undefined,
  formatString: string = "MMM d, yyyy 'at' h:mm a",
  showTimezone: boolean = true
): string {
  try {
    // Validate input
    if (!dateString) {
      console.error("formatHuntDate: Empty dateString");
      return "Date unavailable";
    }

    const date = parseISO(dateString);

    // Validate the parsed date
    if (isNaN(date.getTime())) {
      console.error("formatHuntDate: Invalid date string:", dateString);
      return "Date unavailable";
    }

    const tz = timezone || "UTC";

    // Handle GMT offset strings (e.g., "GMT+8") vs IANA timezones (e.g., "Asia/Singapore")
    let formatted: string;
    if (tz.startsWith("GMT") && tz !== "GMT") {
      // For GMT offset strings, manually calculate the offset
      const match = tz.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1] === "+" ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = match[3] ? parseInt(match[3], 10) : 0;
        const offsetMinutes = sign * (hours * 60 + minutes);

        // Create a new date adjusted by the offset
        const adjustedDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);
        formatted = formatDate(adjustedDate, formatString);
      } else {
        // Fallback if parsing fails
        formatted = formatDate(date, formatString);
      }
    } else {
      // For IANA timezones, use formatInTimeZone (handles DST automatically)
      formatted = formatInTimeZone(date, tz, formatString);
    }

    if (showTimezone) {
      // Get the GMT offset for this specific date
      const gmtOffset = getGMTOffsetString(date, tz);
      return `${formatted} (${gmtOffset})`;
    }

    return formatted;
  } catch (error) {
    console.error("formatHuntDate: Error formatting date:", error, "dateString:", dateString, "timezone:", timezone);
    return "Date unavailable";
  }
}

/**
 * Format date for detailed view with timezone indicator
 */
export function formatHuntDateDetailed(
  dateString: string,
  ianaTimezone: string | null | undefined
): string {
  return formatHuntDate(
    dateString,
    ianaTimezone,
    "EEEE, MMMM d, yyyy 'at' h:mm a",
    true
  );
}
