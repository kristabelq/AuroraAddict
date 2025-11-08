import exifr from "exifr";

export interface PhotoMetadata {
  latitude?: number;
  longitude?: number;
  captureDate?: Date;
  timezone?: string; // IANA timezone if available
}

/**
 * Extract comprehensive metadata from an image file
 * Includes GPS coordinates, capture timestamp, and timezone (if GPS is available)
 */
export async function extractPhotoMetadata(
  file: File,
  fetchTimezone: boolean = true
): Promise<PhotoMetadata> {
  const metadata: PhotoMetadata = {};

  try {
    const exifData = await exifr.parse(file);

    if (!exifData) {
      return metadata;
    }

    // Extract GPS coordinates
    if (exifData.latitude && exifData.longitude) {
      metadata.latitude = exifData.latitude;
      metadata.longitude = exifData.longitude;

      // Fetch timezone from coordinates if requested
      if (fetchTimezone && typeof window !== 'undefined') {
        try {
          const response = await fetch(
            `/api/timezone?lat=${metadata.latitude}&lng=${metadata.longitude}`
          );
          if (response.ok) {
            const data = await response.json();
            metadata.timezone = data.timezone || undefined;
          }
        } catch (error) {
          console.warn("Failed to fetch timezone from coordinates:", error);
        }
      }
    }

    // Extract capture date/time
    // Priority: DateTimeOriginal > DateTime > CreateDate
    if (exifData.DateTimeOriginal) {
      metadata.captureDate = new Date(exifData.DateTimeOriginal);
    } else if (exifData.DateTime) {
      metadata.captureDate = new Date(exifData.DateTime);
    } else if (exifData.CreateDate) {
      metadata.captureDate = new Date(exifData.CreateDate);
    }

    // Validate the parsed date
    if (metadata.captureDate && isNaN(metadata.captureDate.getTime())) {
      delete metadata.captureDate;
    }

  } catch (error) {
    console.warn("Could not extract EXIF metadata from image:", error);
  }

  return metadata;
}

/**
 * Reverse geocode coordinates to get human-readable location name
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const response = await fetch(
      `/api/geocode/reverse?lat=${lat}&lng=${lng}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.location || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  } catch (error) {
    console.warn("Failed to reverse geocode coordinates:", error);
  }

  // Fallback to coordinates
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Format capture date for display
 */
export function formatCaptureDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get date string (YYYY-MM-DD) from Date object in specified timezone
 * If no timezone provided, uses browser's local timezone
 */
export function getDateString(date: Date, timezone?: string): string {
  if (!timezone) {
    // Use browser's local timezone
    return date.toISOString().split('T')[0];
  }

  try {
    // Format date in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Error formatting date with timezone, falling back to ISO:', error);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Get time string (HH:mm) from Date object in specified timezone
 * If no timezone provided, uses browser's local timezone
 */
export function getTimeString(date: Date, timezone?: string): string {
  if (!timezone) {
    // Use browser's local timezone
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  try {
    // Format time in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;

    return `${hour}:${minute}`;
  } catch (error) {
    console.warn('Error formatting time with timezone, falling back to local:', error);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
