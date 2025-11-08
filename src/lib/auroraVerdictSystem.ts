/**
 * Aurora Verdict System - Refactored with Geomagnetic Coordinates
 * Separates aurora intensity (physical property) from visibility probability (location-dependent)
 * Uses IGRF-based geomagnetic coordinates for accurate visibility predictions
 */

import {
  toGeomagneticCoordinates,
  getAuroralOvalLatitude,
  calculateAuroraVisibility,
  REFERENCE_CITIES,
} from "./geomagneticCoordinates";

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
  if (bz > 10) return "Strong Northward";
  if (bz > 5) return "Moderate Northward";
  if (bz > 0) return "Weak Northward";
  if (bz >= -5) return "Weak Southward";
  if (bz >= -10) return "Moderate Southward";
  if (bz >= -20) return "Strong Southward";
  return "Extreme Southward";
}

function classifyBt(bt: number): string {
  if (bt < 5) return "Very Weak";
  if (bt < 10) return "Weak";
  if (bt < 15) return "Moderate";
  if (bt < 20) return "Strong";
  if (bt < 30) return "Very Strong";
  return "Extreme";
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
 * Separates intensity from visibility - scientifically accurate approach
 */
export function calculateAuroraVerdict(
  kp: number,
  bz: number,
  bt: number,
  speed: number,
  density: number
): AuroraVerdict {
  // Classify parameters
  const kpLevel = classifyKp(kp);
  const bzLevel = classifyBz(bz);
  const btLevel = classifyBt(bt);
  const speedLevel = classifySpeed(speed);
  const densityLevel = classifyDensity(density);

  // STEP 1: Calculate Aurora Intensity Score (0-100)
  // This represents the PHYSICAL STRENGTH of the aurora, not visibility probability
  let intensityScore = 0;

  // Kp contribution (0-30 points) - Geomagnetic activity level
  if (kp >= 8) intensityScore += 30;
  else if (kp >= 6) intensityScore += 25;
  else if (kp >= 5) intensityScore += 20;
  else if (kp >= 4) intensityScore += 15;
  else if (kp >= 3) intensityScore += 10;
  else intensityScore += 5;

  // Bz contribution (0-40 points) - MOST IMPORTANT for reconnection
  if (bz < -20) intensityScore += 40;
  else if (bz < -10) intensityScore += 35;
  else if (bz < -5) intensityScore += 25;
  else if (bz < 0) intensityScore += 15;
  else if (bz < 5) intensityScore += 5;
  else intensityScore = Math.max(0, intensityScore - 20); // Northward Bz suppresses activity

  // Speed contribution (0-15 points) - Solar wind ram pressure
  if (speed > 800) intensityScore += 15;
  else if (speed > 650) intensityScore += 12;
  else if (speed > 500) intensityScore += 8;
  else if (speed > 400) intensityScore += 5;
  else intensityScore += 2;

  // Bt contribution (0-10 points) - Total magnetic field strength
  if (bt > 20) intensityScore += 10;
  else if (bt > 15) intensityScore += 8;
  else if (bt > 10) intensityScore += 6;
  else if (bt > 5) intensityScore += 4;
  else intensityScore += 2;

  // Density contribution (0-5 points) - Dynamic pressure
  if (density > 25) intensityScore += 5;
  else if (density > 15) intensityScore += 4;
  else if (density > 7) intensityScore += 3;
  else intensityScore += 1;

  // Cap at 100
  intensityScore = Math.min(100, intensityScore);

  // STEP 2: Calculate Auroral Oval Position using Geomagnetic Coordinates
  const ovalPosition = getAuroralOvalLatitude(kp);

  // Map Intensity Score to Aurora Strength Category
  let strengthCategory = "";
  let strengthEmoji = "";
  let minGeomagneticLat = ovalPosition.equatorwardEdge;
  let visibilityRange = "";
  let alertLevel = "";
  let auroraType = "";
  let auroraColors = "";
  let auroraStructure = "";
  let durationHours = "";
  let certainty = 100; // How certain we are (reduced if conditions are unusual)
  let exampleCities: string[] = [];

  // Determine which reference cities can see aurora based on geomagnetic coordinates
  exampleCities = REFERENCE_CITIES.filter((city) => {
    const { geomagneticLat } = toGeomagneticCoordinates(
      city.geographicLat,
      city.geographicLon
    );
    const visibility = calculateAuroraVisibility(geomagneticLat, kp);
    return visibility.isVisible && visibility.quality !== "none";
  })
    .slice(0, 5) // Show up to 5 example cities
    .map((city) => city.name);

  // Determine strength category based on intensity
  if (intensityScore >= 90) {
    // EXTREME: Auroral oval reaches mid-latitudes
    strengthCategory = "EXTREME AURORA";
    strengthEmoji = "🔴";
    alertLevel = "ALERT: Major Event";
    auroraType = "Extreme";
    auroraColors = "All colors: green, red, purple, blue, pink";
    auroraStructure = "Full-sky corona, rapid pulsations, multiple curtains";
    durationHours = "6-18";
    visibilityRange = `Auroral oval at ${ovalPosition.equatorwardEdge.toFixed(0)}° geomag latitude (visible from major cities)`;
  } else if (intensityScore >= 75) {
    // MAJOR: Strong auroral activity
    strengthCategory = "MAJOR AURORA";
    strengthEmoji = "🟠";
    alertLevel = "ALERT: Significant Event";
    auroraType = "Major";
    auroraColors = "Intense green (557.7 nm), red borders (630 nm), purple edges (427.8 nm)";
    auroraStructure = "Dynamic curtains, possible corona, multiple arcs";
    durationHours = "5-8";
    visibilityRange = `Auroral oval at ${ovalPosition.equatorwardEdge.toFixed(0)}° geomag latitude`;
  } else if (intensityScore >= 60) {
    // STRONG: Good auroral activity
    strengthCategory = "STRONG AURORA";
    strengthEmoji = "🟡";
    alertLevel = "WATCH: Good Conditions";
    auroraType = "Strong";
    auroraColors = "Bright green dominant, red upper borders possible";
    auroraStructure = "Multiple arcs, curtains with rayed structure";
    durationHours = "3-6";
    visibilityRange = `Auroral oval at ${ovalPosition.equatorwardEdge.toFixed(0)}° geomag latitude`;
  } else if (intensityScore >= 45) {
    // MODERATE: Moderate auroral activity
    strengthCategory = "MODERATE AURORA";
    strengthEmoji = "🟢";
    alertLevel = "WATCH: Possible Activity";
    auroraType = "Moderate";
    auroraColors = "Bright green, occasional red at high altitudes";
    auroraStructure = "Clear arcs, some curtain structure";
    durationHours = "2-4";
    visibilityRange = `Auroral oval at ${ovalPosition.equatorwardEdge.toFixed(0)}° geomag latitude`;
  } else if (intensityScore >= 30) {
    // MINOR: Minor auroral activity
    strengthCategory = "MINOR AURORA";
    strengthEmoji = "🔵";
    alertLevel = "MONITOR: Weak Activity";
    auroraType = "Minor";
    auroraColors = "Green dominant, faint yellow-green";
    auroraStructure = "Faint arcs, diffuse patches";
    durationHours = "1-2";
    visibilityRange = `Auroral oval at ${ovalPosition.equatorwardEdge.toFixed(0)}° geomag latitude`;
  } else if (intensityScore >= 15) {
    // WEAK: Weak auroral activity
    strengthCategory = "WEAK AURORA";
    strengthEmoji = "⚪";
    alertLevel = "STANDBY: Minimal Activity";
    auroraType = "Weak";
    auroraColors = "Faint green, whitish to naked eye";
    auroraStructure = "Diffuse glow, faint arcs near horizon";
    durationHours = "0.5-1";
    visibilityRange = `Auroral oval at ${ovalPosition.equatorwardEdge.toFixed(0)}° geomag latitude`;
  } else {
    // NO AURORA: No significant activity
    strengthCategory = "NO AURORA";
    strengthEmoji = "⚫";
    alertLevel = "QUIET: No Activity";
    auroraType = "None";
    auroraColors = "";
    auroraStructure = "";
    durationHours = "0";
    visibilityRange = "No auroral activity";
    exampleCities = [];
  }

  // STEP 3: Physics Validation
  let physicsFlag = "✅ PHYSICALLY VALID";
  let physicsNotes = "Normal conditions";

  // Check for impossible combinations
  if (kp >= 8 && bz > 0) {
    physicsFlag = "⛔ PHYSICALLY IMPOSSIBLE";
    physicsNotes = "Severe storm cannot occur with northward Bz (no energy input)";
    certainty = 0;
    intensityScore = 0;
    strengthCategory = "NO AURORA";
    strengthEmoji = "⚫";
    minGeomagneticLat = 70;
    visibilityRange = "Invalid conditions - check data quality";
    exampleCities = [];
  } else if (kp >= 8 && speed < 400 && density < 3) {
    physicsFlag = "⛔ PHYSICALLY IMPOSSIBLE";
    physicsNotes = "Severe storm requires energetic solar wind driver";
    certainty = 0;
    intensityScore = 0;
    strengthCategory = "NO AURORA";
    strengthEmoji = "⚫";
    minGeomagneticLat = 70;
    visibilityRange = "Invalid conditions - check data quality";
    exampleCities = [];
  } else if (kp >= 6 && bz > 10 && speed < 500) {
    physicsFlag = "⚠️ HIGHLY UNLIKELY";
    physicsNotes = "Strong storm with northward Bz is very rare";
    certainty = 30;
  } else if (speed > 800 && density < 3) {
    physicsFlag = "⚠️ RARE BUT POSSIBLE";
    physicsNotes = "UNUSUAL: Rarefied high-speed stream (coronal hole)";
    certainty = 75;
  } else if (speed < 400 && density > 25) {
    physicsFlag = "⚠️ RARE BUT POSSIBLE";
    physicsNotes = "UNUSUAL: High density with slow speed (compression region)";
    certainty = 75;
  } else if (kp < 4 && bz < -10 && speed > 600) {
    physicsFlag = "⚠️ TIMING-DEPENDENT";
    physicsNotes = "Kp lag: Storm onset, Kp hasn't risen yet. Conditions may rapidly improve!";
    certainty = 90;
  } else if (kp >= 7 && bz > 0) {
    physicsFlag = "⚠️ TIMING-DEPENDENT";
    physicsNotes = "Kp persistence: Storm ending, Bz turned northward. Activity declining.";
    certainty = 85;
  }

  // Certainty description
  let likelihood = "";
  if (certainty >= 95) likelihood = "Very certain";
  else if (certainty >= 85) likelihood = "Highly confident";
  else if (certainty >= 70) likelihood = "Confident";
  else if (certainty >= 50) likelihood = "Moderately confident";
  else if (certainty >= 30) likelihood = "Low confidence";
  else likelihood = "Very low confidence";

  // STEP 4: Generate Viewing Tips based on Intensity & Location
  let viewingTip = "";
  if (intensityScore >= 90) {
    viewingTip = "ONCE-IN-A-LIFETIME EVENT! Visible from major cities. Drop everything and go NOW!";
  } else if (intensityScore >= 75) {
    viewingTip = "Major aurora event! Visible from mid-latitudes. Head to dark location immediately.";
  } else if (intensityScore >= 60) {
    viewingTip = "Strong aurora! Excellent viewing from northern Europe/North America. Plan your trip now.";
  } else if (intensityScore >= 45) {
    viewingTip = "Moderate aurora activity. Good viewing from Scotland, Scandinavia, Alaska, Canada.";
  } else if (intensityScore >= 30) {
    viewingTip = "Minor aurora. Visible from Iceland, Northern Scandinavia, Northern Canada. Worth checking if you're there.";
  } else if (intensityScore >= 15) {
    viewingTip = "Weak aurora. Only visible from Arctic locations (Tromsø, Reykjavik). May be faint.";
  } else if (bz > 0) {
    viewingTip = "Northward Bz blocking - wait for Bz to turn southward";
  } else if (speed < 400 && kp < 3) {
    viewingTip = "Slow, quiet solar wind - very low energy. Check back later.";
  } else {
    viewingTip = "Conditions not favorable - only polar cusp aurora possible at extreme latitudes.";
  }

  // Special case: Theta Aurora (northward IMF aurora)
  if (bz > 10 && kp <= 2) {
    viewingTip = "Possible Theta Aurora (rare polar cap aurora, >75° latitude only)";
  }

  // Add Kp lag warnings to viewing tip
  if (kp < 4 && bz < -10 && speed > 600) {
    viewingTip += " ⚠️ NOTE: Kp index lagging - activity may intensify soon!";
  } else if (kp >= 7 && bz > 0) {
    viewingTip += " ⚠️ NOTE: Storm weakening - activity declining despite high Kp.";
  }

  return {
    // Aurora Physical Properties
    intensityScore,
    strengthCategory,
    strengthEmoji,

    // Visibility Information (Geomagnetic-based)
    minGeomagneticLat,
    visibilityRange,
    exampleCities,
    certainty,

    // Auroral Oval Information
    ovalPosition,

    // Physics validation
    physicsFlag,
    physicsNotes,

    // User guidance
    alertLevel,
    viewingTip,

    // Aurora characteristics
    auroraType,
    auroraColors,
    auroraStructure,
    durationHours,

    // Legacy fields (for backward compatibility)
    probability: intensityScore, // Now represents intensity, not visibility
    verdictCategory: strengthCategory,
    verdictEmoji: strengthEmoji,
    likelihood,
    latitudeReach: visibilityRange,
    minLatitude: minGeomagneticLat, // Deprecated - now represents geomagnetic latitude
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
