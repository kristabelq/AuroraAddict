"use client";

import { useMemo } from "react";
import {
  calculateNewellCoupling,
  getCouplingColor,
  type NewellCouplingResult,
} from "@/lib/newellCoupling";
import {
  getSubstormPhaseColor,
  type SubstormState,
} from "@/lib/substormDetection";

interface RealTimeStatusCardProps {
  bz: number;
  by: number;
  bt: number;
  speed: number;
  density: number;
  hemispherePower: number | null;
  substormPhase: SubstormState["phase"];
  substormConfidence: number;
  energyLoadingLevel: number;
  energyLoadingRate: number;
  timeToOnset: number | null;
  expectedPeakTime: Date | null;
  expectedRecoveryStart: Date | null;
  isLoading?: boolean;
  className?: string;
}

export function RealTimeStatusCard({
  bz,
  by,
  bt,
  speed,
  density,
  hemispherePower,
  substormPhase,
  substormConfidence,
  energyLoadingLevel,
  energyLoadingRate,
  timeToOnset,
  expectedPeakTime,
  isLoading = false,
  className = "",
}: RealTimeStatusCardProps) {
  const coupling = useMemo((): NewellCouplingResult => {
    return calculateNewellCoupling({
      solarWindSpeed: speed,
      imfBz: bz,
      imfBy: by,
      imfBt: bt,
    });
  }, [speed, bz, by, bt]);

  const bzStatus = useMemo(() => {
    if (bz <= -10) return { text: "Strongly South", emoji: "🟢", color: "text-green-400", bg: "bg-green-500/20" };
    if (bz <= -5) return { text: "South", emoji: "🟢", color: "text-green-400", bg: "bg-green-500/20" };
    if (bz < 0) return { text: "Weakly South", emoji: "🟡", color: "text-yellow-400", bg: "bg-yellow-500/20" };
    if (bz === 0) return { text: "Neutral", emoji: "⚪", color: "text-gray-400", bg: "bg-gray-500/20" };
    if (bz <= 5) return { text: "Weakly North", emoji: "🔴", color: "text-red-400", bg: "bg-red-500/20" };
    return { text: "Strongly North", emoji: "🔴", color: "text-red-400", bg: "bg-red-500/20" };
  }, [bz]);

  const phaseInfo = useMemo(() => {
    const color = getSubstormPhaseColor(substormPhase);
    let emoji = "😴", label = "Quiet";
    switch (substormPhase) {
      case "growth": emoji = "🌀"; label = "Growth"; break;
      case "onset": emoji = "⚡"; label = "Onset"; break;
      case "expansion": emoji = "💥"; label = "ACTIVE"; break;
      case "recovery": emoji = "📉"; label = "Fading"; break;
    }
    return { color, emoji, label };
  }, [substormPhase]);

  const activityText = useMemo(() => {
    if (substormPhase === "expansion" || substormPhase === "onset") return "NOW";
    if (substormPhase === "growth" && timeToOnset) return `~${timeToOnset}m`;
    if (substormPhase === "recovery") return "Fading";
    return "No activity";
  }, [substormPhase, timeToOnset]);

  // Traffic light colors for metrics (green = good for aurora)
  const energyColor = useMemo(() => {
    if (energyLoadingLevel >= 70) return { text: "text-green-400", hex: "#22c55e" }; // High = substorm imminent
    if (energyLoadingLevel >= 40) return { text: "text-yellow-400", hex: "#eab308" }; // Building
    return { text: "text-red-400", hex: "#ef4444" }; // Low = quiet
  }, [energyLoadingLevel]);

  const windColor = useMemo(() => {
    if (speed >= 550) return "text-green-400"; // Fast = good
    if (speed >= 400) return "text-yellow-400"; // Moderate
    return "text-red-400"; // Slow = not great
  }, [speed]);

  // Bt color (higher = more energy available)
  const btColor = useMemo(() => {
    if (bt >= 15) return "text-green-400"; // Strong field
    if (bt >= 8) return "text-yellow-400"; // Moderate
    return "text-gray-400"; // Weak
  }, [bt]);

  // Density color (higher = more intense aurora)
  const densityColor = useMemo(() => {
    if (density >= 10) return "text-green-400"; // High density
    if (density >= 5) return "text-yellow-400"; // Moderate
    return "text-gray-400"; // Low
  }, [density]);

  // HP color (hemisphere power)
  const hpColor = useMemo(() => {
    if (hemispherePower && hemispherePower >= 50) return "text-green-400"; // Strong
    if (hemispherePower && hemispherePower >= 20) return "text-yellow-400"; // Moderate
    return "text-gray-400"; // Low
  }, [hemispherePower]);

  if (isLoading) {
    return (
      <div className={`bg-purple-900/30 rounded-xl p-3 border border-purple-500/30 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-12 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-purple-900/30 rounded-xl border border-purple-500/30 overflow-hidden ${className}`}>
      {/* Header - Phase Status */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: `linear-gradient(90deg, ${phaseInfo.color}25, ${phaseInfo.color}05)` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{phaseInfo.emoji}</span>
          <span className="text-lg font-bold uppercase" style={{ color: phaseInfo.color }}>
            {phaseInfo.label}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400 uppercase">Activity</div>
          <div className={`text-sm font-bold ${
            activityText === "NOW" ? "text-green-400" :
            activityText === "No activity" ? "text-gray-500" : "text-yellow-400"
          }`}>
            {activityText}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3">
        {/* Bz Traffic Light - Key Visual */}
        <div className={`rounded-lg px-3 py-2 ${bzStatus.bg} border border-white/10 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{bzStatus.emoji}</span>
            <div>
              <div className="text-[10px] text-gray-400 uppercase">IMF Bz</div>
              <div className={`text-lg font-bold ${bzStatus.color}`}>{bz.toFixed(1)} nT</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-semibold ${bzStatus.color}`}>{bzStatus.text}</div>
            <div className="text-[10px] text-gray-500">{bz < 0 ? "Energy entering" : "Energy blocked"}</div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Energy Loading */}
          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
            <div className="text-[10px] text-gray-500 uppercase">Energy</div>
            <div className={`text-base font-bold ${energyColor.text}`}>
              {energyLoadingLevel.toFixed(0)}%
              {energyLoadingRate > 0 && <span className="text-xs ml-1">↑</span>}
            </div>
            <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${energyLoadingLevel}%`,
                  background: energyColor.hex,
                }}
              />
            </div>
          </div>

          {/* Newell Coupling */}
          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
            <div className="text-[10px] text-gray-500 uppercase">Coupling</div>
            <div className="text-base font-bold" style={{ color: getCouplingColor(coupling.couplingLevel) }}>
              {coupling.coupling >= 1000 ? `${(coupling.coupling / 1000).toFixed(1)}k` : coupling.coupling}
            </div>
            <div className="text-[10px] capitalize" style={{ color: getCouplingColor(coupling.couplingLevel) }}>
              {coupling.couplingLevel.replace("_", " ")}
            </div>
          </div>

          {/* Wind Speed */}
          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
            <div className="text-[10px] text-gray-500 uppercase">Wind</div>
            <div className={`text-base font-bold ${windColor}`}>
              {speed.toFixed(0)}
            </div>
            <div className="text-[10px] text-gray-500">km/s</div>
          </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Bt (Total Field) */}
          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
            <div className="text-[10px] text-gray-500 uppercase">Bt</div>
            <div className={`text-base font-bold ${btColor}`}>
              {bt.toFixed(1)}
            </div>
            <div className="text-[10px] text-gray-500">nT</div>
          </div>

          {/* Density */}
          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
            <div className="text-[10px] text-gray-500 uppercase">Density</div>
            <div className={`text-base font-bold ${densityColor}`}>
              {density.toFixed(1)}
            </div>
            <div className="text-[10px] text-gray-500">p/cm³</div>
          </div>

          {/* Hemisphere Power */}
          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
            <div className="text-[10px] text-gray-500 uppercase">HP</div>
            <div className={`text-base font-bold ${hpColor}`}>
              {hemispherePower ?? '--'}
            </div>
            <div className="text-[10px] text-gray-500">GW</div>
          </div>
        </div>

        {/* Phase Timeline (only when not quiet) */}
        {substormPhase !== "quiet" && (
          <div className="flex gap-1">
            {["growth", "onset", "expansion", "recovery"].map((phase) => {
              const isActive = substormPhase === phase;
              const phaseIdx = ["growth", "onset", "expansion", "recovery"].indexOf(phase);
              const currentIdx = ["growth", "onset", "expansion", "recovery"].indexOf(substormPhase);
              const isPast = currentIdx > phaseIdx;
              return (
                <div key={phase} className="flex-1">
                  <div className={`h-1.5 rounded-full ${isActive ? "bg-white" : isPast ? "bg-white/40" : "bg-white/15"}`} />
                  <div className={`text-[9px] text-center mt-0.5 capitalize ${isActive ? "text-white" : "text-gray-600"}`}>
                    {phase === "expansion" ? "peak" : phase}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RealTimeStatusCard;
