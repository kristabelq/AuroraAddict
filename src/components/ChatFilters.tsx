"use client";

import { useState } from "react";

interface ChatFiltersProps {
  // Context
  context?: "myChats" | "discover"; // Determines which filters to show

  // Search
  searchQuery: string;
  setSearchQuery: (value: string) => void;

  // Chat type
  chatTypeFilter: "all" | "hunt" | "area" | "business" | "direct";
  setChatTypeFilter: (value: "all" | "hunt" | "area" | "business" | "direct") => void;

  // Hunt filters
  huntStatusFilter: "all" | "upcoming" | "ongoing" | "completed";
  setHuntStatusFilter: (value: "all" | "upcoming" | "ongoing" | "completed") => void;

  // Location filters
  countryFilter: "all" | "FI" | "NO" | "SE";
  setCountryFilter: (value: "all" | "FI" | "NO" | "SE") => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;

  // Business filter
  businessCategoryFilter: string;
  setBusinessCategoryFilter: (value: string) => void;

  // Direct message filter
  usernameSearch: string;
  setUsernameSearch: (value: string) => void;

  // Helper functions
  getCitiesForCountry: (country: string) => string[];
  clearAllFilters: () => void;
  hasActiveFilters: () => boolean;
}

export default function ChatFilters({
  context = "myChats", // Default to myChats for backward compatibility
  searchQuery,
  setSearchQuery,
  chatTypeFilter,
  setChatTypeFilter,
  huntStatusFilter,
  setHuntStatusFilter,
  countryFilter,
  setCountryFilter,
  cityFilter,
  setCityFilter,
  businessCategoryFilter,
  setBusinessCategoryFilter,
  usernameSearch,
  setUsernameSearch,
  getCitiesForCountry,
  clearAllFilters,
  hasActiveFilters,
}: ChatFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const availableCities = countryFilter !== "all" ? getCitiesForCountry(countryFilter) : [];

  // Determine if we should show certain filters based on context
  const showHuntChats = context === "myChats";
  const showDirectMessages = context === "myChats";
  const showHuntStatus = context === "myChats";

  return (
    <div className="bg-white/5 rounded-lg p-4 mb-4">
      {/* Search Bar - Always Visible */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            showFilters || hasActiveFilters()
              ? "bg-aurora-green text-black"
              : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Collapsible Filter Section */}
      {showFilters && (
        <div className="space-y-4 pt-3 border-t border-white/10">
          {/* Chat Type Filter */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Chat Type</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => {
                  setChatTypeFilter("all");
                  setHuntStatusFilter("all");
                  setCountryFilter("all");
                  setCityFilter("all");
                  setBusinessCategoryFilter("all");
                  setUsernameSearch("");
                }}
                className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                  chatTypeFilter === "all"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                All
              </button>
              {showHuntChats && (
                <button
                  onClick={() => {
                    setChatTypeFilter("hunt");
                    setCountryFilter("all");
                    setCityFilter("all");
                    setBusinessCategoryFilter("all");
                    setUsernameSearch("");
                  }}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    chatTypeFilter === "hunt"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Hunt Chats
                </button>
              )}
              <button
                onClick={() => {
                  setChatTypeFilter("area");
                  setHuntStatusFilter("all");
                  setUsernameSearch("");
                }}
                className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                  chatTypeFilter === "area"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                Area Chats
              </button>
              <button
                onClick={() => {
                  setChatTypeFilter("business");
                  setHuntStatusFilter("all");
                  setUsernameSearch("");
                }}
                className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                  chatTypeFilter === "business"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                Business
              </button>
              {showDirectMessages && (
                <button
                  onClick={() => {
                    setChatTypeFilter("direct");
                    setHuntStatusFilter("all");
                    setCountryFilter("all");
                    setCityFilter("all");
                    setBusinessCategoryFilter("all");
                  }}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    chatTypeFilter === "direct"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Direct Messages
                </button>
              )}
            </div>
          </div>

          {/* Hunt Status Filter - Only for Hunt Chats in My Chats context */}
          {showHuntStatus && (chatTypeFilter === "all" || chatTypeFilter === "hunt") && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">Hunt Status</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setHuntStatusFilter("all")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    huntStatusFilter === "all"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setHuntStatusFilter("upcoming")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    huntStatusFilter === "upcoming"
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setHuntStatusFilter("ongoing")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    huntStatusFilter === "ongoing"
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Ongoing
                </button>
                <button
                  onClick={() => setHuntStatusFilter("completed")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    huntStatusFilter === "completed"
                      ? "bg-gray-500 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          )}

          {/* Location Filters - For Area Chats */}
          {(chatTypeFilter === "all" || chatTypeFilter === "area") && (
            <>
              {/* Country Filter */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Country</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => {
                      setCountryFilter("all");
                      setCityFilter("all");
                    }}
                    className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                      countryFilter === "all"
                        ? "bg-aurora-green text-black"
                        : "bg-white/10 text-gray-400 hover:bg-white/20"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setCountryFilter("FI");
                      setCityFilter("all");
                    }}
                    className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                      countryFilter === "FI"
                        ? "bg-aurora-green text-black"
                        : "bg-white/10 text-gray-400 hover:bg-white/20"
                    }`}
                  >
                    🇫🇮 Finland
                  </button>
                  <button
                    onClick={() => {
                      setCountryFilter("NO");
                      setCityFilter("all");
                    }}
                    className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                      countryFilter === "NO"
                        ? "bg-aurora-green text-black"
                        : "bg-white/10 text-gray-400 hover:bg-white/20"
                    }`}
                  >
                    🇳🇴 Norway
                  </button>
                  <button
                    onClick={() => {
                      setCountryFilter("SE");
                      setCityFilter("all");
                    }}
                    className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                      countryFilter === "SE"
                        ? "bg-aurora-green text-black"
                        : "bg-white/10 text-gray-400 hover:bg-white/20"
                    }`}
                  >
                    🇸🇪 Sweden
                  </button>
                </div>
              </div>

              {/* City Filter - Only shown when a country is selected */}
              {countryFilter !== "all" && availableCities.length > 0 && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">City</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setCityFilter("all")}
                      className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                        cityFilter === "all"
                          ? "bg-aurora-green text-black"
                          : "bg-white/10 text-gray-400 hover:bg-white/20"
                      }`}
                    >
                      All
                    </button>
                    {availableCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setCityFilter(city)}
                        className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                          cityFilter === city
                            ? "bg-aurora-green text-black"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Business Category Filter - For Area and Business Chats */}
          {(chatTypeFilter === "all" || chatTypeFilter === "area" || chatTypeFilter === "business") && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">Business Category</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setBusinessCategoryFilter("all")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    businessCategoryFilter === "all"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setBusinessCategoryFilter("accommodation")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    businessCategoryFilter === "accommodation"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Accommodation
                </button>
                <button
                  onClick={() => setBusinessCategoryFilter("tour_operator")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    businessCategoryFilter === "tour_operator"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Tours
                </button>
                <button
                  onClick={() => setBusinessCategoryFilter("photography")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    businessCategoryFilter === "photography"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Photography
                </button>
                <button
                  onClick={() => setBusinessCategoryFilter("restaurant")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    businessCategoryFilter === "restaurant"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Restaurant
                </button>
                <button
                  onClick={() => setBusinessCategoryFilter("shop")}
                  className={`px-4 py-1 rounded-full whitespace-nowrap transition-colors ${
                    businessCategoryFilter === "shop"
                      ? "bg-aurora-green text-black"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  Shop
                </button>
              </div>
            </div>
          )}

          {/* Username Search - Only for Direct Messages in My Chats context */}
          {showDirectMessages && chatTypeFilter === "direct" && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">Search Username</label>
              <input
                type="text"
                value={usernameSearch}
                onChange={(e) => setUsernameSearch(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
              />
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters() && (
            <button
              onClick={() => {
                clearAllFilters();
                setShowFilters(false);
              }}
              className="w-full bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
