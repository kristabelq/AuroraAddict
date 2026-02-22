"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Sun,
  Cloud,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  MapPin,
} from "lucide-react";

/**
 * Trip Planner Card Component
 *
 * Displays 3-day aurora forecast for trip planning.
 * Shows best viewing days and recommendations.
 */

interface DayForecast {
  date: string;
  dayOfWeek: string;
  kpExpected: number;
  kpMin: number;
  kpMax: number;
  auroraLikelihood: string;
  auroraDescription: string;
  visibleAtLatitude: Array<{
    latitude: number;
    location: string;
    probability: number;
  }>;
  bestViewingWindow?: {
    startHour: number;
    endHour: number;
    quality: string;
  };
  factors: {
    cmeExpected: boolean;
    hssExpected: boolean;
    solarFlareRisk: string;
  };
}

interface ForecastSummary {
  bestDay: string;
  bestDayReason: string;
  overallOutlook: string;
  tripRecommendation: string;
}

interface TripPlannerCardProps {
  className?: string;
  userLatitude?: number;
  compact?: boolean;
}

export function TripPlannerCard({
  className = "",
  userLatitude = 65,
  compact = false,
}: TripPlannerCardProps) {
  const [forecasts, setForecasts] = useState<DayForecast[]>([]);
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await fetch("/api/space-weather/forecast-3day");
        if (!response.ok) throw new Error("Failed to fetch forecast");

        const data = await response.json();
        setForecasts(data.forecasts || []);
        setSummary(data.summary || null);
        setAlerts(data.alerts || []);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load forecast");
        setIsLoading(false);
      }
    };

    fetchForecast();
    // Refresh every hour
    const interval = setInterval(fetchForecast, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getLikelihoodColor = (likelihood: string): string => {
    switch (likelihood) {
      case "very_likely":
        return "text-green-400";
      case "likely":
        return "text-emerald-400";
      case "possible":
        return "text-yellow-400";
      case "unlikely":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  const getLikelihoodBg = (likelihood: string): string => {
    switch (likelihood) {
      case "very_likely":
        return "bg-green-500/20";
      case "likely":
        return "bg-emerald-500/20";
      case "possible":
        return "bg-yellow-500/20";
      case "unlikely":
        return "bg-orange-500/20";
      default:
        return "bg-gray-500/20";
    }
  };

  const getKpTrend = (day: DayForecast, prevDay?: DayForecast) => {
    if (!prevDay) return null;
    if (day.kpExpected > prevDay.kpExpected + 0.5) return "up";
    if (day.kpExpected < prevDay.kpExpected - 0.5) return "down";
    return "stable";
  };

  const formatLikelihood = (likelihood: string): string => {
    return likelihood.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Find probability for user's latitude
  const getUserLatProbability = (day: DayForecast): number => {
    const closest = day.visibleAtLatitude.reduce((prev, curr) => {
      return Math.abs(curr.latitude - userLatitude) <
        Math.abs(prev.latitude - userLatitude)
        ? curr
        : prev;
    }, day.visibleAtLatitude[0]);
    return closest?.probability || 0;
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Forecast unavailable</span>
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact view for sidebars
    return (
      <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">3-Day Forecast</span>
        </div>

        <div className="space-y-2">
          {forecasts.slice(0, 3).map((day, index) => (
            <div
              key={day.date}
              className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
            >
              <div>
                <div className="text-sm text-gray-200">
                  {index === 0 ? "Today" : day.dayOfWeek.slice(0, 3)}
                </div>
                <div className="text-xs text-gray-500">Kp {day.kpExpected}</div>
              </div>
              <div
                className={`text-xs font-medium ${getLikelihoodColor(
                  day.auroraLikelihood
                )}`}
              >
                {getUserLatProbability(day)}%
              </div>
            </div>
          ))}
        </div>

        {summary && (
          <div className="mt-3 text-xs text-gray-400">
            Best day: <span className="text-white">{summary.bestDay}</span>
          </div>
        )}
      </div>
    );
  }

  const selectedForecast = forecasts[selectedDay];

  return (
    <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-gray-200">3-Day Aurora Forecast</span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 bg-amber-500/20 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-amber-200">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Day selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {forecasts.map((day, index) => {
          const trend = getKpTrend(day, forecasts[index - 1]);
          const isSelected = selectedDay === index;
          const isBestDay = summary?.bestDay === day.date;

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={`relative p-3 rounded-lg transition-all ${
                isSelected
                  ? "bg-purple-500/30 ring-1 ring-purple-500"
                  : "bg-gray-700/30 hover:bg-gray-700/50"
              }`}
            >
              {isBestDay && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}

              <div className="text-xs text-gray-400">
                {index === 0 ? "Today" : day.dayOfWeek.slice(0, 3)}
              </div>

              <div className="flex items-center justify-center gap-1 my-1">
                <span className="text-2xl font-bold text-white">
                  {day.kpExpected.toFixed(0)}
                </span>
                {trend === "up" && (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                )}
                {trend === "down" && (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                {trend === "stable" && (
                  <Minus className="w-4 h-4 text-gray-400" />
                )}
              </div>

              <div
                className={`text-xs font-medium ${getLikelihoodColor(
                  day.auroraLikelihood
                )}`}
              >
                {formatLikelihood(day.auroraLikelihood).split(" ")[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day details */}
      {selectedForecast && (
        <div className={`p-4 rounded-lg ${getLikelihoodBg(selectedForecast.auroraLikelihood)}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-white">
                {selectedDay === 0
                  ? "Today"
                  : `${selectedForecast.dayOfWeek}, ${new Date(selectedForecast.date).toLocaleDateString()}`}
              </div>
              <div
                className={`text-sm ${getLikelihoodColor(
                  selectedForecast.auroraLikelihood
                )}`}
              >
                {formatLikelihood(selectedForecast.auroraLikelihood)}
              </div>
            </div>

            {/* Special factors */}
            <div className="flex gap-2">
              {selectedForecast.factors.cmeExpected && (
                <div className="px-2 py-1 bg-red-500/20 rounded text-xs text-red-300">
                  CME
                </div>
              )}
              {selectedForecast.factors.hssExpected && (
                <div className="px-2 py-1 bg-orange-500/20 rounded text-xs text-orange-300">
                  HSS
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-3">
            {selectedForecast.auroraDescription}
          </p>

          {/* Kp range */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-800/50 rounded">
              <div className="text-xs text-gray-400">Expected</div>
              <div className="text-lg font-bold text-white">
                Kp {selectedForecast.kpExpected.toFixed(1)}
              </div>
            </div>
            <div className="text-center p-2 bg-gray-800/50 rounded">
              <div className="text-xs text-gray-400">Min</div>
              <div className="text-lg font-bold text-gray-300">
                {selectedForecast.kpMin}
              </div>
            </div>
            <div className="text-center p-2 bg-gray-800/50 rounded">
              <div className="text-xs text-gray-400">Max</div>
              <div className="text-lg font-bold text-gray-300">
                {selectedForecast.kpMax}
              </div>
            </div>
          </div>

          {/* Best viewing window */}
          {selectedForecast.bestViewingWindow && (
            <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded mb-3">
              <Sun className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">
                Best viewing:{" "}
                {selectedForecast.bestViewingWindow.startHour}:00 -{" "}
                {selectedForecast.bestViewingWindow.endHour}:00 UTC
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  selectedForecast.bestViewingWindow.quality === "excellent"
                    ? "bg-green-500/20 text-green-300"
                    : selectedForecast.bestViewingWindow.quality === "good"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {selectedForecast.bestViewingWindow.quality}
              </span>
            </div>
          )}

          {/* Visibility by latitude */}
          <div className="space-y-1">
            <div className="text-xs text-gray-400 mb-2">Visibility by Latitude</div>
            {selectedForecast.visibleAtLatitude.slice(0, 4).map((lat) => (
              <div
                key={lat.latitude}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-300">{lat.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        lat.probability >= 70
                          ? "bg-green-500"
                          : lat.probability >= 40
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                      style={{ width: `${lat.probability}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">
                    {lat.probability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Trip Recommendation</div>
          <p className="text-sm text-gray-200">{summary.tripRecommendation}</p>
          <p className="text-xs text-gray-500 mt-2">{summary.overallOutlook}</p>
        </div>
      )}
    </div>
  );
}

export default TripPlannerCard;
