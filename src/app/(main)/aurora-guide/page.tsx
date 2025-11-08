"use client";

import { useState } from "react";
import {
  auroraLocations,
  getLocationsByKp,
  getLocationsByCountry,
  getAuroraCountries,
  kpRanges,
  AuroraLocation,
} from "@/lib/auroraLocations";

export default function AuroraGuidePage() {
  const [selectedKp, setSelectedKp] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter locations based on selected filters
  const filteredLocations = auroraLocations.filter((loc) => {
    const matchesKp = selectedKp === null || loc.minKpRequired === selectedKp;
    const matchesCountry = !selectedCountry || loc.country === selectedCountry;
    const matchesSearch =
      !searchTerm ||
      loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.region.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesKp && matchesCountry && matchesSearch;
  });

  // Group by Kp if no specific Kp is selected
  const groupedByKp = selectedKp === null
    ? Array.from({ length: 10 }, (_, i) => ({
        kp: i,
        locations: filteredLocations.filter((loc) => loc.minKpRequired === i),
      })).filter((group) => group.locations.length > 0)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1419] via-[#1a1f2e] to-[#0f1419] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white mb-2">Aurora Visibility Guide</h1>
          <p className="text-sm text-gray-400">
            Where can you see the Northern Lights? Find the minimum Kp index needed for your location.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="bg-[#1a1f2e]/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Search Location
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="City, country, or region..."
              className="w-full px-4 py-2 bg-[#0f1419] border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Filter by Kp Index
              </label>
              <select
                value={selectedKp === null ? "" : selectedKp}
                onChange={(e) =>
                  setSelectedKp(e.target.value === "" ? null : parseInt(e.target.value))
                }
                className="w-full px-4 py-2 bg-[#0f1419] border border-white/20 rounded-lg text-white focus:outline-none focus:border-aurora-green"
              >
                <option value="">All Kp Levels</option>
                {[0, 3, 4, 5, 6, 7, 8, 9].map((kp) => (
                  <option key={kp} value={kp}>
                    Kp {kp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Filter by Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1419] border border-white/20 rounded-lg text-white focus:outline-none focus:border-aurora-green"
              >
                <option value="">All Countries</option>
                {getAuroraCountries().map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(selectedKp !== null || selectedCountry || searchTerm) && (
            <button
              onClick={() => {
                setSelectedKp(null);
                setSelectedCountry("");
                setSearchTerm("");
              }}
              className="text-sm text-aurora-green hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Kp Reference Guide */}
        <div className="bg-[#1a1f2e]/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-3">Kp Index Reference</h2>
          <div className="space-y-2">
            {kpRanges.map((range) => (
              <div
                key={range.kp}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                onClick={() => setSelectedKp(range.kp)}
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                    range.kp === 0
                      ? "bg-blue-500/20 text-blue-400"
                      : range.kp <= 4
                      ? "bg-green-500/20 text-green-400"
                      : range.kp <= 6
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {range.kp}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{range.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{range.visibility}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Locations Display */}
        {groupedByKp ? (
          // Grouped by Kp view
          <div className="space-y-6">
            {groupedByKp.map((group) => (
              <div key={group.kp} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      group.kp === 0
                        ? "bg-blue-500/20 text-blue-400"
                        : group.kp <= 4
                        ? "bg-green-500/20 text-green-400"
                        : group.kp <= 6
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {group.kp}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Kp {group.kp}{" "}
                      {group.kp === 0 && "(Arctic Circle)"}
                      {group.kp === 3 && "(Classic Aurora Zones)"}
                      {group.kp >= 7 && "(Rare Events)"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {group.locations.length} location{group.locations.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {group.locations.map((location, idx) => (
                    <LocationCard key={idx} location={location} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view when Kp is selected
          <div className="grid gap-3">
            {filteredLocations.map((location, idx) => (
              <LocationCard key={idx} location={location} />
            ))}
          </div>
        )}

        {filteredLocations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No locations found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LocationCard({ location }: { location: AuroraLocation }) {
  const getKpColor = (kp: number) => {
    if (kp === 0) return "text-blue-400";
    if (kp <= 4) return "text-green-400";
    if (kp <= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getKpBg = (kp: number) => {
    if (kp === 0) return "bg-blue-500/10 border-blue-500/20";
    if (kp <= 4) return "bg-green-500/10 border-green-500/20";
    if (kp <= 6) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="bg-[#1a1f2e]/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-aurora-green/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">{location.city}</h3>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {location.latitude.toFixed(1)}°{location.latitude >= 0 ? "N" : "S"}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1">
            {location.region} • {location.country}
          </p>
          {location.notes && (
            <p className="text-xs text-aurora-green/80 mt-2">{location.notes}</p>
          )}
        </div>

        <div
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg border ${getKpBg(
            location.minKpRequired
          )}`}
        >
          <div className="text-center">
            <p className="text-xs text-gray-400">Min Kp</p>
            <p className={`text-xl font-bold ${getKpColor(location.minKpRequired)}`}>
              {location.minKpRequired}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
