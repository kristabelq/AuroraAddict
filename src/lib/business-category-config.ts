/**
 * Business Category Configuration
 *
 * Centralized configuration for business service types
 * and their category-specific pages and features.
 */

export type BusinessService =
  | 'accommodation'
  | 'restaurant'
  | 'tour_operator'
  | 'photography'
  | 'shop';

export interface CategoryConfig {
  key: BusinessService;
  icon: string;
  label: string;
  pluralLabel: string;
  route: string; // e.g., 'rooms', 'menu', 'tours'
  ctaText: string; // "View All Rooms", "See Menu", etc.
  previewKey: string; // key used in preview data
}

export const CATEGORY_CONFIGS: Record<BusinessService, CategoryConfig> = {
  accommodation: {
    key: 'accommodation',
    icon: '🏨',
    label: 'Accommodation',
    pluralLabel: 'Room Types',
    route: 'rooms',
    ctaText: 'View All Rooms',
    previewKey: 'roomTypes'
  },
  restaurant: {
    key: 'restaurant',
    icon: '🍽️',
    label: 'Restaurant & Bar',
    pluralLabel: 'Menu Items',
    route: 'menu',
    ctaText: 'View Menu',
    previewKey: 'menuItems'
  },
  tour_operator: {
    key: 'tour_operator',
    icon: '🚐',
    label: 'Tours & Experiences',
    pluralLabel: 'Tours',
    route: 'tours',
    ctaText: 'Browse Tours',
    previewKey: 'tours'
  },
  photography: {
    key: 'photography',
    icon: '📸',
    label: 'Photography',
    pluralLabel: 'Portfolio',
    route: 'gallery',
    ctaText: 'View Portfolio',
    previewKey: 'photos'
  },
  shop: {
    key: 'shop',
    icon: '🏪',
    label: 'Shop',
    pluralLabel: 'Products',
    route: 'shop',
    ctaText: 'Browse Products',
    previewKey: 'products'
  }
};

/**
 * Get category path (route) from service key
 */
export function getCategoryPath(service: string): string | null {
  const config = CATEGORY_CONFIGS[service as BusinessService];
  return config?.route || null;
}

/**
 * Get category label from service key
 */
export function getCategoryLabel(service: string): string {
  const config = CATEGORY_CONFIGS[service as BusinessService];
  return config?.label || service;
}

/**
 * Get category plural label from service key
 */
export function getCategoryPluralLabel(service: string): string {
  const config = CATEGORY_CONFIGS[service as BusinessService];
  return config?.pluralLabel || service;
}

/**
 * Get category icon from service key
 */
export function getCategoryIcon(service: string): string {
  const config = CATEGORY_CONFIGS[service as BusinessService];
  return config?.icon || '📦';
}

/**
 * Get category CTA text from service key
 */
export function getCategoryCTA(service: string): string {
  const config = CATEGORY_CONFIGS[service as BusinessService];
  return config?.ctaText || 'View Details';
}

/**
 * Get full category config
 */
export function getCategoryConfig(service: string): CategoryConfig | null {
  return CATEGORY_CONFIGS[service as BusinessService] || null;
}

/**
 * Check if service key is valid
 */
export function isValidService(service: string): service is BusinessService {
  return service in CATEGORY_CONFIGS;
}

/**
 * Get all available services
 */
export function getAllServices(): BusinessService[] {
  return Object.keys(CATEGORY_CONFIGS) as BusinessService[];
}

/**
 * Amenities configuration for accommodation
 */
export const ACCOMMODATION_AMENITIES = [
  // Basic amenities
  'WiFi',
  'Parking',
  'Breakfast Included',

  // Room features
  'Private Bathroom',
  'King Size Bed',
  'Twin Beds',
  'Sofa Bed',

  // Arctic/Winter specific
  'Heated Glass Roof',
  'Northern Lights View',
  'Aurora Guarantee',
  'Thermal Suits Provided',

  // Wellness
  'Private Sauna',
  'Shared Sauna',
  'Hot Tub',
  'Spa Access',

  // Entertainment
  'TV',
  'Fireplace',
  'Sound System',

  // Kitchen
  'Kitchenette',
  'Full Kitchen',
  'Microwave',
  'Coffee Maker',

  // Outdoor
  'Terrace',
  'Balcony',
  'Garden Access',
  'BBQ Area',

  // Services
  'Room Service',
  'Laundry',
  'Daily Housekeeping',
  'Airport Transfer',

  // Accessibility
  'Wheelchair Accessible',
  'Ground Floor',

  // Family
  'Family Room',
  'Kids Welcome',
  'Baby Cot Available',

  // Pet
  'Pet Friendly',

  // Work
  'Desk',
  'Work Space',
].sort();

/**
 * Currency options
 */
export const CURRENCY_OPTIONS = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
];

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: string): string {
  const currency = CURRENCY_OPTIONS.find(c => c.code === code);
  return currency?.symbol || code;
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string = 'EUR'): string {
  const symbol = getCurrencySymbol(currency);

  // For EUR, NOK, SEK - symbol after number
  if (['EUR', 'NOK', 'SEK'].includes(currency)) {
    return `${symbol}${price.toFixed(0)}`;
  }

  // For USD, GBP - symbol before number
  return `${symbol}${price.toFixed(0)}`;
}
