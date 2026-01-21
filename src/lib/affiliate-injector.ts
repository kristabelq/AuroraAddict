/**
 * Affiliate Link Injection Utility
 *
 * Handles injection of affiliate parameters into booking URLs
 * to ensure platform earns commission on bookings.
 */

interface AffiliateConfig {
  platform: 'booking' | 'agoda' | 'expedia' | 'getyourguide' | 'viator' | 'tripadvisor';
  affiliateId: string;
  paramName: string; // Primary affiliate parameter name
  additionalParams?: Record<string, string>; // Additional tracking params
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
  },
  getyourguide: {
    platform: 'getyourguide',
    affiliateId: process.env.GETYOURGUIDE_PARTNER_ID || 'aurora-addict',
    paramName: 'partner_id',
    additionalParams: {
      utm_medium: 'online_publisher',
      utm_source: 'aurora_intel'
    }
  },
  viator: {
    platform: 'viator',
    affiliateId: process.env.VIATOR_PARTNER_ID || 'aurora-addict',
    paramName: 'pid',
    additionalParams: {
      mcid: '42383',
      medium: 'link'
    }
  },
  tripadvisor: {
    platform: 'tripadvisor',
    affiliateId: process.env.TRIPADVISOR_AFFILIATE_ID || 'aurora-addict',
    paramName: 'partnerId',
    additionalParams: {
      source: 'aurora_intel'
    }
  }
};

/**
 * Inject affiliate parameters into booking URL
 * Handles existing parameters, preserves business's tracking codes
 */
export function injectAffiliateParams(
  originalUrl: string,
  platform: 'booking' | 'agoda' | 'expedia' | 'getyourguide' | 'viator' | 'tripadvisor'
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

    // Add any additional tracking parameters
    if (config.additionalParams) {
      Object.entries(config.additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    // Add tracking label for accommodation platforms
    if (['booking', 'agoda'].includes(platform)) {
      url.searchParams.set('label', 'aurora-addict');
    }

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
    expedia: ['expedia.com', 'www.expedia.com', 'expedia.fi', 'expedia.se'],
    getyourguide: ['getyourguide.com', 'www.getyourguide.com'],
    viator: ['viator.com', 'www.viator.com'],
    tripadvisor: ['tripadvisor.com', 'www.tripadvisor.com', 'tripadvisor.fi', 'tripadvisor.se', 'tripadvisor.no']
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
export function detectPlatform(url: string): 'booking' | 'agoda' | 'expedia' | 'getyourguide' | 'viator' | 'tripadvisor' | 'direct' {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('booking.com')) return 'booking';
    if (hostname.includes('agoda.com')) return 'agoda';
    if (hostname.includes('expedia.com')) return 'expedia';
    if (hostname.includes('getyourguide.com')) return 'getyourguide';
    if (hostname.includes('viator.com')) return 'viator';
    if (hostname.includes('tripadvisor.com')) return 'tripadvisor';

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
  getYourGuide?: string;
  viator?: string;
  tripAdvisor?: string;
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
 * Generate affiliate links for all provided tour URLs
 * Returns object with affiliate-injected URLs
 */
export interface TourUrls {
  getYourGuideUrl?: string;
  viatorUrl?: string;
  tripAdvisorUrl?: string;
  directBookingUrl?: string;
}

export function generateTourAffiliateLinks(urls: TourUrls): AffiliateLinks {
  const affiliateLinks: AffiliateLinks = {};

  // Process GetYourGuide URL
  if (urls.getYourGuideUrl) {
    const injected = injectAffiliateParams(urls.getYourGuideUrl, 'getyourguide');
    if (injected) {
      affiliateLinks.getYourGuide = injected;
    }
  }

  // Process Viator URL
  if (urls.viatorUrl) {
    const injected = injectAffiliateParams(urls.viatorUrl, 'viator');
    if (injected) {
      affiliateLinks.viator = injected;
    }
  }

  // Process TripAdvisor URL
  if (urls.tripAdvisorUrl) {
    const injected = injectAffiliateParams(urls.tripAdvisorUrl, 'tripadvisor');
    if (injected) {
      affiliateLinks.tripAdvisor = injected;
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
    getyourguide: 'GetYourGuide',
    viator: 'Viator',
    tripadvisor: 'TripAdvisor',
    direct: 'Book Direct'
  };
  return labels[platform] || platform;
}
