"use client";

import { useState, useEffect, useMemo } from "react";
import { useSpaceWeather } from "@/hooks/useSpaceWeather";
import {
  toGeomagneticCoordinates,
  calculateAuroraVisibility,
} from "@/lib/geomagneticCoordinates";
import {
  detectSubstormPhase,
  getSubstormRecommendation,
  type SubstormState,
} from "@/lib/substormDetection";

interface BackyardAlertCardProps {
  latitude?: number;
  longitude?: number;
  isLoadingLocation?: boolean;
  className?: string;
  onStatusChange?: (status: "go" | "maybe" | "no") => void;
}

type AlertStatus = "go" | "maybe" | "no";

interface AlertState {
  status: AlertStatus;
  headline: string;
  message: string;
  lookDirection: string;
}

export function BackyardAlertCard({
  latitude,
  longitude,
  isLoadingLocation = false,
  className = "",
  onStatusChange,
}: BackyardAlertCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [substormState, setSubstormState] = useState<SubstormState | null>(null);

  const { kpIndex, solarWind, magnetometer, isLoading, lastUpdated } = useSpaceWeather({
    enableMagnetometer: true,
    refreshInterval: 30000, // 30 seconds for real-time feel
  });

  // Calculate geomagnetic latitude
  const geomagData = useMemo(() => {
    if (!latitude || !longitude) return null;
    return toGeomagneticCoordinates(latitude, longitude);
  }, [latitude, longitude]);

  // Calculate visibility
  const visibility = useMemo(() => {
    if (!geomagData || !kpIndex) return null;
    return calculateAuroraVisibility(geomagData.geomagneticLat, kpIndex.current);
  }, [geomagData, kpIndex]);

  // Detect substorm phase
  useEffect(() => {
    if (!magnetometer || !kpIndex || !solarWind) return;

    const magnetometerData = magnetometer.stations.map((s) => ({
      stationCode: s.code,
      timestamp: new Date(),
      deltaB: s.deltaB,
      latitude: s.latitude,
      geomagLat: s.latitude, // Simplified
    }));

    const state = detectSubstormPhase({
      magnetometerData,
      currentKp: kpIndex.current,
      currentBz: solarWind.bz,
      solarWindSpeed: solarWind.speed,
      previousState: substormState || undefined,
    });

    setSubstormState(state);
  }, [magnetometer, kpIndex, solarWind]);

  // Determine alert status
  const alertState = useMemo((): AlertState => {
    if (!solarWind || !kpIndex || !visibility) {
      return {
        status: "no",
        headline: "LOADING DATA",
        message: "Fetching space weather data...",
        lookDirection: "",
      };
    }

    const bz = solarWind.bz;
    const kp = kpIndex.current;
    const phase = substormState?.phase || "quiet";
    const isVisible = visibility.isVisible;
    const isNorth = geomagData && geomagData.geomagneticLat >= 0;
    const lookDirection = isNorth ? "Look north!" : "Look south!";

    // GREEN: Active aurora conditions
    if (
      (bz < -5 && (phase === "expansion" || phase === "onset")) ||
      (bz < -5 && isVisible && kp >= 4) ||
      (phase === "expansion" && isVisible)
    ) {
      return {
        status: "go",
        headline: "AURORA LIKELY NOW",
        message: getSubstormRecommendation(substormState!) || "Good conditions for aurora!",
        lookDirection,
      };
    }

    // YELLOW: Possible aurora, worth checking
    if (
      (bz < -3 && phase === "growth") ||
      (bz < -3 && isVisible) ||
      (phase === "onset") ||
      (kp >= 3 && visibility.quality !== "none")
    ) {
      return {
        status: "maybe",
        headline: "AURORA POSSIBLE",
        message: phase === "growth"
          ? "Energy building - substorm possible soon"
          : "Conditions favorable - worth checking outside",
        lookDirection,
      };
    }

    // RED: Not likely
    return {
      status: "no",
      headline: "NOT LIKELY NOW",
      message: visibility.message || "Conditions quiet",
      lookDirection: "",
    };
  }, [solarWind, kpIndex, visibility, substormState, geomagData]);

  // Notify parent of status changes
  useEffect(() => {
    onStatusChange?.(alertState.status);
  }, [alertState.status, onStatusChange]);

  const getStatusStyles = (status: AlertStatus) => {
    switch (status) {
      case "go":
        return {
          bg: "bg-gradient-to-br from-green-900/60 to-emerald-900/60",
          border: "border-green-500/50",
          text: "text-green-400",
          glow: "shadow-lg shadow-green-500/20",
          icon: "🟢",
        };
      case "maybe":
        return {
          bg: "bg-gradient-to-br from-yellow-900/60 to-amber-900/60",
          border: "border-yellow-500/50",
          text: "text-yellow-400",
          glow: "shadow-lg shadow-yellow-500/20",
          icon: "🟡",
        };
      case "no":
        return {
          bg: "bg-gradient-to-br from-gray-800/60 to-slate-800/60",
          border: "border-gray-500/30",
          text: "text-gray-400",
          glow: "",
          icon: "🔴",
        };
    }
  };

  const styles = getStatusStyles(alertState.status);

  if (isLoading || isLoadingLocation) {
    return (
      <div className={`${styles.bg} rounded-xl p-6 border ${styles.border} ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3 mx-auto"></div>
          <div className="h-12 bg-white/10 rounded w-2/3 mx-auto"></div>
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.bg} rounded-xl p-6 border ${styles.border} ${styles.glow} ${className}`}>
      {/* Traffic Light Status */}
      <div className="text-center mb-4">
        <div className="text-5xl mb-2">{styles.icon}</div>
        <h2 className={`text-2xl sm:text-3xl font-bold ${styles.text}`}>
          {alertState.headline}
        </h2>
      </div>

      {/* Main Message */}
      <p className="text-center text-white text-lg mb-4">
        {alertState.message}
      </p>

      {/* Look Direction */}
      {alertState.lookDirection && alertState.status !== "no" && (
        <div className="text-center mb-4">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${styles.bg} border ${styles.border}`}>
            <span className="text-xl">👀</span>
            <span className={`font-semibold ${styles.text}`}>{alertState.lookDirection}</span>
          </span>
        </div>
      )}

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Bz</div>
          <div className={`text-lg font-bold ${solarWind && solarWind.bz < -5 ? "text-green-400" : solarWind && solarWind.bz < 0 ? "text-yellow-400" : "text-red-400"}`}>
            {solarWind?.bz.toFixed(1) || "--"} nT
          </div>
          <div className="text-[10px] text-gray-500">
            {solarWind && solarWind.bz < 0 ? "↓ South" : "↑ North"}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Kp</div>
          <div className={`text-lg font-bold ${kpIndex && kpIndex.current >= 5 ? "text-green-400" : kpIndex && kpIndex.current >= 3 ? "text-yellow-400" : "text-gray-400"}`}>
            {kpIndex?.current.toFixed(1) || "--"}
          </div>
          <div className="text-[10px] text-gray-500">
            {kpIndex?.trend === "rising" ? "↗ Rising" : kpIndex?.trend === "falling" ? "↘ Falling" : "→ Stable"}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Phase</div>
          <div className={`text-sm font-bold capitalize ${
            substormState?.phase === "expansion" ? "text-green-400" :
            substormState?.phase === "onset" ? "text-orange-400" :
            substormState?.phase === "growth" ? "text-yellow-400" :
            "text-gray-400"
          }`}>
            {substormState?.phase || "Quiet"}
          </div>
          <div className="text-[10px] text-gray-500">
            {substormState?.confidence ? `${Math.round(substormState.confidence * 100)}% conf` : ""}
          </div>
        </div>
      </div>

      {/* Expand/Collapse Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
      >
        {showDetails ? "Hide details ▲" : "Show details ▼"}
      </button>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          {/* Your Location */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Your geomag latitude:</span>
            <span className="text-white font-mono">
              {geomagData ? `${Math.abs(geomagData.geomagneticLat).toFixed(1)}°${geomagData.geomagneticLat >= 0 ? 'N' : 'S'}` : "--"}
            </span>
          </div>

          {/* Visibility Assessment */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Visibility assessment:</span>
            <span className={`font-medium capitalize ${
              visibility?.quality === "excellent" || visibility?.quality === "overhead" ? "text-green-400" :
              visibility?.quality === "good" ? "text-green-300" :
              visibility?.quality === "fair" ? "text-yellow-400" :
              visibility?.quality === "poor" ? "text-orange-400" :
              "text-gray-400"
            }`}>
              {visibility?.quality || "Unknown"}
            </span>
          </div>

          {/* Min Kp Needed */}
          {visibility && !visibility.isVisible && visibility.message && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Kp needed:</span>
              <span className="text-white">
                {visibility.message.match(/Kp (\d+)/)?.[0] || "Higher Kp"}
              </span>
            </div>
          )}

          {/* Solar Wind Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Wind speed:</span>
              <span className="text-white">{solarWind?.speed.toFixed(0) || "--"} km/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bt:</span>
              <span className="text-white">{solarWind?.bt.toFixed(1) || "--"} nT</span>
            </div>
          </div>

          {/* Substorm Details */}
          {substormState && substormState.phase !== "quiet" && (
            <div className="bg-white/5 rounded-lg p-3 text-sm">
              <div className="font-medium text-white mb-1">Substorm Activity</div>
              <div className="text-gray-400 text-xs space-y-1">
                <div>Peak ΔB: {substormState.peakDeltaB.toFixed(0)} nT</div>
                {substormState.estimatedTimeToOnset && (
                  <div>Est. onset: ~{substormState.estimatedTimeToOnset} min</div>
                )}
                {substormState.expectedPeakTime && (
                  <div>Expected peak: {substormState.expectedPeakTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                )}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center">
            Last updated: {lastUpdated?.toLocaleTimeString() || "Never"}
          </div>
        </div>
      )}
    </div>
  );
}
