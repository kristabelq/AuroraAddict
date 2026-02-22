"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TimeHeader from "@/components/TimeHeader";

interface SolarWindData {
  time_tag: string;
  bt: number;   // Total magnetic field strength (nT)
  bz: number;   // North-South component (nT) - most important for auroras
  bx: number;   // Sun-Earth component (nT)
  by: number;   // East-West component (nT)
  speed: number; // Solar wind speed (km/s)
  density: number; // Proton density (p/cm³)
}

export default function SolarWindPage() {
  const router = useRouter();
  const [solarWind, setSolarWind] = useState<SolarWindData | null>(null);
  const [solarWindHistory, setSolarWindHistory] = useState<SolarWindData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolarWindData();

    // Refresh solar wind data every 2 minutes
    const interval = setInterval(fetchSolarWindData, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchSolarWindData = async () => {
    try {
      // Fetch real-time solar wind magnetic field data from NOAA
      const magResponse = await fetch(
        "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json"
      );
      const magData = await magResponse.json();

      // Fetch real-time solar wind plasma data (speed, density)
      const plasmaResponse = await fetch(
        "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json"
      );
      const plasmaData = await plasmaResponse.json();

      // Remove header row
      const magDataPoints = magData.slice(1);
      const plasmaDataPoints = plasmaData.slice(1);

      // Create a map of plasma data by timestamp for easy lookup
      const plasmaMap = new Map();
      plasmaDataPoints.forEach((row: string[]) => {
        plasmaMap.set(row[0], row);
      });

      // Get last 6 hours of data (approximately 72 points at 5-minute intervals)
      const recentMagData = magDataPoints.slice(-72);

      // Build historical data
      const history: SolarWindData[] = [];
      recentMagData.forEach((magRow: string[]) => {
        const plasmaRow = plasmaMap.get(magRow[0]);
        if (plasmaRow) {
          history.push({
            time_tag: magRow[0],
            bx: parseFloat(magRow[1]) || 0,
            by: parseFloat(magRow[2]) || 0,
            bz: parseFloat(magRow[3]) || 0,
            bt: parseFloat(magRow[6]) || 0,
            density: parseFloat(plasmaRow[1]) || 0,
            speed: parseFloat(plasmaRow[2]) || 0,
          });
        }
      });

      setSolarWindHistory(history);

      // Get the most recent data point
      if (history.length > 0) {
        setSolarWind(history[history.length - 1]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching solar wind data:", error);
      setLoading(false);
    }
  };

  // Calculate aurora potential score (0-100)
  const calculateAuroraScore = (bz: number, bt: number, speed: number): number => {
    // If Bz is north (positive), score is very low
    if (bz > 0) return Math.max(0, 10 - bz * 2);

    // Base score from Bz (most important factor)
    const bzMagnitude = Math.abs(bz);
    let score = 0;

    if (bzMagnitude >= 15) score = 90;
    else if (bzMagnitude >= 10) score = 70;
    else if (bzMagnitude >= 5) score = 45;
    else score = bzMagnitude * 5;

    // Boost from Bt (field strength)
    if (bt > 30) score += 8;
    else if (bt > 20) score += 5;
    else if (bt > 10) score += 2;

    // Boost from speed
    if (speed > 600) score += 7;
    else if (speed > 500) score += 4;
    else if (speed > 400) score += 2;

    return Math.min(100, Math.round(score));
  };

  // Analyze Bz trend over last hour
  const analyzeBzTrend = (): { direction: "improving" | "worsening" | "stable"; change: number } => {
    if (solarWindHistory.length < 12) {
      return { direction: "stable", change: 0 };
    }

    // Compare last 30 minutes average to previous 30 minutes
    const recent = solarWindHistory.slice(-6); // Last 30 min
    const previous = solarWindHistory.slice(-12, -6); // Previous 30 min

    const recentAvg = recent.reduce((sum, d) => sum + d.bz, 0) / recent.length;
    const previousAvg = previous.reduce((sum, d) => sum + d.bz, 0) / previous.length;

    const change = recentAvg - previousAvg;

    // For aurora, more negative Bz is better
    if (change < -2) return { direction: "improving", change };
    if (change > 2) return { direction: "worsening", change };
    return { direction: "stable", change };
  };

  // Calculate sustained southward Bz duration
  const calculateSouthwardDuration = (): number => {
    if (!solarWind || solarWind.bz >= 0 || solarWindHistory.length === 0) {
      return 0;
    }

    let duration = 0;
    // Count backwards from most recent
    for (let i = solarWindHistory.length - 1; i >= 0; i--) {
      if (solarWindHistory[i].bz < -3) { // Significantly southward
        duration += 5; // Each data point is ~5 minutes
      } else {
        break;
      }
    }

    return duration;
  };

  // Get aurora potential description based on conditions
  const getAuroraPotential = (bz: number, bt: number, speed: number) => {
    if (bz > 0) {
      return {
        level: "Minimal",
        color: "#6b7280", // gray
        message: `Bz is pointing NORTH (+${Math.abs(bz).toFixed(1)} nT). The solar wind's magnetic field is repelling Earth's field. Aurora potential is very low.`,
        recommendation: "Not a good time for aurora hunting. Wait for Bz to turn south."
      };
    }

    const bzMagnitude = Math.abs(bz);

    if (bzMagnitude >= 15) {
      return {
        level: "EXCELLENT",
        color: "#dc2626", // red-600
        message: `Bz is STRONGLY SOUTH (-${bzMagnitude.toFixed(1)} nT)! Magnetic reconnection is very active. Major geomagnetic storm conditions likely.`,
        recommendation: "🎯 GET OUTSIDE NOW! Spectacular aurora displays are likely, visible at unusually low latitudes!"
      };
    }

    if (bzMagnitude >= 10) {
      return {
        level: "STRONG",
        color: "#f59e0b", // amber-500
        message: `Bz is pointing SOUTH (-${bzMagnitude.toFixed(1)} nT). Strong magnetic reconnection is occurring with Earth's magnetosphere.`,
        recommendation: "Great conditions! Strong aurora likely at mid-latitudes. Head to a dark location!"
      };
    }

    if (bzMagnitude >= 5) {
      return {
        level: "MODERATE",
        color: "#10b981", // green-500
        message: `Bz is pointing SOUTH (-${bzMagnitude.toFixed(1)} nT). Favorable conditions for aurora at high latitudes.`,
        recommendation: "Good opportunity if you're in aurora zones. Monitor for strengthening."
      };
    }

    return {
      level: "WEAK",
      color: "#6b7280", // gray-500
      message: `Bz is slightly south (-${bzMagnitude.toFixed(1)} nT). Weak but favorable orientation.`,
      recommendation: "Marginal conditions. Best viewed from high latitude locations only."
    };
  };

  // Format travel time in days, hours, and minutes
  const formatTravelTime = (totalMinutes: number): string => {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = Math.round(totalMinutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days} d`);
    if (hours > 0) parts.push(`${hours} hr`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} mins`);

    return parts.join(' ');
  };

  // Get traffic light color for Bz (green = south/good, red = north/bad)
  const getBzColor = (bz: number): string => {
    if (bz < -10) return '#22c55e'; // green-500 - excellent
    if (bz < -5) return '#84cc16'; // lime-500 - good
    if (bz < 0) return '#eab308'; // yellow-500 - okay
    return '#ef4444'; // red-500 - bad
  };

  // Get traffic light color for Bt (higher = better)
  const getBtColor = (bt: number): string => {
    if (bt > 30) return '#22c55e'; // green-500 - excellent
    if (bt > 20) return '#84cc16'; // lime-500 - good
    if (bt > 10) return '#eab308'; // yellow-500 - okay
    return '#ef4444'; // red-500 - low
  };

  // Get traffic light color for Speed (higher = better)
  const getSpeedColor = (speed: number): string => {
    if (speed > 600) return '#22c55e'; // green-500 - very fast
    if (speed > 500) return '#84cc16'; // lime-500 - fast
    if (speed > 400) return '#eab308'; // yellow-500 - moderate
    return '#ef4444'; // red-500 - slow
  };

  // Get traffic light color for Density (higher = better)
  const getDensityColor = (density: number): string => {
    if (density > 20) return '#22c55e'; // green-500 - high (20-50+ p/cm³)
    if (density > 8) return '#84cc16'; // lime-500 - enhanced (8-20 p/cm³)
    if (density > 3) return '#eab308'; // yellow-500 - normal (3-8 p/cm³)
    return '#ef4444'; // red-500 - low (<3 p/cm³)
  };

  // Calculate arrival time from L1 to Earth based on solar wind speed
  const calculateArrivalTime = (speed: number): number => {
    // L1 is approximately 1.5 million km from Earth
    const L1_DISTANCE_KM = 1500000;
    const travelTimeMinutes = (L1_DISTANCE_KM / speed) / 60;
    return Math.round(travelTimeMinutes);
  };

  // Check if aurora-favorable conditions are incoming
  const getIncomingAuroraAlert = () => {
    if (!solarWind || solarWindHistory.length < 6) return null;

    const arrivalMins = calculateArrivalTime(solarWind.speed);
    const isFavorable = solarWind.bz < -5 && solarWind.speed > 400 && solarWind.density > 2;
    const isStronglyFavorable = solarWind.bz < -10 && solarWind.speed > 500 && solarWind.density > 5;

    if (isStronglyFavorable) {
      return {
        level: "HIGH",
        color: "#22c55e",
        borderColor: "#16a34a",
        message: "Strong aurora conditions detected at L1!",
        arrivalMins,
      };
    } else if (isFavorable) {
      return {
        level: "MODERATE",
        color: "#eab308",
        borderColor: "#ca8a04",
        message: "Favorable aurora conditions detected at L1",
        arrivalMins,
      };
    }
    return null;
  };

  // Calculate energy loading into magnetosphere (simplified model)
  const calculateEnergyLoading = (): { percentage: number; status: string; timeToSubstorm: number | null } => {
    if (!solarWind || solarWindHistory.length < 12) {
      return { percentage: 0, status: "Unknown", timeToSubstorm: null };
    }

    // Calculate cumulative energy from sustained southward Bz
    let energy = 0;
    let sustainedMinutes = 0;

    // Look at last hour of data
    const recentData = solarWindHistory.slice(-12);
    for (const point of recentData) {
      if (point.bz < 0) {
        // Energy input proportional to |Bz| * speed * sqrt(density)
        const inputRate = Math.abs(point.bz) * (point.speed / 400) * Math.sqrt(Math.max(point.density, 1) / 5);
        energy += inputRate * 5; // 5 minutes per data point
        sustainedMinutes += 5;
      } else {
        // Reset if Bz turns north
        energy = Math.max(0, energy - 10);
      }
    }

    // Normalize to 0-100%
    const percentage = Math.min(100, Math.round(energy / 3));

    let status = "Low";
    let timeToSubstorm: number | null = null;

    if (percentage >= 80) {
      status = "Critical - Substorm imminent";
      timeToSubstorm = 10;
    } else if (percentage >= 60) {
      status = "High - Substorm likely";
      timeToSubstorm = 20;
    } else if (percentage >= 40) {
      status = "Moderate - Building";
      timeToSubstorm = 45;
    } else if (percentage >= 20) {
      status = "Low - Charging";
    }

    return { percentage, status, timeToSubstorm };
  };

  // Generate 60-minute forecast timeline
  const generate60MinForecast = () => {
    if (!solarWind || solarWindHistory.length < 12) return [];

    const arrivalMins = calculateArrivalTime(solarWind.speed);
    const forecast = [];

    // Current conditions (arriving in ~arrivalMins)
    forecast.push({
      timeLabel: `+${arrivalMins} min`,
      description: "Current L1 readings arrive",
      bz: solarWind.bz,
      speed: solarWind.speed,
      density: solarWind.density,
      potential: solarWind.bz < -10 ? "High" : solarWind.bz < -5 ? "Moderate" : solarWind.bz < 0 ? "Low" : "Minimal",
    });

    // Use historical data to project what will arrive at different times
    // Data from 15 min ago at L1 will arrive in (arrivalMins - 15) from now
    const intervals = [15, 30, 45];
    for (const minsAgo of intervals) {
      const dataPointsAgo = Math.floor(minsAgo / 5);
      const historyIndex = solarWindHistory.length - 1 - dataPointsAgo;

      if (historyIndex >= 0) {
        const point = solarWindHistory[historyIndex];
        const arrivalFromNow = Math.max(0, arrivalMins - minsAgo);

        if (arrivalFromNow <= 60 && arrivalFromNow > 0) {
          forecast.push({
            timeLabel: arrivalFromNow === 0 ? "Now" : `+${arrivalFromNow} min`,
            description: `L1 data from ${minsAgo}min ago`,
            bz: point.bz,
            speed: point.speed,
            density: point.density,
            potential: point.bz < -10 ? "High" : point.bz < -5 ? "Moderate" : point.bz < 0 ? "Low" : "Minimal",
          });
        }
      }
    }

    // Sort by arrival time (soonest first)
    return forecast.sort((a, b) => {
      const timeA = parseInt(a.timeLabel.replace(/[^0-9]/g, '')) || 0;
      const timeB = parseInt(b.timeLabel.replace(/[^0-9]/g, '')) || 0;
      return timeA - timeB;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!solarWind) {
    return (
      <div className="min-h-screen bg-[#0a0e17] pb-24">
        <TimeHeader />
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-400">No solar wind data available</p>
        </div>
      </div>
    );
  }

  const score = calculateAuroraScore(solarWind.bz, solarWind.bt, solarWind.speed);
  const potential = getAuroraPotential(solarWind.bz, solarWind.bt, solarWind.speed);
  const trend = analyzeBzTrend();
  const duration = calculateSouthwardDuration();

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/intelligence?tab=aurora-intel")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Aurora Intel
          </button>

          <h1 className="text-3xl font-bold mb-2">Real-Time Solar Wind</h1>
          <p className="text-gray-400">
            Live data from NOAA satellites • Updated: {new Date(solarWind.time_tag).toLocaleTimeString()}
          </p>
        </div>

        {/* Conditions Preview - What's Coming */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl p-4 mb-6 border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h3 className="text-lg font-semibold text-white">Conditions Arriving at Earth</h3>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Estimated arrival:</span>
              <span className="text-lg font-bold text-cyan-400">~{calculateArrivalTime(solarWind.speed)} minutes</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">Bz</div>
                <div className="text-lg font-bold" style={{ color: getBzColor(solarWind.bz) }}>
                  {solarWind.bz >= 0 ? '+' : ''}{solarWind.bz.toFixed(1)} nT
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">Speed</div>
                <div className="text-lg font-bold" style={{ color: getSpeedColor(solarWind.speed) }}>
                  {solarWind.speed.toFixed(0)} km/s
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">Density</div>
                <div className="text-lg font-bold" style={{ color: getDensityColor(solarWind.density) }}>
                  {solarWind.density.toFixed(1)} p/cm³
                </div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-sm text-gray-400">Aurora potential on arrival: </span>
              <span className={`font-semibold ${solarWind.bz < -10 ? 'text-green-400' : solarWind.bz < -5 ? 'text-yellow-400' : solarWind.bz < 0 ? 'text-orange-400' : 'text-red-400'}`}>
                {solarWind.bz < -10 ? 'HIGH' : solarWind.bz < -5 ? 'MODERATE' : solarWind.bz < 0 ? 'LOW' : 'MINIMAL'}
              </span>
            </div>
          </div>
        </div>

        {/* 60-Minute Forecast Timeline */}
        {(() => {
          const forecast = generate60MinForecast();
          if (forecast.length === 0) return null;

          return (
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">60-Minute Aurora Forecast</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                What conditions will reach Earth based on L1 satellite data
              </p>

              <div className="space-y-2">
                {forecast.map((item, index) => {
                  const potentialColor = item.potential === "High" ? "#22c55e" : item.potential === "Moderate" ? "#eab308" : item.potential === "Low" ? "#f97316" : "#6b7280";

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-black/30"
                    >
                      {/* Time badge */}
                      <div className="w-12 sm:w-14 flex-shrink-0 text-center">
                        <span className="text-xs sm:text-sm font-bold text-cyan-400">{item.timeLabel}</span>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-8 bg-white/20 flex-shrink-0" />

                      {/* Conditions */}
                      <div className="flex-1 flex items-center gap-2 sm:gap-4 text-xs min-w-0">
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-400">Bz: </span>
                          <span style={{ color: getBzColor(item.bz) }} className="font-semibold">
                            {item.bz >= 0 ? '+' : ''}{item.bz.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-400">Speed: </span>
                          <span style={{ color: getSpeedColor(item.speed) }} className="font-semibold">
                            {item.speed.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-400">Density: </span>
                          <span style={{ color: getDensityColor(item.density) }} className="font-semibold">
                            {item.density.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Potential badge */}
                      <div
                        className="px-1.5 sm:px-2 py-1 rounded text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: `${potentialColor}30`, color: potentialColor }}
                      >
                        {item.potential}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Bz Trend Chart - Last 3 Hours */}
        {solarWindHistory.length > 0 && (
          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Bz Trend (Last 3 Hours)</h3>
            <div className="relative h-40">
              {/* Y-axis with zero line emphasized */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-gray-400 text-xs pr-2 w-8">
                <span>+20</span>
                <span>+10</span>
                <span className="text-white font-semibold">0</span>
                <span>-10</span>
                <span>-20</span>
              </div>

              {/* Zero line */}
              <div className="absolute left-8 right-0 top-1/2 h-0.5 bg-white/30" />

              {/* Chart area */}
              <div className="ml-8 h-full relative">
                {/* Plot Bz values */}
                <svg className="w-full h-full" preserveAspectRatio="none">
                  {/* Background zones */}
                  <defs>
                    <linearGradient id="bzGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#64748b" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#bzGradient)" />

                  {/* Plot points */}
                  {solarWindHistory.slice(-36).map((point, i, arr) => {
                    const x = (i / (arr.length - 1)) * 100;
                    const y = ((20 - point.bz) / 40) * 100;
                    // Color: green for strongly south (< -5), yellow for weakly south (-5 to 0), red for north (>= 0)
                    const dotColor = point.bz >= 0 ? "#ef4444" : point.bz > -5 ? "#eab308" : "#10b981";

                    return (
                      <circle
                        key={i}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="3"
                        fill={dotColor}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between text-xs text-gray-400 mt-2 ml-8">
              <span>3h ago</span>
              <span>2h ago</span>
              <span>1h ago</span>
              <span className="text-white font-semibold">Now</span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-300">Strong South (Good)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-300">Weak South (Marginal)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-300">North (Bad)</span>
              </div>
            </div>
          </div>
        )}

        {/* Solar Wind Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {/* Row 1: Bz, Speed, Density (with color codes) */}

          {/* Bz - Most Important */}
          <div className="bg-white/10 rounded-xl p-3 sm:p-4 border-2 border-purple-500/50">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <span>Bz (North-South)</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: getBzColor(solarWind.bz) }}>
              {solarWind.bz >= 0 ? '+' : ''}{solarWind.bz.toFixed(1)} nT
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {solarWind.bz < 0 ? '⬇️ SOUTH (GOOD!)' : '⬆️ NORTH (BAD)'}
            </div>
            <div className="text-xs text-gray-400 mt-1 hidden sm:block">
              Key factor for aurora
            </div>
          </div>

          {/* Solar Wind Speed */}
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-gray-400 mb-1">Wind Speed</div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: getSpeedColor(solarWind.speed) }}>
              {solarWind.speed.toFixed(0)} km/s
            </div>
            <div className="flex items-center gap-1 mt-1 sm:mt-2">
              {solarWind.speed > 500 && (
                <svg className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: getSpeedColor(solarWind.speed) }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
              )}
              <span className="text-xs text-gray-400">
                {solarWind.speed > 600 ? 'Very Fast' : solarWind.speed > 500 ? 'Fast' : solarWind.speed > 400 ? 'Moderate' : 'Normal'}
              </span>
            </div>
          </div>

          {/* Density */}
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-gray-400 mb-1">Density</div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: getDensityColor(solarWind.density) }}>
              {solarWind.density.toFixed(1)} p/cm³
            </div>
            <div className="text-xs text-gray-400 mt-1 sm:mt-2">
              {solarWind.density > 50 ? 'Extreme' : solarWind.density > 20 ? 'High' : solarWind.density > 8 ? 'Enhanced' : solarWind.density > 3 ? 'Normal' : 'Low'}
            </div>
          </div>

          {/* Row 2: Bt, Bx, By (no color codes) */}

          {/* Bt - Total Field Strength */}
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-gray-400 mb-1">Bt (Total Field)</div>
            <div className="text-lg sm:text-xl font-bold text-gray-300">
              {solarWind.bt.toFixed(1)} nT
            </div>
          </div>

          {/* Bx */}
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-gray-400 mb-1">Bx (Sun-Earth)</div>
            <div className="text-lg sm:text-xl font-bold text-gray-300">
              {solarWind.bx >= 0 ? '+' : ''}{solarWind.bx.toFixed(1)} nT
            </div>
          </div>

          {/* By */}
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-gray-400 mb-1">By (East-West)</div>
            <div className="text-lg sm:text-xl font-bold text-gray-300">
              {solarWind.by >= 0 ? '+' : ''}{solarWind.by.toFixed(1)} nT
            </div>
          </div>
        </div>

        {/* Aurora Incoming Alert */}
        {(() => {
          const alert = getIncomingAuroraAlert();
          if (!alert) return null;

          return (
            <div
              className="rounded-xl p-4 mb-6 border-2"
              style={{ backgroundColor: `${alert.color}20`, borderColor: alert.borderColor }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${alert.color}40` }}>
                    <svg className="w-6 h-6" style={{ color: alert.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold" style={{ color: alert.color }}>
                      🚨 Aurora Incoming!
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: alert.color, color: '#000' }}>
                      {alert.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-cyan-400 font-bold">
                      Arriving at Earth in ~{alert.arrivalMins} minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Energy Loading Bar */}
        {(() => {
          const energy = calculateEnergyLoading();
          const barColor = energy.percentage >= 80 ? '#22c55e' : energy.percentage >= 60 ? '#84cc16' : energy.percentage >= 40 ? '#eab308' : energy.percentage >= 20 ? '#f97316' : '#6b7280';

          return (
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Magnetosphere Energy Loading</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Energy builds up when Bz stays south. At critical levels, a substorm releases aurora.
              </p>

              {/* Progress bar */}
              <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${energy.percentage}%`,
                    background: `linear-gradient(to right, #6b7280, ${barColor})`
                  }}
                />
                {/* Threshold markers */}
                <div className="absolute top-0 left-[40%] w-0.5 h-full bg-white/20" />
                <div className="absolute top-0 left-[60%] w-0.5 h-full bg-white/30" />
                <div className="absolute top-0 left-[80%] w-0.5 h-full bg-white/40" />

                {/* Percentage label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-lg">{energy.percentage}%</span>
                </div>
              </div>

              {/* Labels */}
              <div className="flex justify-between text-xs text-gray-400 mb-3">
                <span>Quiet</span>
                <span>Building</span>
                <span>High</span>
                <span>Critical</span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: barColor }}>{energy.status}</span>
                {energy.timeToSubstorm && (
                  <span className="text-sm text-gray-300">
                    Substorm possible in ~{energy.timeToSubstorm} min
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Advance Warning Info */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-purple-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-white mb-2">
                ⏱️ Advance Warning Time
              </p>
              <p className="mb-2">
                This data comes from satellites positioned between the Sun and Earth (like ACE and DSCOVR at the L1 point, ~1 million miles from Earth).
              </p>
              <p className="mb-2">
                <span className="text-cyan-400 font-semibold">You typically have 30-60 minutes</span> of advance warning from when these measurements are taken until the solar wind reaches Earth and auroras begin.
              </p>
              <p className="text-xs text-gray-400">
                Travel time varies based on solar wind speed: {solarWind.speed > 0 && (
                  <span className="text-white font-semibold">
                    ~{formatTravelTime(Math.round((1500000 / solarWind.speed) * 60))} at current speed
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-white mb-2">
                Why Bz Matters Most:
              </p>
              <p className="mb-2">
                <span className="text-purple-400 font-semibold">Bz South (negative):</span> Solar wind's magnetic field connects with Earth's field, opening the door for particles to create auroras.
              </p>
              <p className="mb-2">
                <span className="text-red-400 font-semibold">Bz North (positive):</span> Fields repel like magnets - particles are deflected away, minimal aurora.
              </p>
              <p>
                <span className="text-cyan-400 font-semibold">Bt & Speed:</span> Show the available power. High values with southward Bz = spectacular auroras!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
