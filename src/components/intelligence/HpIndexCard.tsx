"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Info } from "lucide-react";

/**
 * Hp30/Hp60 Index Card Component
 *
 * Displays the half-hourly Hp index which is more responsive than the 3-hourly Kp.
 * Shows warnings when Hp30 significantly differs from Kp (indicating activity changes).
 */

interface HpIndexData {
  hp30: number;
  hp60: number;
  timestamp: string;
  kpComparison?: {
    currentKp: number;
    hp30DiffersSignificantly: boolean;
    warning: string | null;
  };
}

interface HpIndexCardProps {
  className?: string;
  showComparison?: boolean;
  onDataLoad?: (data: HpIndexData) => void;
}

export function HpIndexCard({
  className = "",
  showComparison = true,
  onDataLoad,
}: HpIndexCardProps) {
  const [data, setData] = useState<HpIndexData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/space-weather/hp-index");
        if (!response.ok) throw new Error("Failed to fetch Hp index");

        const result = await response.json();
        const hpData: HpIndexData = {
          hp30: result.current?.hp30 || 0,
          hp60: result.current?.hp60 || 0,
          timestamp: result.current?.timestamp || new Date().toISOString(),
          kpComparison: result.kpComparison,
        };

        setData(hpData);
        setIsLoading(false);
        onDataLoad?.(hpData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(interval);
  }, [onDataLoad]);

  const getHpColor = (hp: number): string => {
    if (hp >= 7) return "text-red-400";
    if (hp >= 6) return "text-orange-400";
    if (hp >= 5) return "text-yellow-400";
    if (hp >= 4) return "text-green-400";
    if (hp >= 3) return "text-blue-400";
    return "text-gray-400";
  };

  const getHpBgColor = (hp: number): string => {
    if (hp >= 7) return "bg-red-500/20";
    if (hp >= 6) return "bg-orange-500/20";
    if (hp >= 5) return "bg-yellow-500/20";
    if (hp >= 4) return "bg-green-500/20";
    if (hp >= 3) return "bg-blue-500/20";
    return "bg-gray-500/20";
  };

  const getActivityLevel = (hp: number): string => {
    if (hp >= 7) return "Severe Storm";
    if (hp >= 6) return "Strong Storm";
    if (hp >= 5) return "Moderate Storm";
    if (hp >= 4) return "Minor Storm";
    if (hp >= 3) return "Unsettled";
    return "Quiet";
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Hp index unavailable</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hp30 = data.hp30;
  const hp60 = data.hp60;
  const kpComparison = data.kpComparison;

  return (
    <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">Hp Index</span>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-gray-500">30-min resolution</span>
      </div>

      {/* Info tooltip */}
      {showInfo && (
        <div className="mb-3 p-2 bg-gray-700/50 rounded-lg text-xs text-gray-400">
          <p className="mb-1">
            <strong>Hp30</strong> updates every 30 minutes, catching activity changes faster than the 3-hourly Kp index.
          </p>
          <p>When Hp30 differs significantly from Kp, activity may be changing.</p>
        </div>
      )}

      {/* Main values */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Hp30 */}
        <div className={`p-3 rounded-lg ${getHpBgColor(hp30)}`}>
          <div className="text-xs text-gray-400 mb-1">Hp30</div>
          <div className={`text-2xl font-bold ${getHpColor(hp30)}`}>
            {hp30.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {getActivityLevel(hp30)}
          </div>
        </div>

        {/* Hp60 */}
        <div className={`p-3 rounded-lg ${getHpBgColor(hp60)}`}>
          <div className="text-xs text-gray-400 mb-1">Hp60</div>
          <div className={`text-2xl font-bold ${getHpColor(hp60)}`}>
            {hp60.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Hourly</div>
        </div>
      </div>

      {/* Kp comparison warning */}
      {showComparison && kpComparison?.hp30DiffersSignificantly && (
        <div className="flex items-start gap-2 p-2 bg-amber-500/20 rounded-lg">
          {hp30 > kpComparison.currentKp ? (
            <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          ) : (
            <TrendingDown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-xs font-medium text-amber-300">
              Kp Lagging Behind
            </div>
            <div className="text-xs text-amber-200/80">
              Hp30 ({hp30.toFixed(1)}) differs from Kp ({kpComparison.currentKp.toFixed(1)}).
              {hp30 > kpComparison.currentKp
                ? " Activity may be increasing faster than Kp shows."
                : " Activity may be decreasing."}
            </div>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        Updated: {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default HpIndexCard;
