/**
 * CTA Variant Selector
 *
 * Implements A/B testing logic for selecting which call-to-action button variant
 * to show to users based on traffic allocation and active experiments.
 */

import { prisma } from './prisma';

interface CTAVariant {
  id: string;
  name: string;
  buttonText: string;
  buttonColor: string;
  buttonStyle: string;
  placement: string;
  size: string;
  trafficAllocation: number;
  isActive: boolean;
  businessId: string | null;
  serviceType: string | null;
}

/**
 * Get active CTA variant for a business and service type
 *
 * Uses weighted random selection based on traffic allocation percentages.
 * If user has a session ID, tries to show consistent variant (sticky assignment).
 */
export async function selectCTAVariant(
  businessId: string,
  serviceType: 'accommodation' | 'tours',
  sessionId?: string
): Promise<CTAVariant | null> {
  try {
    const now = new Date();

    // Get all active variants for this business and service type
    const variants = await prisma.cTAVariant.findMany({
      where: {
        OR: [
          { businessId }, // Business-specific variants
          { businessId: null }, // Platform-wide variants
        ],
        AND: [
          {
            OR: [
              { serviceType }, // Service-specific
              { serviceType: null }, // All services
            ],
          },
          { isActive: true },
          {
            OR: [
              { endDate: null }, // No end date
              { endDate: { gte: now } }, // Not expired
            ],
          },
        ],
      },
    });

    if (variants.length === 0) {
      return null; // Use default CTA
    }

    // If only one variant, return it
    if (variants.length === 1) {
      return variants[0] as CTAVariant;
    }

    // Calculate total traffic allocation
    const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);

    // For sticky assignment, use hash of session ID if available
    if (sessionId) {
      const hash = simpleHash(sessionId + businessId + serviceType);
      const percentage = hash % 100; // 0-99

      let cumulative = 0;
      for (const variant of variants) {
        cumulative += (variant.trafficAllocation / totalAllocation) * 100;
        if (percentage < cumulative) {
          return variant as CTAVariant;
        }
      }
    }

    // Random weighted selection
    const random = Math.random() * totalAllocation;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.trafficAllocation;
      if (random < cumulative) {
        return variant as CTAVariant;
      }
    }

    // Fallback to first variant
    return variants[0] as CTAVariant;
  } catch (error) {
    console.error('Error selecting CTA variant:', error);
    return null;
  }
}

/**
 * Simple hash function for consistent variant assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get default CTA configuration if no variants active
 */
export function getDefaultCTA() {
  return {
    buttonText: 'Book Now',
    buttonColor: '#10b981', // Aurora green
    buttonStyle: 'solid',
    placement: 'both',
    size: 'medium',
  };
}

/**
 * Track CTA impression (for calculating CTR)
 */
export async function trackCTAImpression(variantId: string): Promise<void> {
  try {
    await prisma.cTAVariant.update({
      where: { id: variantId },
      data: {
        impressions: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('Error tracking CTA impression:', error);
  }
}

/**
 * Update CTA variant performance metrics
 *
 * Should be run periodically (e.g., daily cron job) to calculate
 * CTR and conversion rates from affiliate click data.
 */
export async function updateCTAVariantMetrics(variantId: string): Promise<void> {
  try {
    // Get all clicks for this variant
    const clicks = await prisma.affiliateClick.findMany({
      where: { ctaVariantId: variantId },
      select: {
        converted: true,
        conversionValue: true,
      },
    });

    const variant = await prisma.cTAVariant.findUnique({
      where: { id: variantId },
      select: { impressions: true },
    });

    if (!variant) return;

    const totalClicks = clicks.length;
    const conversions = clicks.filter((c) => c.converted).length;
    const revenue = clicks.reduce((sum, c) => sum + (c.conversionValue || 0), 0);

    const clickThroughRate =
      variant.impressions > 0 ? (totalClicks / variant.impressions) * 100 : 0;

    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    await prisma.cTAVariant.update({
      where: { id: variantId },
      data: {
        clicks: totalClicks,
        conversions,
        clickThroughRate,
        conversionRate,
        revenue,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating CTA variant metrics:', error);
  }
}
