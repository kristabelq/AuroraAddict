/**
 * Location-Specific Color Alerts Library
 *
 * Provides personalized "Aurora visible at YOUR latitude NOW" alerts.
 *
 * Alert Levels:
 * - PURPLE: Aurora overhead NOW, Kp 7+ (extreme event)
 * - RED: Aurora visible NOW at your latitude
 * - ORANGE: Aurora likely within 1 hour
 * - YELLOW: Possible tonight, monitor conditions
 * - GREEN: Favorable conditions building
 * - NONE: No significant activity expected
 */

import {
  toGeomagneticCoordinates,
  getAuroralOvalLatitude,
  calculateAuroraVisibility,
} from "@/lib/geomagneticCoordinates";
import { SubstormState } from "@/lib/substormDetection";
import { NewellCouplingResult } from "@/lib/newellCoupling";

export type AlertLevel = "purple" | "red" | "orange" | "yellow" | "green" | "none";

export interface LocationAlertInput {
  // User location
  latitude: number;
  longitude: number;

  // Current conditions
  currentKp: number;
  currentBz: number;
  solarWindSpeed: number;

  // Optional enhanced data
  hp30?: number; // Half-hourly Hp index
  substormState?: SubstormState;
  newellCoupling?: NewellCouplingResult;

  // Time factors
  isDark: boolean;
  moonPhase?: number; // 0-1 (0 = new moon, 0.5 = full moon)
  cloudCover?: number; // 0-100%
}

export interface LocationAlert {
  level: AlertLevel;
  color: string;
  backgroundColor: string;
  title: string;
  message: string;
  action: string;

  // Detailed information
  visibility: {
    quality: "none" | "poor" | "fair" | "good" | "excellent" | "overhead";
    description: string;
  };

  // Timing
  timing: {
    isNow: boolean;
    estimatedTime?: string; // When aurora might be visible
    duration?: string; // How long conditions might last
  };

  // Additional factors
  factors: {
    kpContribution: string;
    bzContribution: string;
    substormContribution?: string;
    moonImpact?: string;
    cloudImpact?: string;
  };
}

// Alert color definitions
const ALERT_COLORS = {
  purple: {
    color: "#9333ea",
    backgroundColor: "rgba(147, 51, 234, 0.2)",
  },
  red: {
    color: "#dc2626",
    backgroundColor: "rgba(220, 38, 38, 0.2)",
  },
  orange: {
    color: "#ea580c",
    backgroundColor: "rgba(234, 88, 12, 0.2)",
  },
  yellow: {
    color: "#eab308",
    backgroundColor: "rgba(234, 179, 8, 0.2)",
  },
  green: {
    color: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  none: {
    color: "#6b7280",
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
};

/**
 * Calculate location-specific alert based on current conditions
 */
export function calculateLocationAlert(input: LocationAlertInput): LocationAlert {
  const {
    latitude,
    longitude,
    currentKp,
    currentBz,
    solarWindSpeed,
    hp30,
    substormState,
    newellCoupling,
    isDark,
    moonPhase,
    cloudCover,
  } = input;

  // Convert to geomagnetic coordinates
  const { geomagneticLat } = toGeomagneticCoordinates(latitude, longitude);
  const absGeomagLat = Math.abs(geomagneticLat);

  // Get auroral oval position
  const ovalPosition = getAuroralOvalLatitude(currentKp);

  // Calculate visibility at user's location
  const visibility = calculateAuroraVisibility(geomagneticLat, currentKp);

  // Use Hp30 if available (more responsive than Kp)
  const effectiveKp = hp30 ?? currentKp;

  // Determine alert level
  let level: AlertLevel = "none";
  let title = "";
  let message = "";
  let action = "";
  let isNow = false;
  let estimatedTime: string | undefined;
  let duration: string | undefined;

  // EARLY EXIT: Too far from auroral zone
  // Aurora is essentially never visible below ~40° geomagnetic latitude
  // unless there's an extreme Kp 8-9 storm (very rare)
  const minLatitudeForAurora = Math.max(35, 67 - effectiveKp * 4); // Kp 8 = 35°, Kp 5 = 47°, Kp 3 = 55°

  if (absGeomagLat < minLatitudeForAurora) {
    // Calculate what Kp would be needed to see aurora at this latitude
    const kpNeeded = Math.ceil((67 - absGeomagLat) / 4);

    // Build factors for the response
    const factors: LocationAlert["factors"] = {
      kpContribution: `Current Kp ${effectiveKp.toFixed(1)} - Need Kp ${kpNeeded}+ for aurora at your latitude`,
      bzContribution: getBzContribution(currentBz),
    };

    if (moonPhase !== undefined) {
      factors.moonImpact = getMoonImpact(moonPhase);
    }
    if (cloudCover !== undefined) {
      factors.cloudImpact = getCloudImpact(cloudCover);
    }

    return {
      level: "none",
      color: ALERT_COLORS.none.color,
      backgroundColor: ALERT_COLORS.none.backgroundColor,
      title: "TOO FAR FROM AURORAL ZONE",
      message: `At ${Math.abs(latitude).toFixed(1)}°${latitude >= 0 ? 'N' : 'S'} (${absGeomagLat.toFixed(1)}° geomagnetic), aurora requires an extreme Kp ${kpNeeded}+ storm. Current Kp is ${effectiveKp.toFixed(1)}.`,
      action: absGeomagLat < 30
        ? "Aurora is not visible at equatorial latitudes. Travel to 60°+ for best chances."
        : `Travel north to 60°+ latitude for regular aurora viewing, or wait for a rare Kp ${kpNeeded}+ storm.`,
      visibility: {
        quality: "none",
        description: `Aurora oval is currently at ${ovalPosition.equatorwardEdge.toFixed(0)}°-${ovalPosition.polewardEdge.toFixed(0)}° geomagnetic latitude`,
      },
      timing: {
        isNow: false,
      },
      factors,
    };
  }

  // PURPLE: Extreme event, aurora overhead
  if (effectiveKp >= 7 && visibility.quality === "overhead") {
    level = "purple";
    title = "AURORA OVERHEAD!";
    message = `Extreme geomagnetic storm (Kp ${effectiveKp}). Aurora is directly overhead at your location!`;
    action = "Look up NOW! This is a rare event.";
    isNow = true;
    duration = "May last 1-3 hours";
  }
  // RED: Aurora visible NOW at user's latitude
  else if (visibility.isVisible && (visibility.quality === "excellent" || visibility.quality === "overhead") && isDark) {
    level = "red";
    title = "AURORA VISIBLE NOW!";
    message = `Aurora is visible at your latitude (${Math.abs(geomagneticLat).toFixed(1)}° geomag). Kp ${effectiveKp.toFixed(1)}.`;
    action = "Go outside now if skies are clear!";
    isNow = true;
    duration = substormState?.phase === "expansion" ? "Peak in 10-20 min" : "Monitor for changes";
  }
  // RED: Substorm expansion phase
  else if (substormState?.phase === "expansion" && visibility.isVisible && isDark) {
    level = "red";
    title = "SUBSTORM ACTIVE!";
    message = `Active substorm in progress. Aurora expanding ${substormState.expansionDirection}ward.`;
    action = "Best viewing right now - aurora is active!";
    isNow = true;
    duration = "10-30 minutes of peak activity";
  }
  // ORANGE: Aurora likely within 1 hour
  else if (
    (substormState?.phase === "onset" && visibility.isVisible) ||
    (effectiveKp >= 5 && visibility.quality !== "none" && isDark)
  ) {
    level = "orange";
    title = "AURORA LIKELY SOON";
    message = substormState?.phase === "onset"
      ? "Substorm onset detected! Aurora brightening expected."
      : `Elevated activity (Kp ${effectiveKp.toFixed(1)}). Aurora may become visible.`;
    action = isDark ? "Check the northern horizon now" : "Be ready when it gets dark";
    estimatedTime = substormState?.estimatedTimeToOnset
      ? `~${substormState.estimatedTimeToOnset} minutes`
      : "Within 1 hour";
  }
  // ORANGE: High coupling, activity building
  else if (newellCoupling && newellCoupling.couplingLevel === "very_high" && isDark) {
    level = "orange";
    title = "STRONG COUPLING DETECTED";
    message = "Solar wind conditions favor aurora. Activity increasing.";
    action = "Monitor conditions - aurora may appear soon";
    estimatedTime = "30-60 minutes";
  }
  // YELLOW: Possible tonight
  else if (
    (effectiveKp >= 4 && geomagneticLat >= 60) ||
    (effectiveKp >= 5 && geomagneticLat >= 55) ||
    substormState?.phase === "growth"
  ) {
    level = "yellow";
    title = "AURORA POSSIBLE";
    message = substormState?.phase === "growth"
      ? `Energy loading detected. Substorm possible in ~${substormState.estimatedTimeToOnset || 30-60} minutes.`
      : `Moderate activity (Kp ${effectiveKp.toFixed(1)}). Aurora possible at your latitude.`;
    action = isDark
      ? "Worth checking periodically"
      : "Monitor conditions as it gets dark";
    estimatedTime = substormState?.estimatedTimeToOnset
      ? `~${substormState.estimatedTimeToOnset} minutes`
      : "Tonight if conditions hold";
  }
  // GREEN: Favorable conditions building
  else if (
    currentBz < -5 ||
    (newellCoupling && newellCoupling.couplingLevel === "moderate") ||
    (solarWindSpeed > 500 && currentBz < 0)
  ) {
    level = "green";
    title = "CONDITIONS BUILDING";
    message = "Southward IMF detected. Energy entering magnetosphere.";
    action = "Keep monitoring - conditions may improve";
    estimatedTime = "Activity may increase in 1-3 hours";
  }
  // NONE: No significant activity
  else {
    level = "none";
    title = "QUIET CONDITIONS";
    message = `Geomagnetic conditions quiet (Kp ${effectiveKp.toFixed(1)}). No aurora expected at your latitude.`;
    action = "Check back later or travel north for better chances";
  }

  // Build factors explanation
  const factors: LocationAlert["factors"] = {
    kpContribution: getKpContribution(effectiveKp),
    bzContribution: getBzContribution(currentBz),
  };

  if (substormState) {
    factors.substormContribution = getSubstormContribution(substormState);
  }

  if (moonPhase !== undefined) {
    factors.moonImpact = getMoonImpact(moonPhase);
  }

  if (cloudCover !== undefined) {
    factors.cloudImpact = getCloudImpact(cloudCover);
  }

  // Adjust message for non-dark conditions
  if (!isDark && level !== "none") {
    message += " (Wait for darkness)";
  }

  // Adjust for cloud cover
  if (cloudCover !== undefined && cloudCover > 70 && level !== "none") {
    action += ` (Note: ${cloudCover}% cloud cover may obstruct view)`;
  }

  return {
    level,
    color: ALERT_COLORS[level].color,
    backgroundColor: ALERT_COLORS[level].backgroundColor,
    title,
    message,
    action,
    visibility: {
      quality: visibility.quality,
      description: visibility.message,
    },
    timing: {
      isNow,
      estimatedTime,
      duration,
    },
    factors,
  };
}

/**
 * Get Kp contribution description
 */
function getKpContribution(kp: number): string {
  if (kp >= 7) return "Extreme storm (Kp 7+) - aurora visible at mid-latitudes";
  if (kp >= 6) return "Strong storm (Kp 6) - aurora visible well south of normal";
  if (kp >= 5) return "Moderate storm (Kp 5) - aurora expands equatorward";
  if (kp >= 4) return "Unsettled (Kp 4) - aurora active in auroral zone";
  if (kp >= 3) return "Minor activity (Kp 3) - aurora possible in auroral zone";
  return "Quiet (Kp < 3) - aurora limited to far north";
}

/**
 * Get Bz contribution description
 */
function getBzContribution(bz: number): string {
  if (bz < -10) return "Strongly southward Bz - excellent energy input";
  if (bz < -5) return "Moderately southward Bz - good energy input";
  if (bz < 0) return "Weakly southward Bz - some energy input";
  if (bz < 5) return "Northward Bz - reduced energy input";
  return "Strongly northward Bz - minimal energy input";
}

/**
 * Get substorm contribution description
 */
function getSubstormContribution(state: SubstormState): string {
  switch (state.phase) {
    case "expansion":
      return `Active substorm - ${state.currentDeltaB.toFixed(0)} nT perturbation`;
    case "onset":
      return "Substorm onset - aurora brightening";
    case "growth":
      return `Energy loading ${state.energyLoadingLevel}% - substorm possible`;
    case "recovery":
      return "Substorm recovery - fading activity";
    default:
      return "No substorm activity";
  }
}

/**
 * Get moon impact description
 */
function getMoonImpact(moonPhase: number): string {
  if (moonPhase < 0.1 || moonPhase > 0.9) {
    return "New moon - excellent dark sky conditions";
  }
  if (moonPhase < 0.25 || moonPhase > 0.75) {
    return "Crescent moon - minimal light interference";
  }
  if (moonPhase < 0.4 || moonPhase > 0.6) {
    return "Quarter moon - some light interference";
  }
  return "Full moon - bright moonlight may reduce visibility";
}

/**
 * Get cloud cover impact description
 */
function getCloudImpact(cloudCover: number): string {
  if (cloudCover < 20) return "Clear skies - excellent visibility";
  if (cloudCover < 40) return "Partly cloudy - good viewing possible";
  if (cloudCover < 60) return "Mostly cloudy - limited viewing windows";
  if (cloudCover < 80) return "Cloudy - viewing difficult";
  return "Overcast - aurora not visible through clouds";
}

/**
 * Calculate alert for multiple locations (for trip planning)
 */
export function compareLocationAlerts(
  locations: Array<{ name: string; latitude: number; longitude: number }>,
  conditions: Omit<LocationAlertInput, "latitude" | "longitude">
): Array<{ name: string; alert: LocationAlert }> {
  return locations
    .map((loc) => ({
      name: loc.name,
      alert: calculateLocationAlert({
        ...conditions,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }),
    }))
    .sort((a, b) => {
      const levelOrder = { purple: 0, red: 1, orange: 2, yellow: 3, green: 4, none: 5 };
      return levelOrder[a.alert.level] - levelOrder[b.alert.level];
    });
}

/**
 * Get notification threshold check
 */
export function shouldNotify(
  alert: LocationAlert,
  userThreshold: number // Kp threshold set by user
): boolean {
  // Always notify for red/purple alerts
  if (alert.level === "purple" || alert.level === "red") {
    return true;
  }

  // Map alert levels to approximate Kp equivalents
  const alertKpEquivalent: Record<AlertLevel, number> = {
    purple: 8,
    red: 6,
    orange: 5,
    yellow: 4,
    green: 3,
    none: 0,
  };

  return alertKpEquivalent[alert.level] >= userThreshold;
}

export { ALERT_COLORS };
