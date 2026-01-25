/**
 * Substorm Detection Library
 *
 * Real substorm detection using magnetometer data, replacing Kp-proxy methods.
 * Substorms are the primary driver of visible aurora at mid-latitudes.
 *
 * Substorm Phases:
 * 1. Growth Phase (30-60 min): Energy loading, magnetic field stretches
 * 2. Onset/Expansion (~5-15 min): Sudden brightening, rapid aurora expansion
 * 3. Recovery Phase (1-2 hours): Aurora fades, magnetic field relaxes
 *
 * Detection Methods:
 * - Magnetometer delta-B: Measures ground magnetic perturbation in nT
 * - AL/AU indices: Electrojet strength indicators
 * - Pi2 pulsations: 40-150 second oscillations at onset
 */

export interface SubstormState {
  phase: "quiet" | "growth" | "onset" | "expansion" | "recovery";
  phaseStartTime: Date | null;
  timeInPhase: number; // minutes
  confidence: number; // 0-1

  // Energy loading (growth phase indicator)
  energyLoadingLevel: number; // 0-100%
  energyLoadingRate: number; // % per minute
  estimatedTimeToOnset: number | null; // minutes

  // Expansion indicators
  peakDeltaB: number; // nT
  currentDeltaB: number; // nT
  deltaBAverageRecent: number; // nT (last 10 min)

  // Geographic extent
  affectedLatitudeRange: {
    equatorwardEdge: number;
    polewardEdge: number;
  };
  expansionDirection: "equatorward" | "poleward" | "both" | "none";

  // Timing predictions
  expectedPeakTime: Date | null;
  expectedRecoveryStart: Date | null;

  // Alert information
  alertLevel: "none" | "watch" | "warning" | "alert";
  alertMessage: string;
}

export interface MagnetometerData {
  stationCode: string;
  timestamp: Date;
  deltaB: number; // Total perturbation in nT
  bx?: number;
  by?: number;
  bz?: number;
  latitude: number;
  geomagLat: number;
}

export interface SubstormDetectionInput {
  magnetometerData: MagnetometerData[];
  currentKp: number;
  currentBz: number; // IMF Bz in nT
  solarWindSpeed: number; // km/s
  previousState?: SubstormState;
}

// Thresholds for substorm detection (based on scientific literature)
const THRESHOLDS = {
  // Delta B thresholds (nT)
  QUIET_MAX: 50, // Below this = quiet
  GROWTH_MIN: 50, // Energy loading begins
  ONSET_MIN: 150, // Substorm onset
  EXPANSION_MODERATE: 300, // Moderate substorm
  EXPANSION_STRONG: 500, // Strong substorm
  EXPANSION_INTENSE: 1000, // Intense substorm

  // Rate of change thresholds (nT/min)
  ONSET_RATE: 20, // Rapid increase indicates onset
  RECOVERY_RATE: -10, // Declining indicates recovery

  // IMF Bz thresholds for energy loading
  BZ_STRONGLY_SOUTH: -10, // Strong energy input
  BZ_MODERATELY_SOUTH: -5, // Moderate energy input
  BZ_NEUTRAL: 0,

  // Typical phase durations (minutes)
  GROWTH_TYPICAL_DURATION: 45, // 30-60 min typical
  EXPANSION_TYPICAL_DURATION: 20, // 15-30 min typical
  RECOVERY_TYPICAL_DURATION: 90, // 60-120 min typical
};

/**
 * Analyze magnetometer data to detect substorm phase
 */
export function detectSubstormPhase(
  input: SubstormDetectionInput
): SubstormState {
  const {
    magnetometerData,
    currentKp,
    currentBz,
    solarWindSpeed,
    previousState,
  } = input;

  const now = new Date();

  // Calculate current delta B statistics
  const recentData = magnetometerData.filter(
    (d) => now.getTime() - d.timestamp.getTime() < 10 * 60 * 1000 // Last 10 min
  );

  const currentDeltaB =
    recentData.length > 0
      ? Math.max(...recentData.map((d) => d.deltaB))
      : 0;

  const deltaBAverageRecent =
    recentData.length > 0
      ? recentData.reduce((sum, d) => sum + d.deltaB, 0) / recentData.length
      : 0;

  // Calculate rate of change
  const olderData = magnetometerData.filter((d) => {
    const age = now.getTime() - d.timestamp.getTime();
    return age >= 10 * 60 * 1000 && age < 20 * 60 * 1000; // 10-20 min ago
  });

  const deltaBOlder =
    olderData.length > 0
      ? olderData.reduce((sum, d) => sum + d.deltaB, 0) / olderData.length
      : deltaBAverageRecent;

  const deltaRate = (deltaBAverageRecent - deltaBOlder) / 10; // nT per minute

  // Calculate energy loading based on IMF conditions
  const energyLoadingRate = calculateEnergyLoadingRate(
    currentBz,
    solarWindSpeed
  );
  const energyLoadingLevel = calculateEnergyLoadingLevel(
    currentBz,
    solarWindSpeed,
    currentKp,
    previousState?.energyLoadingLevel || 0
  );

  // Determine phase
  let phase: SubstormState["phase"] = "quiet";
  let confidence = 0;
  let phaseStartTime = previousState?.phaseStartTime || null;
  let alertLevel: SubstormState["alertLevel"] = "none";
  let alertMessage = "";

  // Phase detection logic
  if (currentDeltaB >= THRESHOLDS.EXPANSION_MODERATE) {
    // Strong activity - expansion phase
    phase = "expansion";
    confidence = Math.min(1, currentDeltaB / THRESHOLDS.EXPANSION_STRONG);

    if (previousState?.phase !== "expansion") {
      phaseStartTime = now;
    }

    alertLevel = currentDeltaB >= THRESHOLDS.EXPANSION_INTENSE ? "alert" : "warning";
    alertMessage = `Substorm expansion in progress! Peak activity: ${currentDeltaB.toFixed(0)} nT`;
  } else if (currentDeltaB >= THRESHOLDS.ONSET_MIN || deltaRate >= THRESHOLDS.ONSET_RATE) {
    // Rapid increase or elevated activity - onset
    phase = "onset";
    confidence = Math.min(1, (deltaRate + 10) / 30);

    if (previousState?.phase !== "onset" && previousState?.phase !== "expansion") {
      phaseStartTime = now;
    }

    alertLevel = "warning";
    alertMessage = "Substorm onset detected! Aurora activity increasing.";
  } else if (previousState?.phase === "expansion" && deltaRate < THRESHOLDS.RECOVERY_RATE) {
    // Declining from expansion - recovery
    phase = "recovery";
    confidence = 0.7;

    // Always update phase start time when transitioning to recovery
    phaseStartTime = now;

    alertLevel = "watch";
    alertMessage = "Substorm recovery phase. Aurora still visible but fading.";
  } else if (currentDeltaB >= THRESHOLDS.GROWTH_MIN || energyLoadingLevel > 30) {
    // Elevated energy but not onset - growth phase
    phase = "growth";
    confidence = Math.min(1, energyLoadingLevel / 80);

    if (previousState?.phase !== "growth") {
      phaseStartTime = now;
    }

    alertLevel = energyLoadingLevel > 60 ? "watch" : "none";
    alertMessage = energyLoadingLevel > 60
      ? "Energy loading detected. Substorm possible within 30-60 minutes."
      : "";
  } else if (previousState?.phase === "recovery") {
    // Still in recovery if coming from recovery
    phase = "recovery";
    confidence = 0.5;

    // Check if recovery is complete
    const recoveryDuration = phaseStartTime
      ? (now.getTime() - phaseStartTime.getTime()) / 60000
      : 0;

    if (recoveryDuration > THRESHOLDS.RECOVERY_TYPICAL_DURATION || currentDeltaB < THRESHOLDS.QUIET_MAX) {
      phase = "quiet";
      phaseStartTime = null;
      confidence = 0.8;
    }
  }

  // Calculate time in phase
  const timeInPhase = phaseStartTime
    ? Math.round((now.getTime() - phaseStartTime.getTime()) / 60000)
    : 0;

  // Estimate time to onset (only in growth phase)
  let estimatedTimeToOnset: number | null = null;
  if (phase === "growth" && energyLoadingRate > 0) {
    const remainingEnergy = 100 - energyLoadingLevel;
    estimatedTimeToOnset = Math.round(remainingEnergy / energyLoadingRate);
    estimatedTimeToOnset = Math.max(5, Math.min(120, estimatedTimeToOnset));
  }

  // Calculate affected latitude range
  const affectedLatitudeRange = calculateAffectedLatitudes(currentDeltaB, currentKp);

  // Determine expansion direction
  let expansionDirection: SubstormState["expansionDirection"] = "none";
  if (phase === "expansion" || phase === "onset") {
    expansionDirection = timeInPhase < 10 ? "poleward" : "equatorward";
    if (timeInPhase > 15) expansionDirection = "both";
  }

  // Predict peak and recovery times
  let expectedPeakTime: Date | null = null;
  let expectedRecoveryStart: Date | null = null;

  if (phase === "onset" || phase === "growth") {
    const minutesToPeak = phase === "onset" ? 10 - timeInPhase : (estimatedTimeToOnset || 30) + 10;
    expectedPeakTime = new Date(now.getTime() + Math.max(5, minutesToPeak) * 60000);
    expectedRecoveryStart = new Date(expectedPeakTime.getTime() + 20 * 60000);
  } else if (phase === "expansion") {
    const minutesToPeak = Math.max(0, THRESHOLDS.EXPANSION_TYPICAL_DURATION - timeInPhase);
    expectedPeakTime = minutesToPeak > 0 ? new Date(now.getTime() + minutesToPeak * 60000) : now;
    expectedRecoveryStart = new Date(expectedPeakTime.getTime() + 10 * 60000);
  }

  // Calculate peak delta B
  const allDeltaB = magnetometerData.map((d) => d.deltaB);
  const peakDeltaB = allDeltaB.length > 0 ? Math.max(...allDeltaB) : 0;

  return {
    phase,
    phaseStartTime,
    timeInPhase,
    confidence,
    energyLoadingLevel,
    energyLoadingRate,
    estimatedTimeToOnset,
    peakDeltaB,
    currentDeltaB,
    deltaBAverageRecent,
    affectedLatitudeRange,
    expansionDirection,
    expectedPeakTime,
    expectedRecoveryStart,
    alertLevel,
    alertMessage,
  };
}

/**
 * Calculate energy loading rate based on IMF conditions
 * Energy loading occurs when Bz is southward
 */
function calculateEnergyLoadingRate(bz: number, solarWindSpeed: number): number {
  if (bz >= 0) {
    return 0; // No loading when Bz is northward
  }

  // Loading rate proportional to -Bz and solar wind speed
  // Typical range: 0.5-3% per minute during active conditions
  const bzFactor = Math.abs(bz) / 10; // Normalize to ~1 at -10 nT
  const speedFactor = solarWindSpeed / 500; // Normalize to ~1 at 500 km/s

  return Math.min(3, bzFactor * speedFactor * 1.5);
}

/**
 * Calculate current energy loading level
 */
function calculateEnergyLoadingLevel(
  bz: number,
  solarWindSpeed: number,
  kp: number,
  previousLevel: number
): number {
  const loadingRate = calculateEnergyLoadingRate(bz, solarWindSpeed);

  // Decay rate when not loading
  const decayRate = 0.5; // % per minute

  let newLevel = previousLevel;

  if (loadingRate > 0) {
    // Energy is loading
    newLevel = Math.min(100, previousLevel + loadingRate);
  } else {
    // Energy is decaying
    newLevel = Math.max(0, previousLevel - decayRate);
  }

  // Kp indicates current state - use it to bound the estimate
  const kpImpliedLevel = kp * 15; // Rough mapping: Kp 6 = 90%
  newLevel = Math.min(newLevel, kpImpliedLevel + 20);

  return Math.round(newLevel);
}

/**
 * Calculate affected latitude range based on activity level
 */
function calculateAffectedLatitudes(
  deltaB: number,
  kp: number
): { equatorwardEdge: number; polewardEdge: number } {
  // Base auroral oval position from Kp
  const baseEquatorward = 67 - 2.5 * kp;
  const basePoleward = 75 - 1.5 * kp;

  // Expand based on delta B (stronger activity = larger oval)
  const expansionFactor = Math.min(1, deltaB / 500);
  const latitudeExpansion = expansionFactor * 5; // Up to 5 degrees

  return {
    equatorwardEdge: Math.max(40, baseEquatorward - latitudeExpansion),
    polewardEdge: Math.min(85, basePoleward + latitudeExpansion * 0.5),
  };
}

/**
 * Get human-readable substorm phase description
 */
export function getSubstormPhaseDescription(phase: SubstormState["phase"]): string {
  switch (phase) {
    case "quiet":
      return "Geomagnetically quiet - minimal aurora activity";
    case "growth":
      return "Growth phase - energy accumulating, substorm possible soon";
    case "onset":
      return "Substorm onset - aurora brightening and expanding";
    case "expansion":
      return "Expansion phase - peak aurora activity, rapid movements";
    case "recovery":
      return "Recovery phase - aurora fading, activity declining";
    default:
      return "Unknown phase";
  }
}

/**
 * Get recommended action based on substorm state
 */
export function getSubstormRecommendation(state: SubstormState): string {
  switch (state.phase) {
    case "quiet":
      if (state.energyLoadingLevel > 20) {
        return "Conditions quiet but energy building. Worth monitoring.";
      }
      return "No significant activity expected. Check back later.";

    case "growth":
      if (state.estimatedTimeToOnset && state.estimatedTimeToOnset < 30) {
        return `Substorm possible in ~${state.estimatedTimeToOnset} minutes. Get ready!`;
      }
      return "Energy loading detected. Keep watching for changes.";

    case "onset":
      return "GO NOW! Aurora activity increasing rapidly. Best viewing in 5-15 minutes.";

    case "expansion":
      return "ACTIVE NOW! Peak aurora conditions. Get outside immediately!";

    case "recovery":
      if (state.currentDeltaB > THRESHOLDS.GROWTH_MIN) {
        return "Still active but declining. Worth viewing if clear skies.";
      }
      return "Activity declining. May see fading aurora for another hour.";

    default:
      return "Monitor conditions for changes.";
  }
}

/**
 * Get color for substorm phase (for UI)
 */
export function getSubstormPhaseColor(phase: SubstormState["phase"]): string {
  switch (phase) {
    case "quiet":
      return "#6b7280"; // gray
    case "growth":
      return "#eab308"; // yellow
    case "onset":
      return "#f97316"; // orange
    case "expansion":
      return "#ef4444"; // red
    case "recovery":
      return "#22c55e"; // green
    default:
      return "#6b7280";
  }
}

export { THRESHOLDS as SUBSTORM_THRESHOLDS };
