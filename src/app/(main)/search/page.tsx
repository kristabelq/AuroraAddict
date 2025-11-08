"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Sighting {
  id: string;
  images: string[];
  location: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  _count: {
    likes: number;
  };
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentKp, setCurrentKp] = useState<string>("0.00");
  const [loadingKp, setLoadingKp] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    fetch("/api/sightings/all")
      .then((res) => res.json())
      .then((data) => setSightings(Array.isArray(data) ? data : []));

    // Fetch current KP index
    fetchCurrentKp();
  }, []);

  // Location autocomplete
  useEffect(() => {
    if (!locationSearch || locationSearch.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            locationSearch
          )}&limit=5`,
          {
            headers: {
              "User-Agent": "AuroraAddict/1.0",
            },
          }
        );
        const data = await response.json();
        setLocationSuggestions(data);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [locationSearch]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchCurrentKp = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
      );
      const data = await response.json();

      // Find the most recent observed KP value
      const formattedData = data.slice(1);
      const latestObserved = formattedData
        .filter((row: string[]) => row[2] === "observed")
        .pop();

      if (latestObserved) {
        setCurrentKp(latestObserved[1]);
      }
      setLoadingKp(false);
    } catch (error) {
      console.error("Error fetching KP data:", error);
      setLoadingKp(false);
    }
  };

  const getKpColor = (kp: number) => {
    if (kp >= 5) return "#ff0000";
    if (kp >= 4) return "#ffaa00";
    if (kp >= 3) return "#ffff00";
    return "#00ff00";
  };

  // Filter and sort sightings
  const filteredSightings = sightings
    .filter((sighting) => {
      // Text search filter
      const matchesSearch = sighting.location
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Month filter
      const sightingDate = new Date(sighting.createdAt);
      const matchesMonth =
        !selectedMonth || sightingDate.getMonth() + 1 === parseInt(selectedMonth);

      // Year filter
      const matchesYear =
        !selectedYear || sightingDate.getFullYear() === parseInt(selectedYear);

      return matchesSearch && matchesMonth && matchesYear;
    })
    .map((sighting) => {
      // Calculate distance if location is selected
      if (selectedLocation) {
        const distance = calculateDistance(
          selectedLocation.lat,
          selectedLocation.lng,
          sighting.latitude,
          sighting.longitude
        );
        return { ...sighting, distance };
      }
      return { ...sighting, distance: undefined };
    })
    .filter((sighting) => {
      // Filter out sightings more than 400km away when location is selected
      if (selectedLocation && sighting.distance !== undefined) {
        return sighting.distance <= 400;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by distance if location is selected
      if (selectedLocation && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      // Otherwise sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Get available years from sightings
  const availableYears = Array.from(
    new Set(sightings.map((s) => new Date(s.createdAt).getFullYear()))
  ).sort((a, b) => b - a);

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Search Bar */}
      <div className="sticky top-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 p-4 z-40">
        <div className="max-w-screen-lg mx-auto space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 rounded-full px-4 py-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search sightings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-full transition-colors ${
                showFilters || selectedLocation || selectedMonth || selectedYear
                  ? "bg-aurora-green text-black"
                  : "bg-white/10 text-white"
              }`}
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white/5 rounded-xl p-4 space-y-4">
              {/* Location Filter */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Search by Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Enter a location..."
                    className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                  />
                  {selectedLocation && (
                    <button
                      onClick={() => {
                        setSelectedLocation(null);
                        setLocationSearch("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                  {locationSuggestions.length > 0 && !selectedLocation && (
                    <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedLocation({
                              lat: parseFloat(suggestion.lat),
                              lng: parseFloat(suggestion.lon),
                            });
                            setLocationSearch(suggestion.display_name);
                            setLocationSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors"
                        >
                          {suggestion.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedLocation && (
                  <p className="text-xs text-aurora-green mt-1">
                    Showing sightings within 400km radius • Sorted by distance
                  </p>
                )}
              </div>

              {/* Month and Year Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green [&>option]:bg-gray-800 [&>option]:text-white"
                  >
                    <option value="">All Months</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green [&>option]:bg-gray-800 [&>option]:text-white"
                  >
                    <option value="">All Years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(selectedLocation || selectedMonth || selectedYear) && (
                <button
                  onClick={() => {
                    setSelectedLocation(null);
                    setLocationSearch("");
                    setSelectedMonth("");
                    setSelectedYear("");
                  }}
                  className="w-full bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KP Index Card */}
      <div className="p-4 max-w-screen-lg mx-auto">
        <div
          onClick={() => router.push("/forecast")}
          className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-lg rounded-2xl p-6 mb-4 cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm mb-1">Current KP Index</div>
              <div className="flex items-end gap-2">
                {loadingKp ? (
                  <div className="text-4xl font-bold text-gray-400">...</div>
                ) : (
                  <>
                    <div
                      className="text-5xl font-bold"
                      style={{ color: getKpColor(parseFloat(currentKp)) }}
                    >
                      {parseFloat(currentKp).toFixed(1)}
                    </div>
                    <div className="text-gray-400 text-sm mb-2">
                      {parseFloat(currentKp) >= 5
                        ? "High Activity"
                        : parseFloat(currentKp) >= 3
                        ? "Moderate"
                        : "Low Activity"}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white/10 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-aurora-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="text-xs text-gray-400">View Forecast</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-1 max-w-screen-lg mx-auto">
        <div className="grid grid-cols-3 gap-1">
          {filteredSightings.map((sighting) => (
            <div
              key={sighting.id}
              className="aspect-square relative group cursor-pointer"
            >
              <img
                src={sighting.images[0]}
                alt={sighting.location}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-5 h-5"
                      fill="white"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>{sighting._count.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
