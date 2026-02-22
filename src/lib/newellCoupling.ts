/**
 * Newell Coupling Function Library
 *
 * The Newell coupling function (dΦMP/dt) is the best predictor of auroral power
 * and substorm activity. It measures the rate of magnetic flux opening at the
 * magnetopause due to solar wind-magnetosphere coupling.
 *
 * Formula: dΦMP/dt = v^(4/3) × Bt^(2/3) × sin^(8/3)(θc/2)
 *
 * Where:
 * - v = solar wind speed (km/s)
 * - Bt = transverse IMF component = sqrt(By² + Bz²)
 * - θc = IMF clock angle = atan2(By, Bz)
 *
 * Reference: Newell et al., 2007, JGR
 */

export interface NewellCouplingInput {
  solarWindSpeed: number; // km/s
  imfBz: number; // nT (positive = northward)
  imfBy: number; // nT (positive = dawnward in GSM)
  imfBt?: number; // Total transverse field (optional, calculated if not provided)
}

export interface NewellCouplingResult {
  coupling: number; // dΦMP/dt in Wb/s (Weber per second)
  couplingNormalized: number; // 0-100 scale for UI
  couplingLevel: "very_low" | "low" | "moderate" | "high" | "very_high" | "extreme";

  // Input breakdown
  speedFactor: number;
  btFactor: number;
  clockAngleFactor: number;
  clockAngle: number; // degrees

  // Predicted aurora activity
  predictedHemispherePower: number; // GW
  predictedKp: number;
  predictedAuroralLatitude: number; // Equatorward edge

  // Quality assessment
  isFavorable: boolean;
  favorabilityReason: string;
}

// Coupling thresholds based on statistical analysis
const COUPLING_THRESHOLDS = {
  VERY_LOW: 1000, // Minimal coupling
  LOW: 3000, // Quiet conditions
  MODERATE: 8000, // Unsettled
  HIGH: 15000, // Minor storm
  VERY_HIGH: 25000, // Moderate storm
  EXTREME: 40000, // Major storm
};

// Conversion factors from Newell coupling to observable quantities
const CONVERSION = {
  // Coupling to hemisphere power: HP ≈ 2 × (coupling/1000)^0.8 GW
  TO_HEMISPHERE_POWER: (coupling: number) => 2 * Math.pow(coupling / 1000, 0.8),

  // Coupling to Kp: Kp ≈ log10(coupling/500)
  TO_KP: (coupling: number) =>
    Math.min(9, Math.max(0, Math.log10(coupling / 500) * 3)),

  // Coupling to equatorward auroral boundary
  TO_AURORAL_LATITUDE: (coupling: number) =>
    Math.max(40, 72 - Math.log10(Math.max(1, coupling / 500)) * 4),
};

/**
 * Calculate Newell coupling function
 * dΦMP/dt = v^(4/3) × Bt^(2/3) × sin^(8/3)(θc/2)
 */
export function calculateNewellCoupling(
  input: NewellCouplingInput
): NewellCouplingResult {
  const { solarWindSpeed, imfBz, imfBy, imfBt: providedBt } = input;

  // Calculate transverse IMF component
  const bt = providedBt ?? Math.sqrt(imfBy * imfBy + imfBz * imfBz);

  // Calculate clock angle (in radians)
  // θc = atan2(By, Bz) for GSM coordinates
  const clockAngleRad = Math.atan2(imfBy, imfBz);

  // Convert to degrees for display (0° = northward, 180° = southward)
  const clockAngleDeg = ((clockAngleRad * 180) / Math.PI + 360) % 360;

  // Calculate sin^(8/3)(θc/2)
  // When Bz is southward (negative), θc/2 is closer to 90°, sin is larger
  const halfClockAngle = Math.abs(clockAngleRad) / 2;
  const sinFactor = Math.pow(Math.sin(halfClockAngle), 8 / 3);

  // Calculate individual factors
  const speedFactor = Math.pow(solarWindSpeed, 4 / 3);
  const btFactor = Math.pow(bt, 2 / 3);
  const clockAngleFactor = sinFactor;

  // Calculate coupling (in Wb/s × 1000 for reasonable numbers)
  // Typical range: 0 to 50,000
  let coupling = speedFactor * btFactor * clockAngleFactor;

  // Scale factor to match typical observed values
  // (empirical calibration)
  coupling = coupling / 100;

  // Ensure non-negative
  coupling = Math.max(0, coupling);

  // Determine coupling level
  let couplingLevel: NewellCouplingResult["couplingLevel"];
  if (coupling >= COUPLING_THRESHOLDS.EXTREME) {
    couplingLevel = "extreme";
  } else if (coupling >= COUPLING_THRESHOLDS.VERY_HIGH) {
    couplingLevel = "very_high";
  } else if (coupling >= COUPLING_THRESHOLDS.HIGH) {
    couplingLevel = "high";
  } else if (coupling >= COUPLING_THRESHOLDS.MODERATE) {
    couplingLevel = "moderate";
  } else if (coupling >= COUPLING_THRESHOLDS.LOW) {
    couplingLevel = "low";
  } else {
    couplingLevel = "very_low";
  }

  // Normalize to 0-100 scale
  const couplingNormalized = Math.min(
    100,
    (coupling / COUPLING_THRESHOLDS.EXTREME) * 100
  );

  // Predict observable quantities
  const predictedHemispherePower = CONVERSION.TO_HEMISPHERE_POWER(coupling);
  const predictedKp = CONVERSION.TO_KP(coupling);
  const predictedAuroralLatitude = CONVERSION.TO_AURORAL_LATITUDE(coupling);

  // Assess favorability
  let isFavorable = false;
  let favorabilityReason = "";

  if (imfBz < -5 && solarWindSpeed > 400) {
    isFavorable = true;
    favorabilityReason = "Southward IMF and elevated solar wind - good coupling";
  } else if (imfBz < 0 && solarWindSpeed > 500) {
    isFavorable = true;
    favorabilityReason = "Fast solar wind with negative Bz - moderate coupling";
  } else if (imfBz > 5) {
    isFavorable = false;
    favorabilityReason = "Strong northward IMF - poor coupling, minimal activity expected";
  } else if (solarWindSpeed < 350) {
    isFavorable = false;
    favorabilityReason = "Slow solar wind - weak coupling regardless of IMF";
  } else if (imfBz > 0) {
    isFavorable = false;
    favorabilityReason = "Northward IMF - energy not entering magnetosphere effectively";
  } else {
    isFavorable = coupling > COUPLING_THRESHOLDS.LOW;
    favorabilityReason = isFavorable
      ? "Moderate conditions for aurora"
      : "Weak coupling - low aurora probability";
  }

  return {
    coupling: Math.round(coupling),
    couplingNormalized: Math.round(couplingNormalized * 10) / 10,
    couplingLevel,
    speedFactor: Math.round(speedFactor),
    btFactor: Math.round(btFactor * 100) / 100,
    clockAngleFactor: Math.round(clockAngleFactor * 1000) / 1000,
    clockAngle: Math.round(clockAngleDeg),
    predictedHemispherePower: Math.round(predictedHemispherePower * 10) / 10,
    predictedKp: Math.round(predictedKp * 10) / 10,
    predictedAuroralLatitude: Math.round(predictedAuroralLatitude),
    isFavorable,
    favorabilityReason,
  };
}

/**
 * Calculate coupling time series from solar wind data
 */
export function calculateCouplingTimeSeries(
  data: Array<{
    timestamp: Date;
    speed: number;
    bz: number;
    by: number;
  }>
): Array<{
  timestamp: Date;
  coupling: number;
  couplingNormalized: number;
}> {
  return data.map((point) => {
    const result = calculateNewellCoupling({
      solarWindSpeed: point.speed,
      imfBz: point.bz,
      imfBy: point.by,
    });

    return {
      timestamp: point.timestamp,
      coupling: result.coupling,
      couplingNormalized: result.couplingNormalized,
    };
  });
}

/**
 * Get coupling level description
 */
export function getCouplingDescription(
  level: NewellCouplingResult["couplingLevel"]
): string {
  switch (level) {
    case "very_low":
      return "Minimal solar wind-magnetosphere coupling. Aurora unlikely except at very high latitudes.";
    case "low":
      return "Weak coupling. Aurora may be visible in the auroral zone under dark, clear skies.";
    case "moderate":
      return "Moderate coupling. Good chance of aurora at auroral latitudes.";
    case "high":
      return "Strong coupling. Active aurora expected. May be visible at sub-auroral latitudes.";
    case "very_high":
      return "Very strong coupling. Bright, active aurora. Visible well equatorward of normal.";
    case "extreme":
      return "Extreme coupling! Major geomagnetic storm. Aurora visible at mid-latitudes.";
  }
}

/**
 * Get color for coupling level (for UI)
 */
export function getCouplingColor(
  level: NewellCouplingResult["couplingLevel"]
): string {
  switch (level) {
    case "very_low":
      return "#6b7280"; // gray
    case "low":
      return "#3b82f6"; // blue
    case "moderate":
      return "#22c55e"; // green
    case "high":
      return "#eab308"; // yellow
    case "very_high":
      return "#f97316"; // orange
    case "extreme":
      return "#ef4444"; // red
  }
}

/**
 * Calculate optimal coupling conditions
 * Returns what IMF conditions would be needed for a given coupling target
 */
export function calculateOptimalConditions(
  targetCoupling: number,
  currentSpeed: number
): {
  requiredBz: number;
  requiredBt: number;
  feasibility: "possible" | "unlikely" | "impossible";
} {
  // Solve for Bt given speed and target coupling
  // coupling = (speed^(4/3) × Bt^(2/3) × 1) / 100
  // Assuming maximum clock angle factor (1.0, southward IMF)

  const speedFactor = Math.pow(currentSpeed, 4 / 3);
  const requiredBtFactor = (targetCoupling * 100) / speedFactor;
  const requiredBt = Math.pow(requiredBtFactor, 3 / 2);

  // For maximum coupling, Bz ≈ -Bt (pure southward)
  const requiredBz = -requiredBt;

  let feasibility: "possible" | "unlikely" | "impossible";
  if (requiredBt <= 10) {
    feasibility = "possible";
  } else if (requiredBt <= 25) {
    feasibility = "unlikely";
  } else {
    feasibility = "impossible";
  }

  return {
    requiredBz: Math.round(requiredBz * 10) / 10,
    requiredBt: Math.round(requiredBt * 10) / 10,
    feasibility,
  };
}

export { COUPLING_THRESHOLDS };
