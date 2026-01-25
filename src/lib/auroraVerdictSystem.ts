/**
 * Aurora Verdict System - Permutation-Based Probability Calculation
 * Uses 3,125 pre-calculated permutations for scientifically-validated predictions
 * Combines permutation lookup with geomagnetic coordinate calculations
 *
 * Enhanced with:
 * - Hp30 index support (faster response than Kp)
 * - Newell coupling function integration
 * - Real magnetometer data support
 */

import {
  toGeomagneticCoordinates,
  getAuroralOvalLatitude,
  calculateAuroraVisibility,
  REFERENCE_CITIES,
} from "./geomagneticCoordinates";

import { lookupPermutation, AuroraPermutation } from "./auroraPermutations";
import { calculateNewellCoupling, NewellCouplingResult } from "./newellCoupling";

// Optional enhanced inputs for more accurate predictions
export interface EnhancedInputs {
  hp30?: number; // Half-hourly Hp index (more responsive than Kp)
  hp60?: number; // Hourly Hp index
  imfBy?: number; // IMF By component for Newell coupling
  magnetometerDeltaB?: number; // Ground magnetometer reading in nT
  substormPhase?: "quiet" | "growth" | "onset" | "expansion" | "recovery";
}

export interface AuroraVerdict {
  // Aurora Physical Properties
  intensityScore: number; // 0-100: How strong the aurora is
  strengthCategory: string; // EXTREME, MAJOR, STRONG, etc.
  strengthEmoji: string;

  // Visibility Information (Geomagnetic-based)
  minGeomagneticLat: number; // Minimum geomagnetic latitude where aurora is visible
  visibilityRange: string; // Human-readable visibility description
  exampleCities: string[]; // Cities where aurora is currently visible
  certainty: number; // 0-100: How certain we are about the intensity

  // Auroral Oval Information
  ovalPosition: {
    equatorwardEdge: number;
    centerLat: number;
    polewardEdge: number;
  };

  // Physics Validation
  physicsFlag: string;
  physicsNotes: string;

  // User Guidance
  alertLevel: string;
  viewingTip: string;

  // Aurora Characteristics
  auroraType: string;
  auroraColors: string;
  auroraStructure: string;
  durationHours: string;

  // Legacy (for backward compatibility)
  probability: number; // Now represents certainty, not visibility
  verdictCategory: string;
  verdictEmoji: string;
  likelihood: string;
  latitudeReach: string;
  minLatitude: number; // Deprecated - use minGeomagneticLat instead

  // Enhanced data (when available)
  newellCoupling?: NewellCouplingResult;
  hp30Warning?: string | null; // Warning if Hp30 differs from Kp
  substormBoost?: number; // Additional confidence from magnetometer data
}

// Parameter classification functions
function classifyKp(kp: number): string {
  if (kp <= 2) return "Quiet";
  if (kp === 3) return "Unsettled";
  if (kp <= 5) return "Minor Storm";
  if (kp <= 7) return "Strong Storm";
  return "Severe Storm";
}

function classifyBz(bz: number): string {
  // 5 levels matching permutation table
  if (bz > 5) return "Strong Northward";
  if (bz > 0) return "Weak Northward";
  if (bz >= -5) return "Weak Southward";
  if (bz >= -10) return "Moderate Southward";
  return "Strong Southward"; // Bz < -10
}

function classifyBt(bt: number): string {
  // 5 levels matching permutation table
  if (bt < 5) return "Very Weak";
  if (bt < 10) return "Weak";
  if (bt < 15) return "Moderate";
  if (bt < 25) return "Strong";
  return "Very Strong"; // Bt >= 25
}

function classifySpeed(speed: number): string {
  if (speed < 400) return "Slow";
  if (speed < 500) return "Moderate";
  if (speed < 650) return "Fast";
  if (speed < 800) return "Very Fast";
  return "Extreme";
}

function classifyDensity(density: number): string {
  if (density < 3) return "Very Low";
  if (density < 7) return "Low";
  if (density < 15) return "Normal";
  if (density < 25) return "High";
  return "Very High";
}

/**
 * Calculate aurora verdict based on current space weather parameters
 * Uses 3,125 pre-calculated permutations for scientifically-accurate predictions
 *
 * @param kp - Kp index (0-9)
 * @param bz - IMF Bz component (nT, negative = southward)
 * @param bt - Total IMF magnitude (nT)
 * @param speed - Solar wind speed (km/s)
 * @param density - Solar wind density (particles/cm³)
 * @param enhanced - Optional enhanced inputs for more accurate predictions
 */
export function calculateAuroraVerdict(
  kp: number,
  bz: number,
  bt: number,
  speed: number,
  density: number,
  enhanced?: EnhancedInputs
): AuroraVerdict {
  // Use Hp30 if available and significantly different from Kp
  // Hp30 is more responsive and catches activity changes faster
  const effectiveKp = enhanced?.hp30 ?? kp;
  const hp30Warning = enhanced?.hp30 && Math.abs(enhanced.hp30 - kp) >= 2
    ? enhanced.hp30 > kp
      ? "Hp30 is higher - activity may be increasing faster than Kp shows"
      : "Hp30 is lower - activity may be decreasing"
    : null;

  // Calculate Newell coupling function for additional insight
  let newellCoupling: NewellCouplingResult | undefined;
  if (enhanced?.imfBy !== undefined) {
    newellCoupling = calculateNewellCoupling({
      solarWindSpeed: speed,
      imfBz: bz,
      imfBy: enhanced.imfBy,
      imfBt: bt,
    });
  }

  // Substorm boost - magnetometer data can increase confidence
  let substormBoost = 0;
  if (enhanced?.magnetometerDeltaB) {
    if (enhanced.magnetometerDeltaB >= 500) {
      substormBoost = 20; // Strong substorm activity
    } else if (enhanced.magnetometerDeltaB >= 300) {
      substormBoost = 15; // Moderate substorm
    } else if (enhanced.magnetometerDeltaB >= 100) {
      substormBoost = 10; // Minor substorm
    }
  }

  // Add boost for active substorm phases
  if (enhanced?.substormPhase === "expansion") {
    substormBoost = Math.max(substormBoost, 25);
  } else if (enhanced?.substormPhase === "onset") {
    substormBoost = Math.max(substormBoost, 15);
  }
  // STEP 1: Classify parameters into levels
  const kpLevel = classifyKp(effectiveKp);
  const bzLevel = classifyBz(bz);
  const btLevel = classifyBt(bt);
  const speedLevel = classifySpeed(speed);
  const densityLevel = classifyDensity(density);

  // STEP 2: Look up the permutation from the pre-calculated table
  const permutation = lookupPermutation(kpLevel, bzLevel, btLevel, speedLevel, densityLevel);

  // STEP 3: Calculate Auroral Oval Position using Geomagnetic Coordinates
  const ovalPosition = getAuroralOvalLatitude(effectiveKp);

  // STEP 4: Determine which reference cities can see aurora
  const exampleCities = REFERENCE_CITIES.filter((city) => {
    const { geomagneticLat } = toGeomagneticCoordinates(
      city.geographicLat,
      city.geographicLon
    );
    const visibility = calculateAuroraVisibility(geomagneticLat, effectiveKp);
    return visibility.isVisible && visibility.quality !== "none";
  })
    .slice(0, 5)
    .map((city) => city.name);

  // STEP 5: Extract data from permutation or use defaults
  if (!permutation) {
    // Fallback if permutation not found (shouldn't happen with valid data)
    console.warn(`Permutation not found for: ${kpLevel}|${bzLevel}|${btLevel}|${speedLevel}|${densityLevel}`);
    return createDefaultVerdict(ovalPosition, exampleCities);
  }

  // Map probability to intensity score (0-100)
  const intensityScore = Math.round(permutation.probability);

  // Extract strength category and emoji from verdict category
  const { strengthCategory, strengthEmoji } = parseVerdictCategory(permutation.verdictCategory);

  // Parse latitude reach from permutation
  const minGeomagneticLat = parseLatitudeReach(permutation.latitudeReach, ovalPosition.equatorwardEdge);

  // Determine certainty based on physics flag
  let certainty = parseCertainty(permutation.physicsFlag, permutation.physicsNotes, effectiveKp, bz, speed);

  // Apply substorm boost to certainty
  if (substormBoost > 0) {
    certainty = Math.min(100, certainty + substormBoost);
  }

  // Apply Newell coupling boost
  if (newellCoupling && newellCoupling.isFavorable) {
    certainty = Math.min(100, certainty + 5);
  }

  // Generate visibility range description
  const visibilityRange = intensityScore > 10
    ? `Auroral oval at ${ovalPosition.equatorwardEdge.toFixed(0)}° geomag latitude`
    : "No auroral activity";

  // Determine likelihood description
  const likelihood = permutation.likelihood || determineLikelihood(certainty);

  // Add dynamic warnings to viewing tip
  let viewingTip = permutation.viewingTip || "";
  if (kp < 4 && bz < -10 && speed > 600) {
    viewingTip += " ⚠️ NOTE: Kp index lagging - activity may intensify soon!";
  } else if (kp >= 7 && bz > 0) {
    viewingTip += " ⚠️ NOTE: Storm weakening - activity declining despite high Kp.";
  }

  return {
    // Aurora Physical Properties (from permutation)
    intensityScore,
    strengthCategory,
    strengthEmoji,

    // Visibility Information (Geomagnetic-based)
    minGeomagneticLat,
    visibilityRange,
    exampleCities: intensityScore > 10 ? exampleCities : [],
    certainty,

    // Auroral Oval Information
    ovalPosition,

    // Physics validation (from permutation)
    physicsFlag: permutation.physicsFlag,
    physicsNotes: permutation.physicsNotes,

    // User guidance (from permutation)
    alertLevel: permutation.alertLevel,
    viewingTip,

    // Aurora characteristics (from permutation)
    auroraType: permutation.auroraType,
    auroraColors: permutation.auroraColors,
    auroraStructure: permutation.auroraStructure,
    durationHours: permutation.durationHours,

    // Legacy fields (for backward compatibility)
    probability: intensityScore,
    verdictCategory: strengthCategory,
    verdictEmoji: strengthEmoji,
    likelihood,
    latitudeReach: visibilityRange,
    minLatitude: minGeomagneticLat,

    // Enhanced data (when available)
    newellCoupling,
    hp30Warning,
    substormBoost: substormBoost > 0 ? substormBoost : undefined,
  };
}

/**
 * Parse verdict category string to extract strength category and emoji
 */
function parseVerdictCategory(verdictCategory: string): { strengthCategory: string; strengthEmoji: string } {
  if (verdictCategory.includes("EXTREME")) {
    return { strengthCategory: "EXTREME AURORA", strengthEmoji: "🔴" };
  } else if (verdictCategory.includes("MAJOR")) {
    return { strengthCategory: "MAJOR AURORA", strengthEmoji: "🟠" };
  } else if (verdictCategory.includes("STRONG")) {
    return { strengthCategory: "STRONG AURORA", strengthEmoji: "🟡" };
  } else if (verdictCategory.includes("MODERATE")) {
    return { strengthCategory: "MODERATE AURORA", strengthEmoji: "🟢" };
  } else if (verdictCategory.includes("MINOR")) {
    return { strengthCategory: "MINOR AURORA", strengthEmoji: "🔵" };
  } else if (verdictCategory.includes("WEAK")) {
    return { strengthCategory: "WEAK AURORA", strengthEmoji: "⚪" };
  } else {
    return { strengthCategory: "NO AURORA", strengthEmoji: "⚫" };
  }
}

/**
 * Parse latitude reach string to extract numeric value
 */
function parseLatitudeReach(latitudeReach: string, defaultLat: number): number {
  if (!latitudeReach) return defaultLat;

  // Parse formats like "<40°", "45-50°", ">70°", "40-45° (rare)"
  const match = latitudeReach.match(/<?(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return defaultLat;
}

/**
 * Determine certainty based on physics validation
 */
function parseCertainty(physicsFlag: string, physicsNotes: string, kp: number, bz: number, speed: number): number {
  if (physicsFlag.includes("IMPOSSIBLE")) {
    return 0;
  } else if (physicsFlag.includes("HIGHLY UNLIKELY")) {
    return 30;
  } else if (physicsFlag.includes("RARE BUT POSSIBLE")) {
    return 75;
  } else if (physicsFlag.includes("TIMING-DEPENDENT")) {
    // Check specific timing conditions
    if (kp < 4 && bz < -10 && speed > 600) {
      return 90; // Storm onset, Kp lagging
    } else if (kp >= 7 && bz > 0) {
      return 85; // Storm ending
    }
    return 85;
  }
  return 100;
}

/**
 * Determine likelihood description from certainty
 */
function determineLikelihood(certainty: number): string {
  if (certainty >= 95) return "Near-certain (95-100%)";
  if (certainty >= 85) return "Very likely (85-95%)";
  if (certainty >= 70) return "Likely (70-85%)";
  if (certainty >= 50) return "Possible (50-70%)";
  if (certainty >= 30) return "Unlikely (30-50%)";
  if (certainty >= 10) return "Very unlikely (10-30%)";
  return "Very unlikely (0-10%)";
}

/**
 * Create a default verdict when permutation lookup fails
 */
function createDefaultVerdict(
  ovalPosition: { equatorwardEdge: number; centerLat: number; polewardEdge: number },
  exampleCities: string[]
): AuroraVerdict {
  return {
    intensityScore: 0,
    strengthCategory: "NO AURORA",
    strengthEmoji: "⚫",
    minGeomagneticLat: 70,
    visibilityRange: "Data unavailable",
    exampleCities: [],
    certainty: 0,
    ovalPosition,
    physicsFlag: "⚠️ DATA ERROR",
    physicsNotes: "Permutation lookup failed - check input data",
    alertLevel: "QUIET: No Activity",
    viewingTip: "Unable to calculate - check back later",
    auroraType: "",
    auroraColors: "",
    auroraStructure: "",
    durationHours: "0",
    probability: 0,
    verdictCategory: "NO AURORA",
    verdictEmoji: "⚫",
    likelihood: "Unknown",
    latitudeReach: "Unknown",
    minLatitude: 70,
  };
}

/**
 * Get color for verdict category
 */
export function getVerdictColor(verdictEmoji: string): {
  bg: string;
  border: string;
  text: string;
} {
  switch (verdictEmoji) {
    case "🔴": // EXTREME
      return {
        bg: "bg-red-500/20",
        border: "border-red-500",
        text: "text-red-200",
      };
    case "🟠": // MAJOR
      return {
        bg: "bg-orange-500/20",
        border: "border-orange-500",
        text: "text-orange-200",
      };
    case "🟡": // STRONG
      return {
        bg: "bg-yellow-500/20",
        border: "border-yellow-500",
        text: "text-yellow-200",
      };
    case "🟢": // MODERATE
      return {
        bg: "bg-green-500/20",
        border: "border-green-500",
        text: "text-green-200",
      };
    case "🔵": // MINOR
      return {
        bg: "bg-blue-500/20",
        border: "border-blue-500",
        text: "text-blue-200",
      };
    case "⚪": // WEAK
      return {
        bg: "bg-gray-500/20",
        border: "border-gray-500",
        text: "text-gray-200",
      };
    default: // NO AURORA
      return {
        bg: "bg-gray-900/20",
        border: "border-gray-700",
        text: "text-gray-400",
      };
  }
}
