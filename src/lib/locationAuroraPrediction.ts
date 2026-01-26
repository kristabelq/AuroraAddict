/**
 * Location-Aware Aurora Type Prediction
 *
 * Customizes aurora appearance predictions based on the observer's location
 * relative to the auroral oval. Different latitudes see different:
 * - Colors (green overhead, red at lower latitudes)
 * - Structures (curtains/rays under oval, diffuse glow from afar)
 * - Viewing angles (overhead vs low on horizon)
 */

import {
  toGeomagneticCoordinates,
  getAuroralOvalLatitude,
  calculateAuroraVisibility,
} from "./geomagneticCoordinates";

export interface LocationAuroraPrediction {
  // What the user will see
  expectedColors: string[];
  dominantColor: string;
  colorExplanation: string;

  // Aurora structure from this location
  expectedStructure: string;
  structureDescription: string;

  // Where to look
  viewingDirection: string;
  elevationAngle: string;
  lookingToward: "overhead" | "northern_horizon" | "southern_horizon" | "not_visible";

  // Intensity from this location
  apparentBrightness: "brilliant" | "bright" | "moderate" | "faint" | "very_faint" | "not_visible";
  brightnessDescription: string;

  // Photography tips
  cameraSettings: {
    iso: string;
    shutter: string;
    aperture: string;
    tip: string;
  };

  // User-friendly summary
  summary: string;
  viewingTip: string;
}

/**
 * Predict what aurora will look like from a specific location
 *
 * @param latitude - Observer's geographic latitude
 * @param longitude - Observer's geographic longitude
 * @param kp - Current Kp index
 * @param baseAuroraType - Base aurora type from space weather (optional)
 * @param baseAuroraColors - Base colors from space weather (optional)
 */
export function predictAuroraForLocation(
  latitude: number,
  longitude: number,
  kp: number,
  baseAuroraType?: string,
  baseAuroraColors?: string
): LocationAuroraPrediction {
  // Convert to geomagnetic coordinates
  const { geomagneticLat } = toGeomagneticCoordinates(latitude, longitude);
  const absGeomagLat = Math.abs(geomagneticLat);
  const isNorthern = geomagneticLat >= 0;

  // Get auroral oval position
  const oval = getAuroralOvalLatitude(kp);
  const visibility = calculateAuroraVisibility(geomagneticLat, kp);

  // Calculate observer's position relative to the oval
  const distanceFromOvalCenter = absGeomagLat - oval.centerLat;
  const distanceFromEquatorwardEdge = absGeomagLat - oval.equatorwardEdge;

  // Determine viewing scenario
  const scenario = determineViewingScenario(absGeomagLat, oval, visibility.isVisible);

  // Predict colors based on location
  const colorPrediction = predictColors(scenario, absGeomagLat, oval, kp);

  // Predict structure based on location
  const structurePrediction = predictStructure(scenario, kp, baseAuroraType);

  // Determine viewing direction
  const viewingInfo = determineViewingInfo(geomagneticLat, oval, isNorthern);

  // Determine apparent brightness
  const brightness = determineBrightness(scenario, kp, distanceFromEquatorwardEdge);

  // Camera settings based on brightness
  const cameraSettings = recommendCameraSettings(brightness.apparentBrightness, kp);

  // Generate summary
  const summary = generateSummary(
    scenario,
    colorPrediction,
    structurePrediction,
    viewingInfo,
    brightness,
    isNorthern
  );

  return {
    expectedColors: colorPrediction.colors,
    dominantColor: colorPrediction.dominant,
    colorExplanation: colorPrediction.explanation,
    expectedStructure: structurePrediction.structure,
    structureDescription: structurePrediction.description,
    viewingDirection: viewingInfo.direction,
    elevationAngle: viewingInfo.elevation,
    lookingToward: viewingInfo.lookingToward,
    apparentBrightness: brightness.apparentBrightness,
    brightnessDescription: brightness.description,
    cameraSettings,
    summary,
    viewingTip: generateViewingTip(scenario, viewingInfo, brightness),
  };
}

type ViewingScenario =
  | "under_oval_center"    // 65-72° geomag - directly under auroral oval
  | "under_oval_edge"      // 60-65° geomag - near equatorward edge
  | "below_oval_close"     // 55-60° geomag - below but close
  | "below_oval_far"       // 45-55° geomag - well below oval
  | "extreme_low_lat"      // <45° geomag - only visible in extreme storms
  | "polar_cap"            // >75° geomag - inside polar cap
  | "not_visible";         // Too far from oval

function determineViewingScenario(
  absGeomagLat: number,
  oval: { equatorwardEdge: number; centerLat: number; polewardEdge: number },
  isVisible: boolean
): ViewingScenario {
  if (!isVisible && absGeomagLat < oval.equatorwardEdge - 5) {
    return "not_visible";
  }

  if (absGeomagLat > oval.polewardEdge + 3) {
    return "polar_cap";
  }

  if (absGeomagLat >= oval.centerLat - 3 && absGeomagLat <= oval.polewardEdge) {
    return "under_oval_center";
  }

  if (absGeomagLat >= oval.equatorwardEdge && absGeomagLat < oval.centerLat - 3) {
    return "under_oval_edge";
  }

  if (absGeomagLat >= oval.equatorwardEdge - 5 && absGeomagLat < oval.equatorwardEdge) {
    return "below_oval_close";
  }

  if (absGeomagLat >= 45) {
    return "below_oval_far";
  }

  return "extreme_low_lat";
}

function predictColors(
  scenario: ViewingScenario,
  absGeomagLat: number,
  oval: { equatorwardEdge: number; centerLat: number; polewardEdge: number },
  kp: number
): { colors: string[]; dominant: string; explanation: string } {
  switch (scenario) {
    case "under_oval_center":
      // Directly under the oval - full color range visible
      if (kp >= 7) {
        return {
          colors: ["Green", "Red", "Purple", "Pink", "Blue"],
          dominant: "Green with Red tops",
          explanation: "Strong storm brings full color spectrum. Green dominates at 100-300km altitude, with red oxygen emissions above 300km and purple/blue nitrogen at lower edges.",
        };
      } else if (kp >= 5) {
        return {
          colors: ["Green", "Red", "Purple"],
          dominant: "Vibrant Green",
          explanation: "Moderate storm produces classic green aurora at 100-200km altitude. Red upper borders visible during peaks. Purple fringes from nitrogen.",
        };
      } else {
        return {
          colors: ["Green", "Yellow-Green"],
          dominant: "Pale Green",
          explanation: "Quiet conditions show typical green oxygen emission at 100km altitude. Color may appear whitish to the naked eye but photographs reveal green.",
        };
      }

    case "under_oval_edge":
      // Near equatorward edge - still good colors
      if (kp >= 6) {
        return {
          colors: ["Green", "Red", "Purple"],
          dominant: "Green with Red curtains",
          explanation: "At the oval edge, you'll see dramatic curtains and rays. Green dominates with red tops during active periods.",
        };
      } else {
        return {
          colors: ["Green", "Yellow-Green"],
          dominant: "Green",
          explanation: "Classic green aurora visible on the poleward horizon. May appear as a greenish glow that brightens into distinct forms.",
        };
      }

    case "below_oval_close":
      // Below oval but close - red becomes more prominent
      if (kp >= 7) {
        return {
          colors: ["Red", "Green", "Pink"],
          dominant: "Red and Pink",
          explanation: "From this latitude, you're looking through more atmosphere at the aurora. Red emissions (high altitude oxygen at 300km+) become prominent. Green visible during intense peaks.",
        };
      } else if (kp >= 5) {
        return {
          colors: ["Red", "Green"],
          dominant: "Red glow with Green peaks",
          explanation: "Red SAR (Stable Auroral Red) arcs may be visible low on the horizon. Green only visible during activity surges.",
        };
      } else {
        return {
          colors: ["Green", "White"],
          dominant: "Faint greenish glow",
          explanation: "Faint green glow on the horizon. Often appears white or gray to the naked eye but photographs reveal color.",
        };
      }

    case "below_oval_far":
      // Well below oval - mostly red
      if (kp >= 8) {
        return {
          colors: ["Red", "Pink", "Purple"],
          dominant: "Deep Red",
          explanation: "At this distance, only high-altitude red emissions (300-400km) are visible above your horizon. These create the famous 'red aurora' seen during major storms.",
        };
      } else if (kp >= 6) {
        return {
          colors: ["Red", "Pink"],
          dominant: "Red/Pink glow",
          explanation: "Red glow low on the horizon from high-altitude oxygen emissions. May pulse or brighten during substorms.",
        };
      } else {
        return {
          colors: ["Red"],
          dominant: "Faint red glow",
          explanation: "Only the highest red emissions visible. Often appears as a faint reddish tint on the horizon, easily mistaken for light pollution.",
        };
      }

    case "extreme_low_lat":
      // Very low latitude - only extreme events
      return {
        colors: ["Red", "Deep Red"],
        dominant: "Blood Red",
        explanation: "At this latitude, only extreme G4-G5 storms produce visible aurora. You'll see deep red SAR arcs from very high altitude emissions (400km+). This is the aurora your ancestors feared!",
      };

    case "polar_cap":
      // Inside polar cap - aurora toward equator
      return {
        colors: ["Green", "Red"],
        dominant: "Green toward equator",
        explanation: "You're inside the polar cap, north of the auroral oval. Look toward the equator to see the aurora! Colors appear on the southern horizon (or northern for southern hemisphere).",
      };

    default:
      return {
        colors: [],
        dominant: "Not visible",
        explanation: "Aurora not visible from your location with current conditions.",
      };
  }
}

function predictStructure(
  scenario: ViewingScenario,
  kp: number,
  baseAuroraType?: string
): { structure: string; description: string } {
  switch (scenario) {
    case "under_oval_center":
      if (kp >= 7) {
        return {
          structure: "Corona / Rays / Curtains",
          description: "During strong storms directly under the oval, aurora may fill the entire sky. Look for the 'corona effect' - rays appearing to converge at the magnetic zenith directly overhead. Dramatic curtains dance across the sky.",
        };
      } else if (kp >= 5) {
        return {
          structure: "Curtains / Bands / Rays",
          description: "Active aurora displays with multiple curtains and bands moving across the sky. Vertical rays may appear, sometimes forming 'picket fence' patterns.",
        };
      } else {
        return {
          structure: "Arcs / Bands",
          description: "Quiet aurora typically forms east-west arcs across the sky. Watch for bands that may suddenly brighten and develop rays during substorms.",
        };
      }

    case "under_oval_edge":
      if (kp >= 6) {
        return {
          structure: "Curtains / Rays",
          description: "Dramatic curtains rippling across the northern sky. Rays extend upward like searchlights during active periods.",
        };
      } else {
        return {
          structure: "Arc / Band",
          description: "A glowing arc spanning the horizon, sometimes breaking into multiple bands. Watch for it to brighten and develop structure.",
        };
      }

    case "below_oval_close":
      if (kp >= 7) {
        return {
          structure: "Rays / Pillars",
          description: "Tall pillars of light extending up from the horizon. During peaks, rays may reach high into the sky.",
        };
      } else {
        return {
          structure: "Glow / Low Arc",
          description: "Diffuse glow along the horizon that may brighten into a visible arc during activity surges.",
        };
      }

    case "below_oval_far":
    case "extreme_low_lat":
      return {
        structure: "Diffuse Glow / SAR Arc",
        description: "A diffuse red glow hugging the horizon. Stable Auroral Red (SAR) arcs appear as steady red bands. Unlike typical aurora, these don't dance or flicker.",
      };

    case "polar_cap":
      return {
        structure: "Arcs toward equator",
        description: "Look toward the equator to see auroral arcs and bands. The aurora appears 'upside down' compared to typical views.",
      };

    default:
      return {
        structure: "Not visible",
        description: "Aurora structure not visible from your location.",
      };
  }
}

function determineViewingInfo(
  geomagneticLat: number,
  oval: { equatorwardEdge: number; centerLat: number; polewardEdge: number },
  isNorthern: boolean
): { direction: string; elevation: string; lookingToward: "overhead" | "northern_horizon" | "southern_horizon" | "not_visible" } {
  const absLat = Math.abs(geomagneticLat);
  const horizonDirection = isNorthern ? "North" : "South";
  const oppositeDirection = isNorthern ? "South" : "North";

  if (absLat >= oval.centerLat - 2 && absLat <= oval.polewardEdge) {
    return {
      direction: "All directions - may be overhead",
      elevation: "60-90° (overhead to high)",
      lookingToward: "overhead",
    };
  }

  if (absLat > oval.polewardEdge) {
    return {
      direction: `Look toward ${oppositeDirection}`,
      elevation: "20-60° above horizon",
      lookingToward: isNorthern ? "southern_horizon" : "northern_horizon",
    };
  }

  if (absLat >= oval.equatorwardEdge - 3) {
    const elevation = Math.max(5, 45 - (oval.equatorwardEdge - absLat) * 10);
    return {
      direction: `Look ${horizonDirection}`,
      elevation: `${elevation}-60° above ${horizonDirection.toLowerCase()} horizon`,
      lookingToward: isNorthern ? "northern_horizon" : "southern_horizon",
    };
  }

  if (absLat >= 45) {
    const elevation = Math.max(5, 30 - (oval.equatorwardEdge - absLat) * 5);
    return {
      direction: `Face ${horizonDirection}, scan horizon`,
      elevation: `${elevation}-30° above horizon`,
      lookingToward: isNorthern ? "northern_horizon" : "southern_horizon",
    };
  }

  return {
    direction: `${horizonDirection}ern horizon`,
    elevation: "5-15° above horizon",
    lookingToward: isNorthern ? "northern_horizon" : "southern_horizon",
  };
}

function determineBrightness(
  scenario: ViewingScenario,
  kp: number,
  distanceFromEdge: number
): { apparentBrightness: "brilliant" | "bright" | "moderate" | "faint" | "very_faint" | "not_visible"; description: string } {
  if (scenario === "not_visible") {
    return {
      apparentBrightness: "not_visible",
      description: "Aurora not visible from your location.",
    };
  }

  if (scenario === "under_oval_center") {
    if (kp >= 7) {
      return {
        apparentBrightness: "brilliant",
        description: "Brilliant, unmistakable aurora lighting up the sky. May cast shadows and be visible even with some light pollution.",
      };
    } else if (kp >= 5) {
      return {
        apparentBrightness: "bright",
        description: "Bright, clearly visible aurora. Easy to see with naked eye, photographs beautifully.",
      };
    } else {
      return {
        apparentBrightness: "moderate",
        description: "Moderately bright aurora. Visible to naked eye, colors may appear faint but cameras capture well.",
      };
    }
  }

  if (scenario === "under_oval_edge") {
    if (kp >= 6) {
      return {
        apparentBrightness: "bright",
        description: "Bright aurora on the horizon, may extend high into the sky during peaks.",
      };
    } else {
      return {
        apparentBrightness: "moderate",
        description: "Moderate brightness - clearly visible but you'll want dark skies.",
      };
    }
  }

  if (scenario === "below_oval_close") {
    if (kp >= 7) {
      return {
        apparentBrightness: "moderate",
        description: "Moderate brightness low on the horizon. Best viewed from dark locations.",
      };
    } else {
      return {
        apparentBrightness: "faint",
        description: "Faint glow on the horizon. May appear gray to the naked eye - camera helps confirm colors.",
      };
    }
  }

  if (scenario === "below_oval_far" || scenario === "extreme_low_lat") {
    if (kp >= 8) {
      return {
        apparentBrightness: "faint",
        description: "Faint red glow on the horizon. Requires very dark skies and good northern horizon.",
      };
    } else {
      return {
        apparentBrightness: "very_faint",
        description: "Very faint - may be difficult to see with naked eye. Long-exposure photography recommended.",
      };
    }
  }

  return {
    apparentBrightness: "faint",
    description: "Faint aurora - dark skies essential.",
  };
}

function recommendCameraSettings(
  brightness: "brilliant" | "bright" | "moderate" | "faint" | "very_faint" | "not_visible",
  kp: number
): { iso: string; shutter: string; aperture: string; tip: string } {
  switch (brightness) {
    case "brilliant":
      return {
        iso: "800-1600",
        shutter: "2-5 seconds",
        aperture: "f/2.8 or wider",
        tip: "Fast-moving aurora! Use shorter exposures to capture detail. May need to reduce ISO to avoid overexposure.",
      };
    case "bright":
      return {
        iso: "1600-3200",
        shutter: "5-10 seconds",
        aperture: "f/2.8 or wider",
        tip: "Great conditions for photography. Balance exposure time with aurora movement.",
      };
    case "moderate":
      return {
        iso: "3200-6400",
        shutter: "10-15 seconds",
        aperture: "f/2.0 or wider",
        tip: "Longer exposures will reveal colors your eye may not see clearly.",
      };
    case "faint":
      return {
        iso: "6400-12800",
        shutter: "15-25 seconds",
        aperture: "f/1.8 or wider",
        tip: "Push your camera settings. A fast lens is essential. Consider stacking multiple exposures.",
      };
    case "very_faint":
      return {
        iso: "12800+",
        shutter: "25-30 seconds",
        aperture: "f/1.4 ideal",
        tip: "Maximum sensitivity needed. Use the fastest lens you have. Multiple long exposures recommended.",
      };
    default:
      return {
        iso: "N/A",
        shutter: "N/A",
        aperture: "N/A",
        tip: "Aurora not visible from your location with current conditions.",
      };
  }
}

function generateSummary(
  scenario: ViewingScenario,
  colorPrediction: { colors: string[]; dominant: string; explanation: string },
  structurePrediction: { structure: string; description: string },
  viewingInfo: { direction: string; elevation: string; lookingToward: string },
  brightness: { apparentBrightness: string; description: string },
  isNorthern: boolean
): string {
  if (scenario === "not_visible") {
    return "Aurora is not expected to be visible from your location with current space weather conditions.";
  }

  const hemisphere = isNorthern ? "Northern Lights" : "Southern Lights (Aurora Australis)";

  switch (scenario) {
    case "under_oval_center":
      return `You're directly under the auroral oval - prime viewing! Expect ${colorPrediction.dominant} aurora with ${structurePrediction.structure.toLowerCase()} formations. The ${hemisphere} may appear overhead and all around you.`;

    case "under_oval_edge":
      return `Excellent location near the auroral oval edge. Expect ${colorPrediction.dominant} colors forming ${structurePrediction.structure.toLowerCase()}. Look ${viewingInfo.direction.toLowerCase()} for the best views.`;

    case "below_oval_close":
      return `Good viewing potential! From your latitude, expect ${colorPrediction.dominant} appearing as ${structurePrediction.structure.toLowerCase()} on the ${viewingInfo.direction.toLowerCase()}.`;

    case "below_oval_far":
      return `Aurora viewing possible during this active period. Expect ${colorPrediction.dominant} low on the ${viewingInfo.direction.toLowerCase()}. Dark skies and clear horizon essential.`;

    case "extreme_low_lat":
      return `Rare aurora opportunity at your latitude! Look for ${colorPrediction.dominant} very low on the ${viewingInfo.direction.toLowerCase()}. This is a special event!`;

    case "polar_cap":
      return `You're inside the polar cap, above the auroral oval. Look toward the ${isNorthern ? 'south' : 'north'} to see the aurora! Expect ${colorPrediction.dominant} on that horizon.`;

    default:
      return "Check back when space weather conditions improve.";
  }
}

function generateViewingTip(
  scenario: ViewingScenario,
  viewingInfo: { direction: string; elevation: string; lookingToward: string },
  brightness: { apparentBrightness: string; description: string }
): string {
  const tips: string[] = [];

  if (scenario === "under_oval_center") {
    tips.push("Find a 360° view location - aurora may appear anywhere in the sky!");
    tips.push("During active periods, look directly overhead for the 'corona' effect.");
  } else if (scenario === "polar_cap") {
    tips.push("You're north of the aurora - look toward the equator!");
  } else {
    tips.push(`Face ${viewingInfo.direction.toLowerCase()} with a clear view of the horizon.`);
  }

  if (brightness.apparentBrightness === "faint" || brightness.apparentBrightness === "very_faint") {
    tips.push("Let your eyes adapt to darkness for 20+ minutes.");
    tips.push("Use your camera's live view to spot faint aurora before your eyes do.");
  }

  if (scenario === "below_oval_far" || scenario === "extreme_low_lat") {
    tips.push("Light pollution is your enemy - get to the darkest location possible.");
    tips.push("Aurora at this latitude often appears as a steady glow rather than dancing lights.");
  }

  return tips.join(" ");
}

/**
 * Get a simple color prediction emoji string for display
 */
export function getLocationColorEmoji(
  latitude: number,
  longitude: number,
  kp: number
): string {
  const prediction = predictAuroraForLocation(latitude, longitude, kp);

  const colorEmojis: Record<string, string> = {
    "Green": "💚",
    "Red": "❤️",
    "Purple": "💜",
    "Pink": "🩷",
    "Blue": "💙",
    "Yellow-Green": "💛",
    "White": "🤍",
    "Deep Red": "🔴",
  };

  return prediction.expectedColors
    .slice(0, 3)
    .map(c => colorEmojis[c] || "")
    .join("");
}
