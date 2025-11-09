/**
 * Conversion Tracking Service
 *
 * Handles conversion attribution, commission calculation, and performance updates
 * for affiliate marketing conversions.
 */

import { prisma } from './prisma';
import crypto from 'crypto';

// Platform-specific commission rates (%)
const COMMISSION_RATES: Record<string, number> = {
  booking: 4.0,      // Booking.com typically 4%
  agoda: 7.0,        // Agoda typically 5-7%
  getyourguide: 8.0, // GetYourGuide typically 8%
  viator: 8.0,       // Viator typically 6-8%
  tripadvisor: 5.0,  // TripAdvisor varies, ~5%
  direct: 0,         // No commission for direct bookings
};

interface ConversionData {
  platform: string;
  eventType: 'booking' | 'confirmation' | 'cancellation' | 'completion';
  bookingReference?: string;
  bookingValue?: number;
  currency?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  guests?: number;
  customerEmail?: string;
  customerId?: string;
}

/**
 * Hash email for privacy-preserving deduplication
 */
export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

/**
 * Calculate commission based on platform and booking value
 */
export function calculateCommission(platform: string, bookingValue: number): {
  rate: number;
  amount: number;
} {
  const rate = COMMISSION_RATES[platform] || 0;
  const amount = (bookingValue * rate) / 100;

  return { rate, amount };
}

/**
 * Attribute conversion to affiliate click
 *
 * Looks up the most recent click within attribution window (30 days)
 * for the given booking reference or customer.
 */
export async function attributeConversion(
  conversionData: ConversionData
): Promise<string | null> {
  const { platform, bookingReference, customerEmail, customerId } = conversionData;

  // Try to find matching click within 30-day attribution window
  const attributionWindow = new Date();
  attributionWindow.setDate(attributionWindow.getDate() - 30);

  // Build where clause
  const where: any = {
    platform,
    clickedAt: { gte: attributionWindow },
  };

  // Try to match by booking reference first (most reliable)
  if (bookingReference) {
    where.bookingReference = bookingReference;
  }
  // Otherwise try customer identifiers
  else if (customerEmail || customerId) {
    // This would require storing customer info on click
    // For now, return null as we don't have this data
    return null;
  }

  const click = await prisma.affiliateClick.findFirst({
    where,
    orderBy: { clickedAt: 'desc' },
  });

  return click?.id || null;
}

/**
 * Process conversion event from webhook
 */
export async function processConversion(
  conversionData: ConversionData,
  webhookPayload?: any,
  webhookSignature?: string
): Promise<{ success: boolean; conversionEventId?: string; error?: string }> {
  try {
    const {
      platform,
      eventType,
      bookingReference,
      bookingValue,
      currency = 'EUR',
      checkInDate,
      checkOutDate,
      guests,
      customerEmail,
      customerId,
    } = conversionData;

    // Check for duplicate
    if (bookingReference) {
      const existing = await prisma.conversionEvent.findFirst({
        where: {
          platform,
          bookingReference,
          eventType,
        },
      });

      if (existing) {
        return {
          success: false,
          error: 'Duplicate conversion event',
        };
      }
    }

    // Try to attribute to affiliate click
    const affiliateClickId = await attributeConversion(conversionData);

    // Get business ID from click or need another way
    let businessId: string | null = null;
    let roomTypeId: string | null = null;
    let tourExperienceId: string | null = null;

    if (affiliateClickId) {
      const click = await prisma.affiliateClick.findUnique({
        where: { id: affiliateClickId },
        select: {
          businessId: true,
          roomTypeId: true,
          tourExperienceId: true,
        },
      });

      if (click) {
        businessId = click.businessId;
        roomTypeId = click.roomTypeId;
        tourExperienceId = click.tourExperienceId;
      }
    }

    if (!businessId) {
      return {
        success: false,
        error: 'Could not attribute conversion to business',
      };
    }

    // Calculate commission
    let commission: number | null = null;
    let commissionRate: number | null = null;

    if (bookingValue && eventType === 'confirmation') {
      const calc = calculateCommission(platform, bookingValue);
      commission = calc.amount;
      commissionRate = calc.rate;
    }

    // Calculate nights for accommodation
    let nights: number | null = null;
    if (checkInDate && checkOutDate) {
      const diffTime = checkOutDate.getTime() - checkInDate.getTime();
      nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Hash customer email for privacy
    const hashedEmail = customerEmail ? hashEmail(customerEmail) : null;

    // Create conversion event
    const conversionEvent = await prisma.conversionEvent.create({
      data: {
        platform,
        eventType,
        affiliateClickId,
        businessId,
        roomTypeId,
        tourExperienceId,
        bookingReference,
        bookingValue,
        currency,
        commission,
        commissionCurrency: currency,
        checkInDate,
        checkOutDate,
        guests,
        nights,
        customerEmail: hashedEmail,
        customerId,
        webhookPayload: webhookPayload || null,
        webhookSignature,
        processingStatus: 'processed',
        processedAt: new Date(),
      },
    });

    // Update affiliate click if attributed
    if (affiliateClickId) {
      await prisma.affiliateClick.update({
        where: { id: affiliateClickId },
        data: {
          converted: true,
          conversionValue: bookingValue,
          conversionCurrency: currency,
          conversionDate: new Date(),
          conversionSource: 'webhook',
          commissionRate,
          estimatedCommission: commission,
          bookingReference,
          checkInDate,
          checkOutDate,
          guests,
          nights,
        },
      });
    }

    // Update business performance metrics
    await updateBusinessPerformance(businessId);

    return {
      success: true,
      conversionEventId: conversionEvent.id,
    };
  } catch (error) {
    console.error('Error processing conversion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update business affiliate performance metrics
 */
export async function updateBusinessPerformance(businessId: string): Promise<void> {
  try {
    // Get all clicks for this business
    const clicks = await prisma.affiliateClick.findMany({
      where: { businessId },
      select: {
        converted: true,
        estimatedCommission: true,
      },
    });

    const totalClicks = clicks.length;
    const conversions = clicks.filter((c) => c.converted);
    const totalConversions = conversions.length;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    const totalCommission = conversions.reduce((sum, c) => {
      return sum + (c.estimatedCommission || 0);
    }, 0);

    // Estimate monthly commission (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentConversions = await prisma.affiliateClick.findMany({
      where: {
        businessId,
        converted: true,
        conversionDate: { gte: thirtyDaysAgo },
      },
      select: { estimatedCommission: true },
    });

    const monthlyCommission = recentConversions.reduce((sum, c) => {
      return sum + (c.estimatedCommission || 0);
    }, 0);

    // Update business performance
    await prisma.user.update({
      where: { id: businessId },
      data: {
        totalAffiliateClicks: totalClicks,
        totalConversions,
        conversionRate,
        totalCommissionEarned: totalCommission,
        estimatedMonthlyCommission: monthlyCommission,
        performanceLastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating business performance:', error);
    throw error;
  }
}

/**
 * Verify webhook signature (platform-specific)
 */
export function verifyWebhookSignature(
  platform: string,
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    let expectedSignature: string;

    switch (platform) {
      case 'booking':
        // Booking.com uses HMAC SHA256
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex');
        break;

      case 'getyourguide':
        // GetYourGuide signature format (example)
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('base64');
        break;

      default:
        // Generic HMAC SHA256
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex');
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
