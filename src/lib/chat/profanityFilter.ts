/**
 * Profanity Filter Utility for Chat Messages
 *
 * Automatically detects and filters inappropriate language in chat messages
 * Uses the 'bad-words' npm package with custom word list support
 */

// Use require for bad-words (CommonJS module)
let filter: any = null;

try {
  const FilterModule = require('bad-words');
  const Filter = FilterModule.default || FilterModule;
  filter = new Filter();
} catch (error) {
  console.warn('⚠️  bad-words module not properly loaded. Profanity filter will be disabled.');
  // Create a mock filter for development
  filter = {
    isProfane: () => false,
    clean: (text: string) => text,
    list: [],
    addWords: () => {},
    removeWords: () => {},
  };
}

// Custom words to add to the filter (can be configured based on community feedback)
const customBadWords = [
  // Add custom inappropriate words here if needed
  // Example: 'spam', 'scam', etc.
];

// Add custom words to filter
if (customBadWords.length > 0) {
  filter.addWords(...customBadWords);
}

/**
 * Check if text contains profanity
 */
export function containsProfanity(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  return filter.isProfane(text);
}

/**
 * Filter profanity from text (replaces with asterisks)
 */
export function filterProfanity(text: string): {
  cleanText: string;
  hasProfanity: boolean;
  originalText: string;
} {
  if (!text || text.trim().length === 0) {
    return {
      cleanText: text,
      hasProfanity: false,
      originalText: text,
    };
  }

  const hasProfanity = filter.isProfane(text);
  const cleanText = hasProfanity ? filter.clean(text) : text;

  return {
    cleanText,
    hasProfanity,
    originalText: text,
  };
}

/**
 * Add custom words to the profanity filter (admin only)
 */
export function addCustomWords(...words: string[]): void {
  filter.addWords(...words);
  console.log(`Added ${words.length} custom words to profanity filter`);
}

/**
 * Remove words from the profanity filter (admin only)
 */
export function removeWords(...words: string[]): void {
  filter.removeWords(...words);
  console.log(`Removed ${words.length} words from profanity filter`);
}

/**
 * Get list of filtered words (for debugging/admin purposes)
 */
export function getFilteredWords(): string[] {
  return filter.list;
}

/**
 * Check text and provide detailed profanity information
 */
export function analyzeProfanity(text: string): {
  isProfane: boolean;
  cleanText: string;
  profanityCount: number;
  severity: 'none' | 'low' | 'medium' | 'high';
} {
  if (!text || text.trim().length === 0) {
    return {
      isProfane: false,
      cleanText: text,
      profanityCount: 0,
      severity: 'none',
    };
  }

  const isProfane = filter.isProfane(text);
  const cleanText = isProfane ? filter.clean(text) : text;

  // Count number of profane words
  const words = text.toLowerCase().split(/\s+/);
  const profanityCount = words.filter((word) => {
    // Remove punctuation for better matching
    const cleanWord = word.replace(/[^\w]/g, '');
    return filter.isProfane(cleanWord);
  }).length;

  // Determine severity based on count
  let severity: 'none' | 'low' | 'medium' | 'high' = 'none';
  if (profanityCount > 0) {
    if (profanityCount === 1) severity = 'low';
    else if (profanityCount === 2) severity = 'medium';
    else severity = 'high';
  }

  return {
    isProfane,
    cleanText,
    profanityCount,
    severity,
  };
}

/**
 * Example usage:
 *
 * // Basic check
 * const { cleanText, hasProfanity } = filterProfanity("This is a bad word");
 *
 * // Detailed analysis
 * const analysis = analyzeProfanity("Multiple bad words here");
 * if (analysis.severity === 'high') {
 *   // Take additional action (e.g., auto-mute user)
 * }
 */
