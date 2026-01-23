"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [solarWind, setSolarWind] = useState<SolarWindData | null>(null);
  const [solarWindHistory, setSolarWindHistory] = useState<SolarWindData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user && !session.user.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [session, status, router]);

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

  if (status === "loading" || loading) {
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

        {/* Aurora Score Meter */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 mb-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Aurora Potential Score</div>
              <div className="flex items-center gap-3">
                <div className="text-5xl font-bold" style={{ color: potential.color }}>
                  {score}
                </div>
                <div className="text-gray-400">/100</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-2">Trend</div>
              <div className="flex items-center gap-2">
                {trend.direction === "improving" && (
                  <>
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7"/>
                    </svg>
                    <span className="text-sm text-green-400 font-semibold">Improving</span>
                  </>
                )}
                {trend.direction === "worsening" && (
                  <>
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7"/>
                    </svg>
                    <span className="text-sm text-red-400 font-semibold">Worsening</span>
                  </>
                )}
                {trend.direction === "stable" && (
                  <>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14"/>
                    </svg>
                    <span className="text-sm text-gray-400 font-semibold">Stable</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden mb-4">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${score}%`,
                background: `linear-gradient(to right, ${score > 70 ? '#dc2626' : score > 45 ? '#f59e0b' : '#10b981'}, ${potential.color})`
              }}
            />
            {/* Threshold markers */}
            <div className="absolute top-0 left-[45%] w-0.5 h-full bg-white/30" />
            <div className="absolute top-0 left-[70%] w-0.5 h-full bg-white/30" />
          </div>

          {/* Additional Info */}
          <div className="flex gap-4 text-xs">
            {duration > 0 && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-gray-300">
                  Bz south for <span className="text-cyan-400 font-semibold">{duration} min</span>
                </span>
              </div>
            )}
            {solarWind.speed > 500 && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span className="text-gray-300">
                  <span className="text-orange-400 font-semibold">Fast</span> solar wind
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Aurora Potential Alert */}
        <div
          className="p-4 rounded-xl mb-6 border-2"
          style={{
            backgroundColor: `${potential.color}20`,
            borderColor: potential.color
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {potential.level === "EXCELLENT" && (
                <svg className="w-8 h-8" style={{ color: potential.color }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              )}
              {potential.level === "STRONG" && (
                <svg className="w-8 h-8" style={{ color: potential.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              )}
              {(potential.level === "MODERATE" || potential.level === "WEAK" || potential.level === "Minimal") && (
                <svg className="w-8 h-8" style={{ color: potential.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg mb-2" style={{ color: potential.color }}>
                Aurora Potential: {potential.level}
              </div>
              <p className="text-sm text-gray-300 mb-2">{potential.message}</p>
              <p className="text-sm font-semibold text-white">{potential.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Solar Wind Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {/* Bz - Most Important */}
          <div className="bg-white/10 rounded-xl p-4 border-2 border-purple-500/50">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
              <span>Bz (North-South)</span>
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: getBzColor(solarWind.bz) }}>
              {solarWind.bz >= 0 ? '+' : ''}{solarWind.bz.toFixed(1)} nT
            </div>
            <div className="text-xs text-gray-300">
              {solarWind.bz < 0 ? '⬇️ SOUTH (GOOD!)' : '⬆️ NORTH (BAD)'}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Key factor for aurora
            </div>
          </div>

          {/* Bt - Total Field Strength */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Bt (Total Field)</div>
            <div className="text-2xl font-bold mb-1" style={{ color: getBtColor(solarWind.bt) }}>
              {solarWind.bt.toFixed(1)} nT
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {solarWind.bt > 30 ? 'Very Strong' : solarWind.bt > 20 ? 'Strong' : solarWind.bt > 10 ? 'Above Normal' : 'Normal (2-10 nT)'}
            </div>
          </div>

          {/* Solar Wind Speed */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Wind Speed</div>
            <div className="text-2xl font-bold mb-1" style={{ color: getSpeedColor(solarWind.speed) }}>
              {solarWind.speed.toFixed(0)} km/s
            </div>
            <div className="flex items-center gap-2 mt-2">
              {solarWind.speed > 500 && (
                <svg className="w-4 h-4" style={{ color: getSpeedColor(solarWind.speed) }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
              )}
              <span className="text-xs text-gray-400">
                {solarWind.speed > 600 ? 'Very Fast' : solarWind.speed > 500 ? 'Fast' : solarWind.speed > 400 ? 'Moderate' : 'Normal (300-500 km/s)'}
              </span>
            </div>
          </div>

          {/* Bx */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Bx (Sun-Earth)</div>
            <div className="text-xl font-bold text-gray-300">
              {solarWind.bx >= 0 ? '+' : ''}{solarWind.bx.toFixed(1)} nT
            </div>
          </div>

          {/* By */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">By (East-West)</div>
            <div className="text-xl font-bold text-gray-300">
              {solarWind.by >= 0 ? '+' : ''}{solarWind.by.toFixed(1)} nT
            </div>
          </div>

          {/* Density */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Density</div>
            <div className="text-xl font-bold" style={{ color: getDensityColor(solarWind.density) }}>
              {solarWind.density.toFixed(1)} p/cm³
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {solarWind.density > 50 ? 'Extreme' : solarWind.density > 20 ? 'High' : solarWind.density > 8 ? 'Enhanced' : solarWind.density > 3 ? 'Normal' : 'Low'}
            </div>
          </div>
        </div>

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

                  {/* Plot line */}
                  <polyline
                    points={solarWindHistory
                      .slice(-36) // Last 3 hours (36 points at 5-min intervals)
                      .map((point, i, arr) => {
                        const x = (i / (arr.length - 1)) * 100;
                        // Map Bz from -20 to +20 range to 100% to 0% (inverted Y)
                        const y = ((20 - point.bz) / 40) * 100;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Plot points */}
                  {solarWindHistory.slice(-36).map((point, i, arr) => {
                    const x = (i / (arr.length - 1)) * 100;
                    const y = ((20 - point.bz) / 40) * 100;
                    const isSouth = point.bz < 0;

                    return (
                      <circle
                        key={i}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="3"
                        fill={isSouth ? "#10b981" : "#ef4444"}
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
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-300">South (Good for aurora)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-300">North (Bad for aurora)</span>
              </div>
            </div>
          </div>
        )}

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
