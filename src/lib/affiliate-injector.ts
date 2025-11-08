/**
 * Affiliate Link Injection Utility
 *
 * Handles injection of affiliate parameters into booking URLs
 * to ensure platform earns commission on bookings.
 */

interface AffiliateConfig {
  platform: 'booking' | 'agoda' | 'expedia';
  affiliateId: string;
  paramName: string; // 'aid' for Booking, 'cid' for Agoda
}

const AFFILIATE_CONFIGS: Record<string, AffiliateConfig> = {
  booking: {
    platform: 'booking',
    affiliateId: process.env.BOOKING_AFFILIATE_ID || 'aurora-addict',
    paramName: 'aid'
  },
  agoda: {
    platform: 'agoda',
    affiliateId: process.env.AGODA_AFFILIATE_ID || 'aurora-addict',
    paramName: 'cid'
  },
  expedia: {
    platform: 'expedia',
    affiliateId: process.env.EXPEDIA_AFFILIATE_ID || 'aurora-addict',
    paramName: 'AFFID'
  }
};

/**
 * Inject affiliate parameters into booking URL
 * Handles existing parameters, preserves business's tracking codes
 */
export function injectAffiliateParams(
  originalUrl: string,
  platform: 'booking' | 'agoda' | 'expedia'
): string | null {
  try {
    const config = AFFILIATE_CONFIGS[platform];
    if (!config) {
      console.error(`No affiliate config for platform: ${platform}`);
      return null;
    }

    const url = new URL(originalUrl);

    // Validate domain
    if (!isValidDomain(url.hostname, platform)) {
      throw new Error(`Invalid domain for ${platform}: ${url.hostname}`);
    }

    // Check if affiliate param already exists
    if (url.searchParams.has(config.paramName)) {
      // Remove existing affiliate param (prevent business from using their own)
      console.warn(`Removing existing ${config.paramName} from URL`);
      url.searchParams.delete(config.paramName);
    }

    // Inject our affiliate ID
    url.searchParams.set(config.paramName, config.affiliateId);

    // Add tracking label (optional)
    url.searchParams.set('label', 'aurora-addict');

    return url.toString();
  } catch (error) {
    console.error('Failed to inject affiliate params:', error);
    return null;
  }
}

/**
 * Validate URL domain matches platform
 */
function isValidDomain(hostname: string, platform: string): boolean {
  const validDomains: Record<string, string[]> = {
    booking: ['booking.com', 'www.booking.com'],
    agoda: ['agoda.com', 'www.agoda.com', 'agoda.fi', 'agoda.se', 'agoda.no'],
    expedia: ['expedia.com', 'www.expedia.com', 'expedia.fi', 'expedia.se']
  };

  const domains = validDomains[platform];
  if (!domains) return false;

  return domains.some(domain =>
    hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): 'booking' | 'agoda' | 'expedia' | 'direct' {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('booking.com')) return 'booking';
    if (hostname.includes('agoda.com')) return 'agoda';
    if (hostname.includes('expedia.com')) return 'expedia';

    return 'direct';
  } catch {
    return 'direct';
  }
}

/**
 * Generate affiliate links for all provided booking URLs
 * Returns object with affiliate-injected URLs
 */
export interface BookingUrls {
  bookingComUrl?: string;
  agodaUrl?: string;
  directBookingUrl?: string;
}

export interface AffiliateLinks {
  booking?: string;
  agoda?: string;
  direct?: string;
}

export function generateAffiliateLinks(urls: BookingUrls): AffiliateLinks {
  const affiliateLinks: AffiliateLinks = {};

  // Process Booking.com URL
  if (urls.bookingComUrl) {
    const injected = injectAffiliateParams(urls.bookingComUrl, 'booking');
    if (injected) {
      affiliateLinks.booking = injected;
    }
  }

  // Process Agoda URL
  if (urls.agodaUrl) {
    const injected = injectAffiliateParams(urls.agodaUrl, 'agoda');
    if (injected) {
      affiliateLinks.agoda = injected;
    }
  }

  // Direct booking URL (no affiliate injection needed)
  if (urls.directBookingUrl) {
    affiliateLinks.direct = urls.directBookingUrl;
  }

  return affiliateLinks;
}

/**
 * Validate booking URL format
 */
export function validateBookingUrl(url: string, expectedPlatform?: string): {
  isValid: boolean;
  platform: string;
  error?: string;
} {
  try {
    const parsedUrl = new URL(url);

    // Must use HTTPS (or HTTP for direct booking only)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return {
        isValid: false,
        platform: 'unknown',
        error: 'URL must use HTTPS protocol'
      };
    }

    // Detect platform
    const platform = detectPlatform(url);

    // If expected platform provided, validate it matches
    if (expectedPlatform && platform !== expectedPlatform) {
      return {
        isValid: false,
        platform,
        error: `URL is for ${platform} but expected ${expectedPlatform}`
      };
    }

    return {
      isValid: true,
      platform
    };
  } catch (error) {
    return {
      isValid: false,
      platform: 'unknown',
      error: 'Invalid URL format'
    };
  }
}

/**
 * Get platform display name
 */
export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    booking: 'Booking.com',
    agoda: 'Agoda',
    expedia: 'Expedia',
    direct: 'Book Direct'
  };
  return labels[platform] || platform;
}
