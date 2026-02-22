"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TimeHeader from "@/components/TimeHeader";

interface RoomType {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  priceFrom: number | null;
  currency: string;
  amenities: string[];
  images: string[];
  coverImage: string | null;
}

interface Accommodation {
  id: string;
  businessName: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string | null;
  website: string | null;
  geomagneticLat: number;
  minKpRequired: number;
  estimatedSightingPercentage: number;
  actualSuccessRate: number; // Based on real sightings
  daysWithSightings: number; // Number of unique days with sightings
  hasSightingData: boolean; // Whether we have real sighting data
  auroraQuality: "Excellent" | "Very Good" | "Good" | "Fair" | "Limited";
  roomTypes: RoomType[];
  totalRoomTypes: number;
  hasGlassIgloo: boolean;
  hasAuroraCabin: boolean;
  hasPrivateSauna: boolean;
  hasHotTub: boolean;
}

export default function AccommodationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState<Accommodation[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [maxKpFilter, setMaxKpFilter] = useState<number>(9);
  const [featureFilters, setFeatureFilters] = useState<{
    glassIgloo: boolean;
    auroraCabin: boolean;
    privateSauna: boolean;
    hotTub: boolean;
  }>({
    glassIgloo: false,
    auroraCabin: false,
    privateSauna: false,
    hotTub: false,
  });

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"quality" | "kp" | "name" | "country">("quality");

  useEffect(() => {
    if (status === "loading") return;

    // Only redirect to onboarding if user is authenticated but hasn't completed it
    if (session?.user && !session.user.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchAccommodations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [accommodations, selectedCountry, maxKpFilter, featureFilters, sortBy]);

  const fetchAccommodations = async () => {
    try {
      const response = await fetch("/api/accommodations");
      const data = await response.json();
      setAccommodations(data.accommodations);
      setCountries(data.countries);
      setFilteredAccommodations(data.accommodations);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching accommodations:", error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...accommodations];

    // Country filter
    if (selectedCountry !== "all") {
      filtered = filtered.filter((a) => a.country === selectedCountry);
    }

    // Max Kp filter (show locations that need Kp <= maxKpFilter)
    filtered = filtered.filter((a) => a.minKpRequired <= maxKpFilter);

    // Feature filters
    if (featureFilters.glassIgloo) {
      filtered = filtered.filter((a) => a.hasGlassIgloo);
    }
    if (featureFilters.auroraCabin) {
      filtered = filtered.filter((a) => a.hasAuroraCabin);
    }
    if (featureFilters.privateSauna) {
      filtered = filtered.filter((a) => a.hasPrivateSauna);
    }
    if (featureFilters.hotTub) {
      filtered = filtered.filter((a) => a.hasHotTub);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "quality":
          const qualityOrder = { "Excellent": 0, "Very Good": 1, "Good": 2, "Fair": 3, "Limited": 4 };
          return qualityOrder[a.auroraQuality] - qualityOrder[b.auroraQuality];
        case "kp":
          return a.minKpRequired - b.minKpRequired;
        case "name":
          return a.businessName.localeCompare(b.businessName);
        case "country":
          return a.country.localeCompare(b.country) || a.city.localeCompare(b.city);
        default:
          return 0;
      }
    });

    setFilteredAccommodations(filtered);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Excellent": return "text-green-400";
      case "Very Good": return "text-lime-400";
      case "Good": return "text-yellow-400";
      case "Fair": return "text-orange-400";
      case "Limited": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const getKpColor = (kp: number) => {
    if (kp <= 2) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (kp <= 4) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    if (kp <= 6) return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    return "bg-red-500/20 text-red-400 border-red-500/50";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-5xl">🏔️</span>
            <div>
              <h1 className="text-4xl font-bold text-white">Aurora Accommodations</h1>
              <p className="text-gray-400 mt-1">
                Find the perfect place to hunt the Northern Lights
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-500/30 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🎯</span>
            <span>Filters & Sorting</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Country Filter */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Kp Filter */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Maximum Kp Required: {maxKpFilter}
              </label>
              <input
                type="range"
                min="0"
                max="9"
                step="1"
                value={maxKpFilter}
                onChange={(e) => setMaxKpFilter(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Show locations visible with Kp {maxKpFilter} or less
              </p>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                <option value="quality">Aurora Quality</option>
                <option value="kp">Minimum Kp Required</option>
                <option value="name">Name</option>
                <option value="country">Country/City</option>
              </select>
            </div>
          </div>

          {/* Feature Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg cursor-pointer hover:bg-black/40 transition">
              <input
                type="checkbox"
                checked={featureFilters.glassIgloo}
                onChange={(e) =>
                  setFeatureFilters({ ...featureFilters, glassIgloo: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Glass Igloo/Dome</span>
            </label>

            <label className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg cursor-pointer hover:bg-black/40 transition">
              <input
                type="checkbox"
                checked={featureFilters.auroraCabin}
                onChange={(e) =>
                  setFeatureFilters({ ...featureFilters, auroraCabin: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Aurora Cabin</span>
            </label>

            <label className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg cursor-pointer hover:bg-black/40 transition">
              <input
                type="checkbox"
                checked={featureFilters.privateSauna}
                onChange={(e) =>
                  setFeatureFilters({ ...featureFilters, privateSauna: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Private Sauna</span>
            </label>

            <label className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg cursor-pointer hover:bg-black/40 transition">
              <input
                type="checkbox"
                checked={featureFilters.hotTub}
                onChange={(e) =>
                  setFeatureFilters({ ...featureFilters, hotTub: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Hot Tub/Jacuzzi</span>
            </label>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-300">
            Showing {filteredAccommodations.length} of {accommodations.length} accommodations
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "grid"
                ? "bg-aurora-green text-black font-semibold"
                : "bg-black/30 text-gray-300 hover:bg-black/40"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "list"
                ? "bg-aurora-green text-black font-semibold"
                : "bg-black/30 text-gray-300 hover:bg-black/40"
            }`}
          >
            List
          </button>
        </div>

        {/* Accommodations Grid/List */}
        {filteredAccommodations.length === 0 ? (
          <div className="bg-black/20 rounded-xl p-8 text-center">
            <p className="text-gray-400">No accommodations match your filters</p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {filteredAccommodations.map((accommodation) => (
              <div
                key={accommodation.id}
                className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-lg rounded-2xl border-2 border-indigo-500/30 overflow-hidden hover:border-aurora-green/50 transition-all cursor-pointer"
                onClick={() =>
                  accommodation.website
                    ? window.open(accommodation.website, "_blank")
                    : null
                }
              >
                {/* Header */}
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {accommodation.businessName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {accommodation.city}, {accommodation.country}
                      </p>
                    </div>
                    <span className="text-2xl">✨</span>
                  </div>

                  {/* Aurora Quality */}
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`text-lg font-bold ${getQualityColor(
                        accommodation.auroraQuality
                      )}`}
                    >
                      {accommodation.auroraQuality}
                    </span>
                    <span className="text-xs text-gray-400">aurora quality</span>
                  </div>
                </div>

                {/* Aurora Metrics */}
                <div className="p-5 border-b border-white/10 bg-black/20">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {/* Min Kp */}
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold px-3 py-1 rounded-lg border ${getKpColor(
                          accommodation.minKpRequired
                        )}`}
                      >
                        Kp {accommodation.minKpRequired}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">minimum required</p>
                    </div>

                    {/* Estimated Sighting % */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {accommodation.estimatedSightingPercentage}%
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        estimated (theory)
                      </p>
                    </div>
                  </div>

                  {/* Actual Success Rate */}
                  {accommodation.hasSightingData ? (
                    <div className="bg-aurora-green/10 border border-aurora-green/30 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-300">Actual Success Rate:</span>
                          <span className="text-xl font-bold text-aurora-green">
                            {accommodation.actualSuccessRate}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">
                            {accommodation.daysWithSightings} days
                          </span>
                          <span className="text-xs text-gray-500 block">past year</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Based on real sighting posts by users
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-2 mb-3">
                      <p className="text-xs text-gray-400 text-center">
                        No user sighting data yet for this location
                      </p>
                    </div>
                  )}

                  {/* Geomagnetic Latitude */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400">
                      Geomagnetic Latitude: <span className="text-white font-semibold">{accommodation.geomagneticLat}°</span>
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="p-5 border-b border-white/10">
                  <div className="flex flex-wrap gap-2">
                    {accommodation.hasGlassIgloo && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                        Glass Igloo
                      </span>
                    )}
                    {accommodation.hasAuroraCabin && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                        Aurora Cabin
                      </span>
                    )}
                    {accommodation.hasPrivateSauna && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                        Private Sauna
                      </span>
                    )}
                    {accommodation.hasHotTub && (
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
                        Hot Tub
                      </span>
                    )}
                  </div>
                </div>

                {/* Room Types */}
                <div className="p-5">
                  <p className="text-sm text-gray-300 mb-2 font-semibold">
                    {accommodation.totalRoomTypes} Room Type{accommodation.totalRoomTypes !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {accommodation.roomTypes.slice(0, 3).map((room) => (
                      <div key={room.id} className="text-xs text-gray-400">
                        <span className="text-white font-medium">{room.name}</span>
                        {room.capacity && (
                          <span className="ml-2">• {room.capacity} guests</span>
                        )}
                        {room.priceFrom && (
                          <span className="ml-2">
                            • from {room.currency} {room.priceFrom}
                          </span>
                        )}
                      </div>
                    ))}
                    {accommodation.totalRoomTypes > 3 && (
                      <p className="text-xs text-gray-500">
                        +{accommodation.totalRoomTypes - 3} more...
                      </p>
                    )}
                  </div>
                </div>

                {/* Action */}
                {accommodation.website && (
                  <div className="p-5 bg-black/20">
                    <button className="w-full bg-aurora-green text-black font-semibold py-2 rounded-lg hover:bg-aurora-green/90 transition">
                      View Details →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
