"use client";

import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Zap, Clock, ArrowRight } from "lucide-react";
import { SubstormState, getSubstormPhaseColor, getSubstormPhaseDescription, getSubstormRecommendation } from "@/lib/substormDetection";

/**
 * Substorm Timeline Component
 *
 * Displays the current substorm phase with a visual timeline.
 * Shows energy loading, onset predictions, and recommended actions.
 */

interface SubstormTimelineProps {
  className?: string;
  compact?: boolean;
  onStateChange?: (state: SubstormState) => void;
}

export function SubstormTimeline({
  className = "",
  compact = false,
  onStateChange,
}: SubstormTimelineProps) {
  const [substormState, setSubstormState] = useState<SubstormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/space-weather/supermag");
        if (!response.ok) throw new Error("Failed to fetch magnetometer data");

        const data = await response.json();

        // Convert API response to SubstormState
        const state: SubstormState = {
          phase: data.substorm?.phase || "quiet",
          phaseStartTime: data.substorm?.onsetTime
            ? new Date(data.substorm.onsetTime)
            : null,
          timeInPhase: 0,
          confidence: data.substorm?.confidence || 0,
          energyLoadingLevel: Math.min(100, (data.substorm?.peakDeltaB || 0) / 10),
          energyLoadingRate: 0,
          estimatedTimeToOnset: null,
          peakDeltaB: data.substorm?.peakDeltaB || 0,
          currentDeltaB: data.substorm?.peakDeltaB || 0,
          deltaBAverageRecent: data.substorm?.peakDeltaB || 0,
          affectedLatitudeRange: {
            equatorwardEdge: 65,
            polewardEdge: 75,
          },
          expansionDirection: "none",
          expectedPeakTime: null,
          expectedRecoveryStart: null,
          alertLevel: data.substorm?.isActive ? "warning" : "none",
          alertMessage: data.substorm?.description || "",
        };

        setSubstormState(state);
        setIsLoading(false);
        onStateChange?.(state);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, [onStateChange]);

  if (isLoading) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !substormState) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Substorm data unavailable</span>
        </div>
      </div>
    );
  }

  const phases = ["quiet", "growth", "onset", "expansion", "recovery"];
  const currentPhaseIndex = phases.indexOf(substormState.phase);
  const phaseColor = getSubstormPhaseColor(substormState.phase);

  if (compact) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: phaseColor }}
            />
            <span className="text-sm font-medium text-gray-300 capitalize">
              {substormState.phase}
            </span>
          </div>
          {substormState.alertLevel !== "none" && (
            <Zap className="w-4 h-4 text-amber-400" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-gray-300">Substorm Status</span>
        </div>
        {substormState.confidence > 0 && (
          <span className="text-xs text-gray-500">
            {Math.round(substormState.confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Phase Timeline */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          {phases.map((phase, index) => (
            <div key={phase} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  index <= currentPhaseIndex
                    ? "text-white"
                    : "text-gray-500 bg-gray-700"
                }`}
                style={{
                  backgroundColor:
                    index <= currentPhaseIndex
                      ? getSubstormPhaseColor(phase as SubstormState["phase"])
                      : undefined,
                }}
              >
                {index + 1}
              </div>
              {index < phases.length - 1 && (
                <ArrowRight
                  className={`w-4 h-4 mx-1 ${
                    index < currentPhaseIndex ? "text-gray-400" : "text-gray-600"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Quiet</span>
          <span>Growth</span>
          <span>Onset</span>
          <span>Expansion</span>
          <span>Recovery</span>
        </div>
      </div>

      {/* Current Phase Info */}
      <div
        className="p-3 rounded-lg mb-3"
        style={{ backgroundColor: `${phaseColor}20` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: phaseColor }}
          />
          <span
            className="font-medium capitalize"
            style={{ color: phaseColor }}
          >
            {substormState.phase} Phase
          </span>
        </div>
        <p className="text-sm text-gray-300 mb-2">
          {getSubstormPhaseDescription(substormState.phase)}
        </p>
        <p className="text-sm text-gray-400">
          {getSubstormRecommendation(substormState)}
        </p>
      </div>

      {/* Energy Loading Bar (for growth phase) */}
      {substormState.phase === "growth" && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Energy Loading</span>
            <span>{Math.round(substormState.energyLoadingLevel)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${substormState.energyLoadingLevel}%`,
                backgroundColor: "#eab308",
              }}
            />
          </div>
          {substormState.estimatedTimeToOnset && (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
              <Clock className="w-3 h-3" />
              <span>
                Estimated onset in ~{substormState.estimatedTimeToOnset} minutes
              </span>
            </div>
          )}
        </div>
      )}

      {/* Delta B reading */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 bg-gray-700/50 rounded-lg">
          <div className="text-xs text-gray-400">Peak Delta B</div>
          <div className="text-lg font-mono text-gray-200">
            {substormState.peakDeltaB.toFixed(0)} nT
          </div>
        </div>
        <div className="p-2 bg-gray-700/50 rounded-lg">
          <div className="text-xs text-gray-400">Current</div>
          <div className="text-lg font-mono text-gray-200">
            {substormState.currentDeltaB.toFixed(0)} nT
          </div>
        </div>
      </div>

      {/* Alert message */}
      {substormState.alertMessage && substormState.alertLevel !== "none" && (
        <div className="mt-3 p-2 bg-amber-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300">
              {substormState.alertMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubstormTimeline;
