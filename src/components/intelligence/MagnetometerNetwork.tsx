"use client";

import { useState, useEffect } from "react";
import { Radio, AlertTriangle, Wifi, WifiOff, Activity } from "lucide-react";

/**
 * Magnetometer Network Component
 *
 * Displays a map of magnetometer stations with real-time delta B readings.
 * Color-coded to show activity levels at each station.
 */

interface MagnetometerStation {
  code: string;
  name: string;
  network: string;
  deltaB: number;
  latitude: number;
  longitude: number;
  geomagLat: number;
  substormIndicator: "quiet" | "minor" | "moderate" | "strong" | "intense";
}

interface MagnetometerNetworkProps {
  className?: string;
  showMap?: boolean;
  maxStations?: number;
}

export function MagnetometerNetwork({
  className = "",
  showMap = false,
  maxStations = 10,
}: MagnetometerNetworkProps) {
  const [stations, setStations] = useState<MagnetometerStation[]>([]);
  const [chainStats, setChainStats] = useState<
    Record<string, { avgDeltaB: number; maxDeltaB: number; activeStations: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/space-weather/supermag");
        if (!response.ok) throw new Error("Failed to fetch magnetometer data");

        const data = await response.json();

        setStations(data.stations || []);
        setChainStats(data.chains || {});
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, []);

  const getIndicatorColor = (indicator: MagnetometerStation["substormIndicator"]): string => {
    switch (indicator) {
      case "intense":
        return "bg-red-500";
      case "strong":
        return "bg-orange-500";
      case "moderate":
        return "bg-yellow-500";
      case "minor":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getIndicatorTextColor = (indicator: MagnetometerStation["substormIndicator"]): string => {
    switch (indicator) {
      case "intense":
        return "text-red-400";
      case "strong":
        return "text-orange-400";
      case "moderate":
        return "text-yellow-400";
      case "minor":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const filteredStations = selectedChain
    ? stations.filter((s) => s.network === selectedChain)
    : stations;

  const displayStations = filteredStations
    .sort((a, b) => b.deltaB - a.deltaB)
    .slice(0, maxStations);

  if (isLoading) {
    return (
      <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
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
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Magnetometer network unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-gray-300">
            Magnetometer Network
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Wifi className="w-3 h-3" />
          <span>{stations.length} stations</span>
        </div>
      </div>

      {/* Chain filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedChain(null)}
          className={`px-2 py-1 text-xs rounded-full transition-colors ${
            !selectedChain
              ? "bg-purple-500/30 text-purple-300"
              : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50"
          }`}
        >
          All
        </button>
        {Object.keys(chainStats).map((chain) => (
          <button
            key={chain}
            onClick={() => setSelectedChain(chain === selectedChain ? null : chain)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              selectedChain === chain
                ? "bg-purple-500/30 text-purple-300"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50"
            }`}
          >
            {chain}
            {chainStats[chain]?.activeStations > 0 && (
              <span className="ml-1 text-green-400">
                ({chainStats[chain].activeStations})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chain stats */}
      {selectedChain && chainStats[selectedChain] && (
        <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-gray-700/30 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-400">Avg ΔB</div>
            <div className="text-sm font-mono text-gray-200">
              {chainStats[selectedChain].avgDeltaB.toFixed(0)} nT
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Max ΔB</div>
            <div className="text-sm font-mono text-gray-200">
              {chainStats[selectedChain].maxDeltaB.toFixed(0)} nT
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Active</div>
            <div className="text-sm font-mono text-green-400">
              {chainStats[selectedChain].activeStations}
            </div>
          </div>
        </div>
      )}

      {/* Station list */}
      <div className="space-y-2">
        {displayStations.map((station) => (
          <div
            key={station.code}
            className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${getIndicatorColor(
                  station.substormIndicator
                )}`}
              />
              <div>
                <div className="text-sm text-gray-200">{station.name}</div>
                <div className="text-xs text-gray-500">
                  {station.code} • {station.geomagLat.toFixed(1)}° geomag
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-mono ${getIndicatorTextColor(
                  station.substormIndicator
                )}`}
              >
                {station.deltaB.toFixed(0)} nT
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {station.substormIndicator}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-500 mb-2">Activity Levels (Delta B)</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-400">&lt;100 nT</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400">100-300</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-400">300-500</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-gray-400">500-1000</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-400">&gt;1000</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MagnetometerNetwork;
