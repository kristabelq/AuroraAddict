"use client";

import { useState, useMemo } from "react";
import { REFERENCE_CITIES, toGeomagneticCoordinates, calculateAuroraVisibility } from "@/lib/geomagneticCoordinates";
import { useSpaceWeather } from "@/hooks/useSpaceWeather";

interface DestinationCompareProps {
  className?: string;
}

interface Destination {
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  geomagLat: number;
  minKpRequired: number;
  chanceCurrent: number; // 0-100 based on current Kp
  note: string;
  hemisphere: "north" | "south";
}

// Country code mapping for flags
const COUNTRY_CODES: Record<string, string> = {
  "Norway": "NO",
  "Iceland": "IS",
  "Finland": "FI",
  "Sweden": "SE",
  "Canada": "CA",
  "USA": "US",
  "Russia": "RU",
  "UK": "GB",
  "Scotland": "GB",
  "Ireland": "IE",
  "Germany": "DE",
  "Switzerland": "CH",
  "Denmark": "DK",
  "New Zealand": "NZ",
  "Australia": "AU",
  "Argentina": "AR",
  "Chile": "CL",
  "South Africa": "ZA",
  "China": "CN",
};

function getCountryCode(name: string): string {
  // Extract country from city name
  const parts = name.split(", ");
  const country = parts[parts.length - 1];
  return COUNTRY_CODES[country] || "UN";
}

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Calculate minimum Kp required for a given geomagnetic latitude
function calculateMinKp(geomagLat: number): number {
  const absLat = Math.abs(geomagLat);
  // Kp = (67 - absLat) / 2.5 (inverse of auroral oval formula)
  const minKp = Math.max(0, Math.ceil((67 - absLat) / 2.5));
  return Math.min(9, minKp);
}

// Calculate current aurora chance based on Kp
function calculateChance(geomagLat: number, currentKp: number): number {
  const minKp = calculateMinKp(geomagLat);

  if (currentKp >= minKp + 2) return 95;
  if (currentKp >= minKp + 1) return 80;
  if (currentKp >= minKp) return 60;
  if (currentKp >= minKp - 1) return 30;
  if (currentKp >= minKp - 2) return 10;
  return 0;
}

export function DestinationCompare({ className = "" }: DestinationCompareProps) {
  const [hemisphereFilter, setHemisphereFilter] = useState<"all" | "north" | "south">("all");
  const [sortBy, setSortBy] = useState<"chance" | "minKp" | "name">("chance");

  const { kpIndex, isLoading } = useSpaceWeather({
    refreshInterval: 60000,
  });

  const currentKp = kpIndex?.current || 0;

  // Process destinations from REFERENCE_CITIES
  const destinations = useMemo((): Destination[] => {
    return REFERENCE_CITIES.map(city => {
      const geomag = toGeomagneticCoordinates(city.geographicLat, city.geographicLon);
      const minKp = calculateMinKp(geomag.geomagneticLat);
      const chance = calculateChance(geomag.geomagneticLat, currentKp);

      return {
        name: city.name.split(", ")[0], // City name only
        country: city.name.split(", ").slice(1).join(", ") || "Unknown",
        countryCode: getCountryCode(city.name),
        latitude: city.geographicLat,
        longitude: city.geographicLon,
        geomagLat: geomag.geomagneticLat,
        minKpRequired: minKp,
        chanceCurrent: chance,
        note: city.note || "",
        hemisphere: city.geographicLat >= 0 ? "north" : "south",
      };
    });
  }, [currentKp]);

  // Filter and sort
  const filteredDestinations = useMemo(() => {
    let filtered = destinations;

    if (hemisphereFilter !== "all") {
      filtered = filtered.filter(d => d.hemisphere === hemisphereFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "chance":
          return b.chanceCurrent - a.chanceCurrent;
        case "minKp":
          return a.minKpRequired - b.minKpRequired;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [destinations, hemisphereFilter, sortBy]);

  // Top recommendations
  const topDestinations = filteredDestinations.slice(0, 8);

  const getChanceColor = (chance: number) => {
    if (chance >= 80) return "text-green-400";
    if (chance >= 50) return "text-yellow-400";
    if (chance >= 20) return "text-orange-400";
    return "text-red-400";
  };

  const getChanceBg = (chance: number) => {
    if (chance >= 80) return "bg-green-500/20";
    if (chance >= 50) return "bg-yellow-500/20";
    if (chance >= 20) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  const getMinKpColor = (minKp: number) => {
    if (minKp <= 2) return "text-green-400";
    if (minKp <= 4) return "text-yellow-400";
    if (minKp <= 6) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className={`bg-white/5 rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>📍</span>
            <span>Destination Comparison</span>
          </h3>
          <div className="text-xs text-gray-400">
            Current Kp: <span className="text-aurora-green font-medium">{currentKp.toFixed(1)}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden text-xs">
            {(["all", "north", "south"] as const).map(h => (
              <button
                key={h}
                onClick={() => setHemisphereFilter(h)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  hemisphereFilter === h
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {h === "all" ? "All" : h === "north" ? "🌐 North" : "🌍 South"}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "chance" | "minKp" | "name")}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-aurora-green"
          >
            <option value="chance">Sort: Current Chance</option>
            <option value="minKp">Sort: Min Kp Needed</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* Destinations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400 text-xs">
            <tr>
              <th className="text-left p-3">Destination</th>
              <th className="text-center p-3">Now</th>
              <th className="text-center p-3">Min Kp</th>
              <th className="text-left p-3 hidden sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {topDestinations.map((dest, index) => (
              <tr
                key={dest.name + dest.country}
                className={`border-t border-white/5 hover:bg-white/5 transition-colors ${
                  index === 0 && dest.chanceCurrent >= 60 ? "bg-green-900/10" : ""
                }`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(dest.countryCode)}</span>
                    <div>
                      <div className="font-medium text-white">{dest.name}</div>
                      <div className="text-xs text-gray-500">{dest.country}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-flex items-center justify-center w-12 py-1 rounded ${getChanceBg(dest.chanceCurrent)} ${getChanceColor(dest.chanceCurrent)} font-medium`}>
                    {dest.chanceCurrent}%
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className={`font-medium ${getMinKpColor(dest.minKpRequired)}`}>
                    Kp {dest.minKpRequired}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-500 hidden sm:table-cell max-w-[200px] truncate">
                  {dest.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More */}
      {filteredDestinations.length > 8 && (
        <div className="p-3 text-center border-t border-white/10">
          <span className="text-xs text-gray-500">
            Showing top 8 of {filteredDestinations.length} destinations
          </span>
        </div>
      )}

      {/* Solar Cycle Info */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <div className="text-sm font-medium text-white mb-1">
              Solar Maximum Approaching
            </div>
            <p className="text-xs text-gray-400">
              We're nearing the peak of Solar Cycle 25 (expected 2024-2026). This means more frequent aurora activity,
              even at lower latitudes. Great time for mid-latitude destinations like Scotland, northern USA, or New Zealand!
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-white/10">
        <div className="text-[10px] text-gray-500 mb-2">Current Chance Legend</div>
        <div className="flex flex-wrap gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-8 text-center py-0.5 rounded bg-green-500/20 text-green-400">80%+</div>
            <span className="text-gray-400">Excellent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 text-center py-0.5 rounded bg-yellow-500/20 text-yellow-400">50%</div>
            <span className="text-gray-400">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 text-center py-0.5 rounded bg-orange-500/20 text-orange-400">20%</div>
            <span className="text-gray-400">Possible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 text-center py-0.5 rounded bg-red-500/20 text-red-400">&lt;20%</div>
            <span className="text-gray-400">Unlikely</span>
          </div>
        </div>
      </div>
    </div>
  );
}
