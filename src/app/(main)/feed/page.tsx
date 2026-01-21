"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow, format } from "date-fns";
import TimeHeader from "@/components/TimeHeader";
import { formatLocationWithFlag, formatSightingLocation } from "@/utils/location";

interface Sighting {
  id: string;
  caption: string;
  location: string;
  images: string[];
  videos: string[];
  sightingType?: string;
  sightingDate?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string;
    username?: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    image: string;
  };
}

interface AuroraCamera {
  id: string;
  name: string;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  updateFrequency: string;
  provider: string;
  timezone: string;
  useProxy?: boolean;
}

// Curated list of aurora cameras
const AURORA_CAMERAS: AuroraCamera[] = [
  {
    id: "yellowknife-canada",
    name: "Yellowknife Aurora Cam",
    location: "Yellowknife, Northwest Territories",
    country: "Canada",
    latitude: 62.4540,
    longitude: -114.3718,
    imageUrl: "https://auroramax.com/images/latest-images/latest_1024_n.jpg",
    updateFrequency: "Every 6 seconds",
    provider: "AuroraMAX",
    timezone: "MST",
    useProxy: false
  },
  {
    id: "poker-flat-alaska",
    name: "Poker Flat All-Sky Camera",
    location: "Fairbanks, Alaska",
    country: "USA",
    latitude: 65.1264,
    longitude: -147.4769,
    imageUrl: "https://www.gi.alaska.edu/monitors/poker-flat/images/DASC_PSFC_20120101_000000_0000_all.jpg",
    updateFrequency: "Every minute",
    provider: "University of Alaska Geophysical Institute",
    timezone: "AKST",
    useProxy: false
  },
  {
    id: "skibotn-norway",
    name: "Skibotn Aurora Observatory",
    location: "Skibotn, Troms",
    country: "Norway",
    latitude: 69.3486,
    longitude: 20.3639,
    imageUrl: "https://site.uit.no/spaceweather/files/2024/01/current.jpg",
    updateFrequency: "Every 10 minutes",
    provider: "UiT The Arctic University of Norway",
    timezone: "CET",
    useProxy: false
  },
  {
    id: "abisko-sweden",
    name: "Abisko Aurora Sky Station",
    location: "Abisko, Lapland",
    country: "Sweden",
    latitude: 68.35,
    longitude: 18.83,
    imageUrl: "https://www.aurora-service.eu/aurora-school/webcam_03.jpg",
    updateFrequency: "Every 5 minutes",
    provider: "Lights Over Lapland",
    timezone: "CET",
    useProxy: false
  },
  {
    id: "churchill-canada",
    name: "Churchill Aurora Cam",
    location: "Churchill, Manitoba",
    country: "Canada",
    latitude: 58.7684,
    longitude: -94.1648,
    imageUrl: "https://explore.org/cams/player/northern-lights-cam/asset/66f0e3b2d0c95503db90f8e7",
    updateFrequency: "Live stream",
    provider: "Explore.org",
    timezone: "CST",
    useProxy: false
  },
  {
    id: "sodankyla-finland",
    name: "Sodankylä All-Sky Camera",
    location: "Sodankylä, Lapland",
    country: "Finland",
    latitude: 67.3671,
    longitude: 26.6290,
    imageUrl: "https://www.sgo.fi/pub/Asky_cameras/Sodankyla/latest.jpg",
    updateFrequency: "Every minute",
    provider: "Sodankylä Geophysical Observatory",
    timezone: "EET",
    useProxy: false
  },
  {
    id: "kiruna-sweden",
    name: "Kiruna All-Sky Camera",
    location: "Kiruna, Lapland",
    country: "Sweden",
    latitude: 67.8558,
    longitude: 20.2253,
    imageUrl: "https://www2.irf.se/Observatory/All-sky/Kiruna/movie/latest.jpg",
    updateFrequency: "Every minute",
    provider: "Swedish Institute of Space Physics",
    timezone: "CET",
    useProxy: false
  },
  {
    id: "longyearbyen-svalbard",
    name: "Longyearbyen Aurora Station",
    location: "Longyearbyen, Svalbard",
    country: "Norway",
    latitude: 78.2232,
    longitude: 15.6267,
    imageUrl: "https://kho.unis.no/Quicklooks/RecentData/allsky/latest.jpg",
    updateFrequency: "Every 2 minutes",
    provider: "UNIS Kjell Henriksen Observatory",
    timezone: "CET",
    useProxy: false
  },
  {
    id: "tromso-norway",
    name: "Tromsø All-Sky Camera",
    location: "Tromsø, Troms",
    country: "Norway",
    latitude: 69.6492,
    longitude: 18.9553,
    imageUrl: "https://site.uit.no/spaceweather/files/2024/01/current_tromso.jpg",
    updateFrequency: "Every 10 minutes",
    provider: "UiT Space Physics",
    timezone: "CET",
    useProxy: false
  }
];

type TabType = "gallery" | "live-feed" | "cameras";

export default function FeedPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("live-feed");
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSighting, setSelectedSighting] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<{ [key: string]: Date }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFeedView, setShowFeedView] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [editCaptionText, setEditCaptionText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Gallery search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number; name: string} | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "earliest">("latest");
  const [filterOptions, setFilterOptions] = useState<{countries: string[]; years: number[]; months: {value: string; label: string}[]}>({countries: [], years: [], months: []});
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch filter options on mount
  useEffect(() => {
    fetch("/api/sightings/filters")
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
      .catch((error) => console.error("Error fetching filter options:", error));
  }, []);

  // Fetch sightings (default feed or search results)
  useEffect(() => {
    if (activeTab !== "gallery") {
      // Load default feed for live-feed tab
      setLoading(true);
      fetch("/api/sightings/feed")
        .then((res) => res.json())
        .then((data) => {
          console.log("Fetched sightings:", data);
          // Check if data is an array before setting state
          if (Array.isArray(data)) {
            setSightings(data);
          } else {
            console.error("API returned non-array data:", data);
            setSightings([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching sightings:", error);
          setSightings([]);
          setLoading(false);
        });
    }
  }, [activeTab]);

  // Search function for gallery
  const handleSearch = async () => {
    setLoading(true);
    setIsSearching(true);

    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.append("user", searchQuery.trim());
    }

    if (selectedLocation) {
      params.append("lat", selectedLocation.lat.toString());
      params.append("lng", selectedLocation.lng.toString());
    } else if (locationSearch.trim()) {
      params.append("location", locationSearch.trim());
    }

    if (monthFilter) {
      params.append("month", monthFilter);
    }

    if (yearFilter) {
      params.append("year", yearFilter);
    }

    if (countryFilter) {
      params.append("country", countryFilter);
    }

    params.append("sort", sortOrder);

    try {
      const res = await fetch(`/api/sightings/search?${params.toString()}`);
      const data = await res.json();
      // Check if data is an array before setting state
      if (Array.isArray(data)) {
        setSightings(data);
      } else {
        console.error("API returned non-array data:", data);
        setSightings([]);
      }
    } catch (error) {
      console.error("Error searching sightings:", error);
      setSightings([]);
    } finally {
      setLoading(false);
    }
  };

  // Load default gallery on tab switch
  useEffect(() => {
    if (activeTab === "gallery" && !isSearching) {
      handleSearch();
    }
  }, [activeTab]);

  // Debounced location autocomplete
  useEffect(() => {
    if (locationSearch.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sightings/locations?query=${encodeURIComponent(locationSearch)}`);
        const data = await res.json();
        setLocationSuggestions(data);
        setShowLocationSuggestions(true);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearch]);

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setLocationSearch("");
    setSelectedLocation(null);
    setMonthFilter("");
    setYearFilter("");
    setCountryFilter("");
    setSortOrder("latest");
    setIsSearching(false);
    handleSearch();
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh camera images every 60 seconds
  useEffect(() => {
    if (activeTab === "cameras") {
      const refreshTimer = setInterval(() => {
        setRefreshKey(prev => prev + 1);
        setImageErrors({});
      }, 60000);

      return () => clearInterval(refreshTimer);
    }
  }, [activeTab]);

  const handleLike = async (sightingId: string) => {
    await fetch("/api/sightings/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sightingId }),
    });

    setSightings(
      sightings.map((s) =>
        s.id === sightingId
          ? {
              ...s,
              isLiked: !s.isLiked,
              _count: {
                ...s._count,
                likes: s.isLiked ? s._count.likes - 1 : s._count.likes + 1,
              },
            }
          : s
      )
    );
  };

  const loadComments = async (sightingId: string) => {
    if (!comments[sightingId]) {
      const res = await fetch(`/api/sightings/${sightingId}/comments`);
      const data = await res.json();
      setComments({ ...comments, [sightingId]: data });
    }
    setSelectedSighting(selectedSighting === sightingId ? null : sightingId);
  };

  const handleComment = async (sightingId: string) => {
    if (!newComment.trim()) return;

    await fetch(`/api/sightings/${sightingId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });

    setNewComment("");
    // Reload comments
    const res = await fetch(`/api/sightings/${sightingId}/comments`);
    const data = await res.json();
    setComments({ ...comments, [sightingId]: data });
  };

  const handleImageLoad = (cameraId: string) => {
    setLastUpdated(prev => ({
      ...prev,
      [cameraId]: new Date()
    }));
    setImageErrors(prev => ({
      ...prev,
      [cameraId]: false
    }));
  };

  const handleImageError = (cameraId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [cameraId]: true
    }));
  };

  const getImageUrl = (camera: AuroraCamera) => {
    const timestamp = Date.now();
    return `/api/camera-proxy?url=${encodeURIComponent(camera.imageUrl)}&t=${timestamp}&refresh=${refreshKey}`;
  };

  const handleEditSighting = (sighting: Sighting) => {
    setEditingCaption(sighting.id);
    setEditCaptionText(sighting.caption || "");
    setShowMenu(null);
  };

  const handleSaveEdit = async (sightingId: string) => {
    try {
      const res = await fetch(`/api/sightings/${sightingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaptionText }),
      });

      if (res.ok) {
        const updatedSighting = await res.json();
        setSightings(sightings.map(s => s.id === sightingId ? { ...s, caption: updatedSighting.caption } : s));
        setEditingCaption(null);
        setEditCaptionText("");
      }
    } catch (error) {
      console.error("Error updating sighting:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCaption(null);
    setEditCaptionText("");
  };

  const handleDeleteSighting = async (sightingId: string) => {
    try {
      const res = await fetch(`/api/sightings/${sightingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSightings(sightings.filter(s => s.id !== sightingId));
        setShowDeleteConfirm(null);
        setShowMenu(null);
      }
    } catch (error) {
      console.error("Error deleting sighting:", error);
    }
  };

  // Loading animation
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] pb-24">
        <TimeHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="flex flex-col items-center gap-6">
            {/* Aurora Shimmer Animation */}
            <div className="relative w-40 h-40">
              {/* Outer ring - Green */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 border-r-green-500 animate-spin" style={{ animationDuration: '2.5s' }}></div>
              {/* Middle ring - Blue */}
              <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-blue-400 border-r-blue-500 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
              {/* Inner ring - Purple */}
              <div className="absolute inset-6 rounded-full border-4 border-transparent border-t-purple-400 border-r-purple-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
              {/* Center glow with camera icon */}
              <div className="absolute inset-9 rounded-full bg-gradient-to-br from-green-400/20 via-blue-400/20 to-purple-400/20 animate-pulse flex items-center justify-center">
                <svg className="w-12 h-12 text-green-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            {/* Text with gradient */}
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Loading Sightings
              </div>
              <div className="text-sm text-gray-400 animate-pulse" style={{ animationDelay: '0.3s' }}>
                Gathering aurora moments from around the world...
              </div>
            </div>

            {/* Dancing aurora particles */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0s', animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.45s', animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-green-300 animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      {/* Tab Navigation - Outside of max-width container for proper sticky behavior */}
      <div className="sticky top-[45px] bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-40">
        <div className={activeTab === "cameras" ? "max-w-7xl mx-auto" : "max-w-2xl mx-auto"}>
          <div className="p-4">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("gallery")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "gallery"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setActiveTab("live-feed")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "live-feed"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Live Feed
              </button>
              <button
                onClick={() => setActiveTab("cameras")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "cameras"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Live Cameras
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={activeTab === "cameras" ? "max-w-7xl mx-auto" : "max-w-2xl mx-auto"}>

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <div className="p-4">
            {/* Search Section */}
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-white font-semibold mb-2">Search Gallery</h2>
                  <p className="text-sm text-gray-400">
                    Find aurora sightings from around the world
                  </p>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    showFilters || searchQuery || locationSearch || monthFilter || yearFilter || countryFilter || sortOrder !== "latest"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filters</span>
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                  {/* User Search */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      User Name or Handle
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by user name or @handle..."
                      className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                    />
                    <p className="mt-2 text-xs text-gray-400">
                      💡 Use <span className="text-aurora-green font-mono">and</span>, <span className="text-aurora-green font-mono">or</span>, <span className="text-aurora-green font-mono">not</span> for advanced search
                    </p>
                  </div>

                  {/* Location Search with Autocomplete */}
                  <div className="relative">
                    <label className="block text-white text-sm font-medium mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={selectedLocation ? selectedLocation.name : locationSearch}
                      onChange={(e) => {
                        setLocationSearch(e.target.value);
                        setSelectedLocation(null);
                      }}
                      placeholder="Search by location (e.g., Tromsø, Norway)..."
                      className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                    />
                    {/* Autocomplete Dropdown */}
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1f2e] rounded-lg shadow-lg border border-white/10 z-10 max-h-60 overflow-y-auto">
                        {locationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => {
                              setSelectedLocation({
                                lat: suggestion.coordinates[1],
                                lng: suggestion.coordinates[0],
                                name: suggestion.name,
                              });
                              setLocationSearch(suggestion.name);
                              setShowLocationSuggestions(false);
                              handleSearch();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                          >
                            {suggestion.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      💡 Type a location to see matching places nearby
                    </p>
                  </div>

                  {/* Date Filters */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      When
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Month Filter */}
                      <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-aurora-green"
                      >
                        <option value="">All Months</option>
                        {filterOptions.months.map((month) => (
                          <option key={month.value} value={month.value} className="bg-[#1a1f2e]">
                            {month.label}
                          </option>
                        ))}
                      </select>

                      {/* Year Filter */}
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-aurora-green"
                      >
                        <option value="">All Years</option>
                        {filterOptions.years.map((year) => (
                          <option key={year} value={year.toString()} className="bg-[#1a1f2e]">
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Country Filter */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Country
                    </label>
                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="w-full bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-aurora-green"
                    >
                      <option value="">All Countries</option>
                      {filterOptions.countries.map((country) => (
                        <option key={country} value={country} className="bg-[#1a1f2e]">
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Sort By
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSortOrder("latest")}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          sortOrder === "latest"
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Latest First
                      </button>
                      <button
                        onClick={() => setSortOrder("earliest")}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          sortOrder === "earliest"
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Earliest First
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSearch}
                      className="flex-1 bg-aurora-green text-black font-semibold py-2 rounded-lg hover:bg-aurora-green/80 transition-colors"
                    >
                      Search
                    </button>
                  </div>

                  {/* Clear All Filters */}
                  {(searchQuery || locationSearch || monthFilter || yearFilter || countryFilter || sortOrder !== "latest") && (
                    <button
                      onClick={handleClearSearch}
                      className="w-full bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1">
              {sightings
                .filter((sighting) => sighting.images && sighting.images.length > 0)
                .flatMap((sighting) =>
                  sighting.images.map((image, imgIndex) => ({
                    image,
                    sighting,
                    imgIndex
                  }))
                ).map((item, index) => (
                <div
                  key={`${item.sighting.id}-${item.imgIndex}`}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setShowFeedView(true);
                  }}
                  className="relative aspect-square cursor-pointer overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img
                    src={item.image}
                    alt={item.sighting.caption || "Aurora sighting"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed View Modal */}
        {showFeedView && activeTab === "gallery" && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setShowFeedView(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation buttons */}
            {selectedImageIndex > 0 && (
              <button
                onClick={() => setSelectedImageIndex(prev => prev - 1)}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {selectedImageIndex < sightings.filter(s => s.images && s.images.length > 0).flatMap(s => s.images).length - 1 && (
              <button
                onClick={() => setSelectedImageIndex(prev => prev + 1)}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Content */}
            <div className="max-w-6xl w-full h-full flex items-center justify-center p-4">
              {(() => {
                const allImages = sightings
                  .filter((sighting) => sighting.images && sighting.images.length > 0)
                  .flatMap((sighting) =>
                    sighting.images.map((image, imgIndex) => ({
                      image,
                      sighting,
                      imgIndex
                    }))
                  );
                const currentItem = allImages[selectedImageIndex];
                if (!currentItem) return null;

                return (
                  <div className="w-full max-h-full flex flex-col md:flex-row gap-0 bg-black overflow-hidden">
                    {/* Image */}
                    <div className="flex-1 relative flex items-center justify-center bg-black">
                      <img
                        src={currentItem.image}
                        alt={currentItem.sighting.caption || "Aurora sighting"}
                        className="max-h-[80vh] max-w-full object-contain"
                      />
                    </div>

                    {/* Sidebar with details */}
                    <div className="w-full md:w-96 bg-[#0a0e17] flex flex-col max-h-[80vh]">
                      {/* User Info */}
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <img
                            src={currentItem.sighting.user.image || "/default-avatar.png"}
                            alt={currentItem.sighting.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-white">
                              {currentItem.sighting.user.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(currentItem.sighting.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                          {/* Menu button - only show for user's own posts */}
                          {session?.user?.id === currentItem.sighting.user.id && (
                            <div className="relative">
                              <button
                                onClick={() => setShowMenu(showMenu === currentItem.sighting.id ? null : currentItem.sighting.id)}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                </svg>
                              </button>
                              {/* Dropdown menu */}
                              {showMenu === currentItem.sighting.id && (
                                <div className="absolute right-0 mt-2 w-32 bg-[#1a1f2e] rounded-lg shadow-lg border border-white/10 z-10">
                                  <button
                                    onClick={() => handleEditSighting(currentItem.sighting)}
                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded-t-lg transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowDeleteConfirm(currentItem.sighting.id);
                                      setShowMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 rounded-b-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Caption and Location */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {editingCaption === currentItem.sighting.id ? (
                          <div className="mb-3">
                            <textarea
                              value={editCaptionText}
                              onChange={(e) => setEditCaptionText(e.target.value)}
                              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                              rows={3}
                              placeholder="Write a caption..."
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveEdit(currentItem.sighting.id)}
                                className="px-4 py-1.5 bg-aurora-green text-black rounded-lg text-sm font-semibold hover:bg-aurora-green/80 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-1.5 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {currentItem.sighting.caption ? (
                              <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">
                                {currentItem.sighting.caption}
                              </p>
                            ) : (
                              <p className="text-gray-500 text-sm italic mb-3">No caption</p>
                            )}
                          </>
                        )}
                        {(currentItem.sighting.location || currentItem.sighting.sightingDate) && (
                          <p className="text-gray-400 text-sm">
                            {currentItem.sighting.location && currentItem.sighting.sightingDate ? (
                              `${formatSightingLocation(currentItem.sighting.location)} on ${format(new Date(currentItem.sighting.sightingDate), "dd MMM yyyy")}`
                            ) : currentItem.sighting.location ? (
                              formatSightingLocation(currentItem.sighting.location)
                            ) : currentItem.sighting.sightingDate ? (
                              `on ${format(new Date(currentItem.sighting.sightingDate), "dd MMM yyyy")}`
                            ) : null}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-6 h-6"
                              fill={currentItem.sighting.isLiked ? "currentColor" : "none"}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            <span className="text-white">{currentItem.sighting._count.likes}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            <span className="text-white">{currentItem.sighting._count.comments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Live Feed Tab */}
        {activeTab === "live-feed" && (
          <div className="divide-y divide-white/10">
            {sightings.map((sighting) => (
              <div key={sighting.id} className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-3">
                  <a href={`/users/${sighting.user.id}`}>
                    <img
                      src={sighting.user.image || "/default-avatar.png"}
                      alt={sighting.user.name}
                      className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
                    />
                  </a>
                  <div className="flex-1">
                    <a
                      href={`/users/${sighting.user.id}`}
                      className="font-semibold hover:text-gray-300 transition-colors"
                    >
                      {sighting.user.name}
                    </a>
                    <p className="text-xs text-gray-400">
                      Posted {formatDistanceToNow(new Date(sighting.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {/* Menu button - only show for user's own posts */}
                  {session?.user?.id === sighting.user.id && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(showMenu === sighting.id ? null : sighting.id)}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                      {/* Dropdown menu */}
                      {showMenu === sighting.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-[#1a1f2e] rounded-lg shadow-lg border border-white/10 z-10">
                          <button
                            onClick={() => handleEditSighting(sighting)}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded-t-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(sighting.id);
                              setShowMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 rounded-b-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Images */}
                {sighting.images.length > 0 && (
                  <div className="mb-3 -mx-4 flex justify-center bg-black">
                    <img
                      src={sighting.images[0]}
                      alt="Aurora sighting"
                      className="w-full object-contain"
                      style={{ maxHeight: '600px' }}
                    />
                  </div>
                )}

                {/* Sighting Location and Date */}
                {(sighting.location || sighting.sightingDate) && (
                  <div className="text-sm text-gray-400 mb-3 text-left">
                    {sighting.location && sighting.sightingDate ? (
                      <p>Sighted in {formatLocationWithFlag(sighting.location)} on {format(new Date(sighting.sightingDate), "dd MMM yyyy")}</p>
                    ) : sighting.location ? (
                      <p>Sighted in {formatLocationWithFlag(sighting.location)}</p>
                    ) : sighting.sightingDate ? (
                      <p>Sighted on {format(new Date(sighting.sightingDate), "dd MMM yyyy")}</p>
                    ) : null}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 mb-3">
                  <button
                    onClick={() => handleLike(sighting.id)}
                    className="flex items-center gap-2 hover:text-aurora-green transition-colors"
                  >
                    <svg
                      className={`w-6 h-6 ${
                        sighting.isLiked ? "fill-aurora-green" : "fill-none stroke-current"
                      }`}
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-sm">{sighting._count.likes}</span>
                  </button>

                  <button
                    onClick={() => loadComments(sighting.id)}
                    className="flex items-center gap-2 hover:text-aurora-blue transition-colors"
                  >
                    <svg
                      className="w-6 h-6 fill-none stroke-current"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-sm">{sighting._count.comments}</span>
                  </button>
                </div>

                {/* Caption */}
                {editingCaption === sighting.id ? (
                  <div className="mb-2">
                    <textarea
                      value={editCaptionText}
                      onChange={(e) => setEditCaptionText(e.target.value)}
                      className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                      rows={3}
                      placeholder="Write a caption..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSaveEdit(sighting.id)}
                        className="px-4 py-1.5 bg-aurora-green text-black rounded-lg text-sm font-semibold hover:bg-aurora-green/80 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-1.5 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  sighting.caption && (
                    <p className="text-sm mb-2">
                      <span className="font-semibold">{sighting.user.name}</span>{" "}
                      {sighting.caption}
                    </p>
                  )
                )}

                {/* Comments */}
                {selectedSighting === sighting.id && (
                  <div className="bg-white/5 rounded-lg p-3 space-y-3">
                    {comments[sighting.id]?.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <img
                          src={comment.user.image || "/default-avatar.png"}
                          alt={comment.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{comment.user.name}</span>{" "}
                            {comment.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleComment(sighting.id);
                        }}
                      />
                      <button
                        onClick={() => handleComment(sighting.id)}
                        className="text-aurora-blue font-semibold text-sm"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1f2e] rounded-2xl p-6 max-w-sm w-full border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">Delete Post?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteSighting(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Cameras Tab */}
        {activeTab === "cameras" && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live • Auto-refreshing every 60 seconds</span>
                </div>
                <span className="mx-2">|</span>
                <span>Current Time (UTC): {format(currentTime, "PPpp")}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {AURORA_CAMERAS.map((camera) => (
                <div
                  key={camera.id}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 hover:border-aurora-green/50 transition-all duration-300"
                >
                  {/* Camera Image */}
                  <div className="relative aspect-video bg-black/50">
                    {!imageErrors[camera.id] ? (
                      <img
                        src={getImageUrl(camera)}
                        alt={`${camera.name} live view`}
                        className="w-full h-full object-cover"
                        onLoad={() => handleImageLoad(camera.id)}
                        onError={() => handleImageError(camera.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center p-4">
                          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm">Camera offline or daytime</p>
                          <p className="text-xs mt-1 text-gray-600">Check back during nighttime hours</p>
                        </div>
                      </div>
                    )}

                    {/* Live Indicator */}
                    {!imageErrors[camera.id] && (
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-semibold">LIVE</span>
                      </div>
                    )}

                    {/* Update Frequency */}
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="text-white text-xs">{camera.updateFrequency}</span>
                    </div>
                  </div>

                  {/* Camera Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {camera.name}
                    </h3>
                    <p className="text-aurora-green text-sm mb-3">
                      {camera.location}, {camera.country}
                    </p>

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{camera.latitude.toFixed(4)}°N, {Math.abs(camera.longitude).toFixed(4)}°{camera.longitude >= 0 ? 'E' : 'W'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {lastUpdated[camera.id]
                            ? `Updated: ${format(lastUpdated[camera.id], "HH:mm:ss")}`
                            : "Loading..."}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>{camera.provider}</span>
                      </div>
                    </div>

                    {/* Timezone Badge */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="inline-block bg-white/10 px-2 py-1 rounded text-xs text-gray-300">
                        {camera.timezone} Timezone
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
