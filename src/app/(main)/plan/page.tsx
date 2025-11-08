"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LocationAutocomplete from "@/components/forms/LocationAutocomplete";

interface Hunt {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string;
  participants: number;
  capacity: number | null;
  isPaid: boolean;
  price: number | null;
  user: {
    name: string;
    image: string;
  };
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function PlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "ongoing" | "past">("all");
  const [hunterNameFilter, setHunterNameFilter] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [huntTypeFilter, setHuntTypeFilter] = useState<"all" | "free" | "paid">("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "full">("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverImage: null as File | null,
    startDate: "",
    endDate: "",
    timezone: "UTC",
    location: "",
    latitude: "",
    longitude: "",
    hideLocation: false,
    isPrivate: false,
    isPublic: true,
    isPaid: false,
    price: "",
    capacity: "",
  });
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  // Check if we should show create form based on URL parameter
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreateForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    // Fetch upcoming hunts
    fetch("/api/hunts/upcoming")
      .then((res) => res.json())
      .then((data) => setHunts(Array.isArray(data) ? data : []))
      .catch(() => setHunts([]));
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

  // Haversine distance calculation
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

  // Comprehensive filtering and sorting
  const filteredHunts = hunts
    .filter((hunt) => {
      const now = new Date();
      const huntStartDate = new Date(hunt.startDate);
      const huntEndDate = new Date(hunt.endDate);
      const isOngoing = now >= huntStartDate && now <= huntEndDate;
      const isUpcoming = now < huntStartDate;
      const isPast = now > huntEndDate;

      // Time filter (all/upcoming/ongoing/past)
      const matchesTimeFilter =
        timeFilter === "all" ||
        (timeFilter === "upcoming" && isUpcoming) ||
        (timeFilter === "ongoing" && isOngoing) ||
        (timeFilter === "past" && isPast);

      // Hunter name filter
      const matchesHunter =
        !hunterNameFilter ||
        hunt.user.name.toLowerCase().includes(hunterNameFilter.toLowerCase());

      // Date range filter
      const matchesStartDate =
        !startDateFilter || huntStartDate >= new Date(startDateFilter);
      const matchesEndDate =
        !endDateFilter || huntStartDate <= new Date(endDateFilter);

      // Hunt type filter (free/paid)
      const matchesType =
        huntTypeFilter === "all" ||
        (huntTypeFilter === "free" && !hunt.isPaid) ||
        (huntTypeFilter === "paid" && hunt.isPaid);

      // Availability filter
      const isFull = hunt.capacity !== null && hunt.participants >= hunt.capacity;
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && !isFull) ||
        (availabilityFilter === "full" && isFull);

      return (
        matchesTimeFilter &&
        matchesHunter &&
        matchesStartDate &&
        matchesEndDate &&
        matchesType &&
        matchesAvailability
      );
    })
    .map((hunt) => {
      // Calculate distance if location is selected
      if (selectedLocation && hunt.latitude && hunt.longitude) {
        const distance = calculateDistance(
          selectedLocation.lat,
          selectedLocation.lng,
          hunt.latitude,
          hunt.longitude
        );
        return { ...hunt, distance };
      }
      return { ...hunt, distance: undefined };
    })
    .filter((hunt) => {
      // Filter out hunts more than 400km away when location is selected
      if (selectedLocation && hunt.distance !== undefined) {
        return hunt.distance <= 400;
      }
      return true;
    })
    .sort((a, b) => {
      const aIsFull = a.capacity !== null && a.participants >= a.capacity;
      const bIsFull = b.capacity !== null && b.participants >= b.capacity;

      // Sort by availability first (available hunts on top)
      if (aIsFull !== bIsFull) {
        return aIsFull ? 1 : -1;
      }

      // If location is selected, sort by distance
      if (selectedLocation && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }

      // Otherwise sort by date (upcoming hunts first)
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = new FormData();

    // Append all form fields
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);
    submitData.append("startDate", formData.startDate);
    submitData.append("endDate", formData.endDate);
    submitData.append("timezone", formData.timezone);
    submitData.append("location", formData.location);
    submitData.append("latitude", formData.latitude);
    submitData.append("longitude", formData.longitude);
    submitData.append("hideLocation", formData.hideLocation.toString());
    submitData.append("isPrivate", formData.isPrivate.toString());
    submitData.append("isPublic", formData.isPublic.toString());
    submitData.append("isPaid", formData.isPaid.toString());

    if (formData.isPaid && formData.price) {
      submitData.append("price", formData.price);
    }

    if (formData.capacity) {
      submitData.append("capacity", formData.capacity);
    }

    // Append cover image if present
    if (formData.coverImage) {
      submitData.append("coverImage", formData.coverImage);
    }

    const response = await fetch("/api/hunts/create", {
      method: "POST",
      body: submitData,
    });

    if (response.ok) {
      router.push("/plan");
    }
  };

  if (!showCreateForm) {
    return (
      <div className="min-h-screen bg-[#0a0e17] p-4">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-2xl font-bold mb-6">Plan Your Hunt</h1>

          <div className="space-y-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-gradient-to-r from-aurora-green to-aurora-blue text-black font-semibold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              Create New Hunt
            </button>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold mb-2">Search Hunts</h2>
                  <p className="text-sm text-gray-400">
                    Find and join aurora hunting events near you
                  </p>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    showFilters || hunterNameFilter || selectedLocation || startDateFilter || endDateFilter || huntTypeFilter !== "all" || availabilityFilter !== "all" || timeFilter !== "all"
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
                  <span>Filters</span>
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                  {/* Hunter Name Filter */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Hunter Name
                    </label>
                    <input
                      type="text"
                      value={hunterNameFilter}
                      onChange={(e) => setHunterNameFilter(e.target.value)}
                      placeholder="Search by organizer name..."
                      className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                    />
                  </div>

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
                        Showing hunts within 400km radius • Sorted by distance
                      </p>
                    )}
                  </div>

                  {/* Date Range Filter */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Start Date (From)
                      </label>
                      <input
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                        className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        End Date (To)
                      </label>
                      <input
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                        className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green"
                      />
                    </div>
                  </div>

                  {/* Hunt Type Filter */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Hunt Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setHuntTypeFilter("all")}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          huntTypeFilter === "all"
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setHuntTypeFilter("free")}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          huntTypeFilter === "free"
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Free
                      </button>
                      <button
                        onClick={() => setHuntTypeFilter("paid")}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          huntTypeFilter === "paid"
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Paid
                      </button>
                    </div>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Availability
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setAvailabilityFilter("all")}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          availabilityFilter === "all"
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setAvailabilityFilter("available")}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          availabilityFilter === "available"
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Available
                      </button>
                      <button
                        onClick={() => setAvailabilityFilter("full")}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          availabilityFilter === "full"
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Full
                      </button>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(hunterNameFilter || selectedLocation || startDateFilter || endDateFilter || huntTypeFilter !== "all" || availabilityFilter !== "all" || timeFilter !== "all") && (
                    <button
                      onClick={() => {
                        setTimeFilter("all");
                        setHunterNameFilter("");
                        setSelectedLocation(null);
                        setLocationSearch("");
                        setStartDateFilter("");
                        setEndDateFilter("");
                        setHuntTypeFilter("all");
                        setAvailabilityFilter("all");
                      }}
                      className="w-full bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Time Filter Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setTimeFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeFilter === "all"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTimeFilter("upcoming")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeFilter === "upcoming"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setTimeFilter("ongoing")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeFilter === "ongoing"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Ongoing
              </button>
              <button
                onClick={() => setTimeFilter("past")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeFilter === "past"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Past Hunts
              </button>
            </div>

            {/* Hunts List */}
            <div className="space-y-3">
              {filteredHunts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No upcoming hunts. Create the first one!
                </div>
              ) : (
                filteredHunts.map((hunt) => {
                  const isFull = hunt.capacity !== null && hunt.participants >= hunt.capacity;
                  const now = new Date();
                  const startDate = new Date(hunt.startDate);
                  const endDate = new Date(hunt.endDate);
                  const isOngoing = now >= startDate && now <= endDate;

                  return <div
                    key={hunt.id}
                    onClick={() => router.push(`/hunts/${hunt.id}`)}
                    className={`bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-colors cursor-pointer ${
                      isFull ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Cover Image */}
                      {hunt.coverImage && (
                        <div className="w-32 h-32 flex-shrink-0">
                          <img
                            src={hunt.coverImage}
                            alt={hunt.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{hunt.name}</h3>
                          {isOngoing && (
                            <span className="bg-green-500/90 text-white px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm">
                              ONGOING
                            </span>
                          )}
                          {isFull && (
                            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                              FULL
                            </span>
                          )}
                          {!hunt.isPaid && (
                            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                              FREE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          {hunt.description || "No description"}
                        </p>
                        {hunt.distance !== undefined && (
                          <p className="text-xs text-aurora-green">
                            📍 {hunt.distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                      {hunt.isPaid && hunt.price && (
                        <div className="bg-aurora-green/20 text-aurora-green px-3 py-1 rounded-full text-xs font-semibold">
                          ${hunt.price.toFixed(2)}/pax
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{hunt.location || "Location TBD"}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(hunt.startDate).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>
                          {hunt.participants} {hunt.capacity ? `/ ${hunt.capacity}` : ""}
                        </span>
                      </div>
                    </div>

                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                          <img
                            src={hunt.user.image || "/default-avatar.png"}
                            alt={hunt.user.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-400">by {hunt.user.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] p-4">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/hunts")}
            className="text-aurora-blue"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Create Hunt</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Hunt Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
              placeholder="e.g., Northern Lights Adventure 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white h-24"
              placeholder="Describe your hunt..."
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Cover Image (Square)</label>
            <p className="text-xs text-gray-400 mb-3">
              Upload a square cover image for your hunt event
            </p>
            {coverImagePreview ? (
              <div className="relative w-48 h-48 mx-auto">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImagePreview(null);
                    setFormData({ ...formData, coverImage: null });
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-aurora-green transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, coverImage: file });
                      setCoverImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-300">Click to upload cover image</p>
                <p className="text-sm text-gray-500 mt-1">Recommended: Square image (1:1 ratio)</p>
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Date & Time</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
                  placeholder="Start"
                />
                <p className="text-xs text-gray-400 mt-1">Start</p>
              </div>
              <div>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
                  placeholder="End"
                />
                <p className="text-xs text-gray-400 mt-1">End</p>
              </div>
              <div>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
                >
                  <option value="UTC">UTC (GMT+0)</option>
                  <option value="GMT-12">GMT-12</option>
                  <option value="GMT-11">GMT-11</option>
                  <option value="GMT-10">GMT-10</option>
                  <option value="GMT-9">GMT-9</option>
                  <option value="GMT-8">GMT-8</option>
                  <option value="GMT-7">GMT-7</option>
                  <option value="GMT-6">GMT-6</option>
                  <option value="GMT-5">GMT-5</option>
                  <option value="GMT-4">GMT-4</option>
                  <option value="GMT-3">GMT-3</option>
                  <option value="GMT-2">GMT-2</option>
                  <option value="GMT-1">GMT-1</option>
                  <option value="GMT+1">GMT+1</option>
                  <option value="GMT+2">GMT+2</option>
                  <option value="GMT+3">GMT+3</option>
                  <option value="GMT+4">GMT+4</option>
                  <option value="GMT+5">GMT+5</option>
                  <option value="GMT+6">GMT+6</option>
                  <option value="GMT+7">GMT+7</option>
                  <option value="GMT+8">GMT+8</option>
                  <option value="GMT+9">GMT+9</option>
                  <option value="GMT+10">GMT+10</option>
                  <option value="GMT+11">GMT+11</option>
                  <option value="GMT+12">GMT+12</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Timezone</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Meeting Point</label>
            <LocationAutocomplete
              value={formData.location}
              onChange={(loc, lat, lng) => {
                setFormData({
                  ...formData,
                  location: loc,
                  latitude: lat || formData.latitude,
                  longitude: lng || formData.longitude,
                });
              }}
              placeholder="Search for a meeting point..."
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white mb-2"
              required={true}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="bg-white/10 rounded-lg px-4 py-2 text-white text-sm"
                placeholder="Latitude"
              />
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="bg-white/10 rounded-lg px-4 py-2 text-white text-sm"
                placeholder="Longitude"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => {
                const isPrivate = e.target.checked;
                setFormData({
                  ...formData,
                  isPrivate,
                  isPublic: !isPrivate
                });
              }}
              className="w-4 h-4"
            />
            <label htmlFor="isPrivate" className="text-sm">
              Private (by invitations only)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => {
                const isPublic = e.target.checked;
                setFormData({
                  ...formData,
                  isPublic,
                  isPrivate: !isPublic
                });
              }}
              className="w-4 h-4"
            />
            <label htmlFor="isPublic" className="text-sm">
              Public (allow anyone to join)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPaid"
              checked={formData.isPaid}
              onChange={(e) => {
                const isPaid = e.target.checked;
                setFormData({
                  ...formData,
                  isPaid,
                  hideLocation: isPaid ? formData.hideLocation : false
                });
              }}
              className="w-4 h-4"
            />
            <label htmlFor="isPaid" className="text-sm">
              Paid event
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hideLocation"
              checked={formData.hideLocation}
              onChange={(e) => setFormData({ ...formData, hideLocation: e.target.checked })}
              disabled={!formData.isPaid}
              className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="hideLocation" className={`text-sm ${!formData.isPaid ? 'text-gray-500' : ''}`}>
              Hide exact location (only show on map to participants)
            </label>
          </div>

          {formData.isPaid && (
            <div>
              <label className="block text-sm font-medium mb-2">Price per pax ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Capacity (optional)</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
              placeholder="Maximum participants"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-aurora-green to-aurora-blue text-black font-semibold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Create Hunt
          </button>
        </form>
      </div>
    </div>
  );
}
