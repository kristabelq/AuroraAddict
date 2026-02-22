"use client";

import { useState, useEffect, useMemo } from "react";
import { useSpaceWeather } from "@/hooks/useSpaceWeather";
import {
  detectSubstormPhase,
  getSubstormPhaseDescription,
  getSubstormPhaseColor,
  type SubstormState,
} from "@/lib/substormDetection";

interface ActivityWindowCardProps {
  latitude?: number;
  longitude?: number;
  className?: string;
}

const PHASES = ["quiet", "growth", "onset", "expansion", "recovery"] as const;

export function ActivityWindowCard({
  latitude,
  longitude,
  className = "",
}: ActivityWindowCardProps) {
  const [substormState, setSubstormState] = useState<SubstormState | null>(null);

  const { kpIndex, solarWind, magnetometer, isLoading } = useSpaceWeather({
    enableMagnetometer: true,
    refreshInterval: 30000,
  });

  // Detect substorm phase
  useEffect(() => {
    if (!magnetometer || !kpIndex || !solarWind) return;

    const magnetometerData = magnetometer.stations.map((s) => ({
      stationCode: s.code,
      timestamp: new Date(),
      deltaB: s.deltaB,
      latitude: s.latitude,
      geomagLat: s.latitude,
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

  // Calculate activity window times
  const activityWindow = useMemo(() => {
    if (!substormState) return null;

    const now = new Date();
    let windowStart: Date | null = null;
    let windowEnd: Date | null = null;
    let confidence = substormState.confidence * 100;

    switch (substormState.phase) {
      case "quiet":
        // No active window
        return null;

      case "growth":
        // Activity expected after energy loading completes
        if (substormState.estimatedTimeToOnset) {
          windowStart = new Date(now.getTime() + substormState.estimatedTimeToOnset * 60000);
          windowEnd = new Date(windowStart.getTime() + 90 * 60000); // ~90 min of activity
        }
        break;

      case "onset":
      case "expansion":
        // Activity happening now
        windowStart = now;
        if (substormState.expectedRecoveryStart) {
          windowEnd = new Date(substormState.expectedRecoveryStart.getTime() + 60 * 60000);
        } else {
          windowEnd = new Date(now.getTime() + 60 * 60000);
        }
        break;

      case "recovery":
        // Fading activity
        windowStart = now;
        windowEnd = new Date(now.getTime() + 30 * 60000);
        confidence = Math.max(20, confidence - 30); // Lower confidence in recovery
        break;
    }

    return { windowStart, windowEnd, confidence };
  }, [substormState]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getCurrentPhaseIndex = () => {
    if (!substormState) return 0;
    return PHASES.indexOf(substormState.phase as typeof PHASES[number]);
  };

  if (isLoading) {
    return (
      <div className={`bg-white/5 rounded-xl p-4 border border-white/10 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-white/10 rounded w-1/3"></div>
          <div className="h-8 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 rounded-xl p-4 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>⏰</span>
          <span>Activity Window</span>
        </h3>
        {substormState && substormState.phase !== "quiet" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
            {Math.round(substormState.confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Phase Timeline */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          {PHASES.map((phase, index) => {
            const isActive = substormState?.phase === phase;
            const isPast = index < getCurrentPhaseIndex();
            const color = isActive ? getSubstormPhaseColor(phase) : isPast ? "#4b5563" : "#374151";

            return (
              <div key={phase} className="flex flex-col items-center flex-1">
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    isActive ? "ring-2 ring-offset-2 ring-offset-[#0a0e17]" : ""
                  }`}
                  style={{
                    backgroundColor: color,
                    // @ts-expect-error - CSS custom property for ring color
                    "--tw-ring-color": color,
                  }}
                />
                <span className={`text-[10px] mt-1 capitalize ${isActive ? "text-white font-medium" : "text-gray-500"}`}>
                  {phase === "quiet" ? "Quiet" :
                   phase === "growth" ? "Growth" :
                   phase === "onset" ? "Onset" :
                   phase === "expansion" ? "Active" : "Fading"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar connecting phases */}
        <div className="relative h-1 bg-gray-700 rounded-full mx-3">
          <div
            className="absolute h-full rounded-full transition-all duration-500"
            style={{
              width: `${(getCurrentPhaseIndex() / (PHASES.length - 1)) * 100}%`,
              backgroundColor: substormState ? getSubstormPhaseColor(substormState.phase) : "#374151",
            }}
          />
        </div>
      </div>

      {/* Current Phase Description */}
      <div className="bg-white/5 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: substormState ? getSubstormPhaseColor(substormState.phase) : "#6b7280" }}
          />
          <span className="text-sm font-medium text-white capitalize">
            {substormState?.phase || "Quiet"} Phase
          </span>
          {substormState?.timeInPhase ? (
            <span className="text-xs text-gray-400">({substormState.timeInPhase} min)</span>
          ) : null}
        </div>
        <p className="text-xs text-gray-400">
          {substormState ? getSubstormPhaseDescription(substormState.phase) : "Monitoring for activity..."}
        </p>
      </div>

      {/* Activity Window Times */}
      {activityWindow && activityWindow.windowStart && activityWindow.windowEnd ? (
        <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-3 border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-purple-300">Expected Activity Window</span>
            <span className="text-xs text-purple-400">{Math.round(activityWindow.confidence)}% likely</span>
          </div>
          <div className="text-lg font-bold text-white">
            {formatTime(activityWindow.windowStart)} - {formatTime(activityWindow.windowEnd)}
          </div>
          {substormState?.phase === "growth" && substormState.estimatedTimeToOnset && (
            <div className="text-xs text-purple-300 mt-1">
              Activity expected in ~{substormState.estimatedTimeToOnset} minutes
            </div>
          )}
          {(substormState?.phase === "onset" || substormState?.phase === "expansion") && (
            <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Activity happening NOW
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-400">
            No significant activity window predicted
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {solarWind && solarWind.bz > 0
              ? "Bz is northward - waiting for southward turn"
              : "Monitoring for energy loading..."}
          </div>
        </div>
      )}

      {/* Energy Loading Bar (Growth Phase) */}
      {substormState?.phase === "growth" && substormState.energyLoadingLevel > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Energy Loading</span>
            <span className="text-yellow-400">{substormState.energyLoadingLevel}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${substormState.energyLoadingLevel}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            Loading at {substormState.energyLoadingRate.toFixed(1)}%/min
          </div>
        </div>
      )}

      {/* Based On Info */}
      {solarWind && (
        <div className="mt-3 text-[10px] text-gray-500">
          Based on: Bz {solarWind.bz.toFixed(1)} nT • Wind {solarWind.speed.toFixed(0)} km/s •
          {magnetometer && magnetometer.stations.length > 0 && ` ${magnetometer.stations.length} stations`}
        </div>
      )}
    </div>
  );
}
