/**
 * Common IANA timezones grouped by region for better UX
 */

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

/**
 * Get all available IANA timezones with their current offsets
 * Formatted as: "(GMT+08:00) Singapore Standard Time"
 */
export function getAllTimezones(): TimezoneOption[] {
  const timezones: TimezoneOption[] = [];

  // Get all supported timezones
  const tzNames = Intl.supportedValuesOf('timeZone');

  for (const tz of tzNames) {
    try {
      const offset = formatTimezoneOffset(tz);
      const name = getTimezoneName(tz);

      // Create Google Calendar-style label: "(GMT+08:00) Singapore Standard Time"
      const label = `${offset} ${name}`;

      timezones.push({
        value: tz,
        label,
        offset,
      });
    } catch (error) {
      // Skip invalid timezones
      continue;
    }
  }

  // Sort by offset, then by name
  return timezones.sort((a, b) => {
    // Extract offset values for comparison
    const offsetA = a.offset.replace(/[()GMT:]/g, '');
    const offsetB = b.offset.replace(/[()GMT:]/g, '');
    if (offsetA !== offsetB) {
      return offsetA.localeCompare(offsetB);
    }
    return a.label.localeCompare(b.label);
  });
}

/**
 * Get commonly used timezones (curated list for better UX)
 */
export function getCommonTimezones(): TimezoneOption[] {
  const commonTzs = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Perth',
    'Pacific/Auckland',
  ];

  const allTimezones = getAllTimezones();
  const common = allTimezones.filter(tz => commonTzs.includes(tz.value));

  // Add UTC at the top if not already there
  const utc = allTimezones.find(tz => tz.value === 'UTC');
  if (utc && !common.find(tz => tz.value === 'UTC')) {
    common.unshift(utc);
  }

  return common;
}

/**
 * Get timezone offset in minutes from UTC
 */
function getTimezoneOffsetMinutes(timezone: string): number {
  try {
    const now = new Date();

    // Get UTC time
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));

    // Get time in target timezone
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

    // Calculate difference in minutes
    const diffMs = tzDate.getTime() - utcDate.getTime();
    return Math.round(diffMs / 60000);
  } catch (error) {
    return 0;
  }
}

/**
 * Format timezone offset as (GMT±XX:XX) format
 * e.g., "(GMT+08:00)", "(GMT-05:00)", "(GMT+00:00)"
 */
export function formatTimezoneOffset(timezone: string): string {
  try {
    const offsetMinutes = getTimezoneOffsetMinutes(timezone);

    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60).toString().padStart(2, '0');
    const minutes = (absMinutes % 60).toString().padStart(2, '0');

    return `(GMT${sign}${hours}:${minutes})`;
  } catch (error) {
    return '(GMT+00:00)';
  }
}

/**
 * Get human-readable timezone name
 * Converts IANA timezone to readable format
 * e.g., "Asia/Singapore" -> "Singapore Standard Time"
 */
export function getTimezoneName(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long',
    });

    const parts = formatter.formatToParts(now);
    const namePart = parts.find(part => part.type === 'timeZoneName');

    if (namePart?.value) {
      return namePart.value;
    }

    // Fallback: format the IANA name
    return timezone.replace(/_/g, ' ').split('/').pop() || timezone;
  } catch (error) {
    return timezone.replace(/_/g, ' ');
  }
}

/**
 * Convert a date/time from one timezone to another for display purposes
 */
export function convertTimezone(
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date {
  // Get the date string in the source timezone
  const dateStr = date.toLocaleString('en-US', { timeZone: fromTimezone });

  // Parse it back as if it were in the target timezone
  const targetDate = new Date(dateStr);

  return targetDate;
}
