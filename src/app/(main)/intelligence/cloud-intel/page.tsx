"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CloudIntelPage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [cloudData, setCloudData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch location suggestions with debouncing
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
      );
      const data = await response.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounced search
  const handleLocationChange = (value: string) => {
    setLocation(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Fetch cloud layer data
  const fetchCloudData = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation,weather_code&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation_probability,visibility&forecast_hours=12&timezone=auto`
      );
      const data = await response.json();
      setCloudData(data);
    } catch (error) {
      console.error("Error fetching cloud data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (suggestion: any) => {
    setLocation(`${suggestion.name}, ${suggestion.admin1 || suggestion.country}`);
    setCoords({ lat: suggestion.latitude, lon: suggestion.longitude });
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    fetchCloudData(suggestion.latitude, suggestion.longitude);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleLocationSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Calculate aurora visibility score
  const calculateVisibilityScore = (low: number, mid: number, high: number) => {
    // Low clouds: 100% blocking
    // Mid clouds: 50% blocking
    // High clouds: 20% blocking
    const score = 100 - (low * 1.0 + mid * 0.5 + high * 0.2);
    return Math.max(0, Math.min(100, score));
  };

  // Get visibility verdict
  const getVisibilityVerdict = (score: number, low: number) => {
    if (low > 70) return { verdict: "BLOCKED", emoji: "🚫", color: "text-red-400" };
    if (score >= 70) return { verdict: "EXCELLENT", emoji: "✨", color: "text-green-400" };
    if (score >= 50) return { verdict: "GOOD", emoji: "👌", color: "text-green-300" };
    if (score >= 30) return { verdict: "FAIR", emoji: "🌥️", color: "text-yellow-300" };
    if (score >= 10) return { verdict: "POOR", emoji: "☁️", color: "text-orange-300" };
    return { verdict: "BLOCKED", emoji: "❌", color: "text-red-400" };
  };

  // Get cloud layer impact
  const getLayerImpact = (coverage: number, layer: string) => {
    if (layer === "low") {
      if (coverage > 70) return { impact: "Severe", emoji: "❌", color: "text-red-400" };
      if (coverage > 40) return { impact: "Major", emoji: "⚠️", color: "text-orange-400" };
      if (coverage > 20) return { impact: "Moderate", emoji: "🟡", color: "text-yellow-400" };
      return { impact: "Minimal", emoji: "✅", color: "text-green-400" };
    } else if (layer === "mid") {
      if (coverage > 80) return { impact: "Major", emoji: "⚠️", color: "text-orange-400" };
      if (coverage > 50) return { impact: "Moderate", emoji: "🟡", color: "text-yellow-400" };
      if (coverage > 20) return { impact: "Minor", emoji: "👌", color: "text-green-400" };
      return { impact: "Minimal", emoji: "✅", color: "text-green-400" };
    } else {
      if (coverage > 80) return { impact: "Minor", emoji: "👌", color: "text-green-400" };
      if (coverage > 50) return { impact: "Slight", emoji: "✅", color: "text-green-400" };
      return { impact: "None", emoji: "✅", color: "text-green-400" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-indigo-950 to-purple-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/intelligence")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Intelligence
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">☁️</span>
            <h1 className="text-4xl font-bold text-white">Cloud Intel</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Detailed cloud layer analysis for aurora viewing
          </p>
        </div>

        {/* Location Input */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-indigo-500/30 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📍</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Location</h3>
              <p className="text-xs text-gray-400">Enter location for cloud analysis</p>
            </div>
          </div>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Enter city name..."
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
              autoComplete="off"
            />

            {loadingSuggestions && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-2 bg-gray-900 border-2 border-indigo-500/50 rounded-lg shadow-xl max-h-60 overflow-y-auto"
              >
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLocationSelect(suggestion)}
                    className={`px-4 py-3 cursor-pointer text-white border-b border-white/10 last:border-b-0 transition-colors ${
                      idx === selectedIndex
                        ? "bg-indigo-600/50"
                        : "hover:bg-indigo-600/30"
                    }`}
                  >
                    <div className="font-semibold">{suggestion.name}</div>
                    <div className="text-xs text-gray-400">
                      {suggestion.admin1 && `${suggestion.admin1}, `}
                      {suggestion.country}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showSuggestions && !loadingSuggestions && suggestions.length === 0 && location.length >= 2 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-2 bg-gray-900 border-2 border-indigo-500/50 rounded-lg shadow-xl p-4"
              >
                <p className="text-gray-400 text-sm text-center">
                  No locations found. Try a different search.
                </p>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-gray-300 mt-4">Loading cloud data...</p>
          </div>
        )}

        {cloudData && !loading && (
          <>
            {/* Current Conditions */}
            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-blue-500/30 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🌤️</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">Current Cloud Layers</h2>
                  <p className="text-sm text-gray-300">Real-time altitude analysis</p>
                </div>
              </div>

              {/* Visibility Score */}
              {(() => {
                const low = cloudData.current.cloud_cover_low || 0;
                const mid = cloudData.current.cloud_cover_mid || 0;
                const high = cloudData.current.cloud_cover_high || 0;
                const score = calculateVisibilityScore(low, mid, high);
                const result = getVisibilityVerdict(score, low);

                return (
                  <div className={`bg-white/10 rounded-xl p-6 mb-6 border-2 ${result.verdict === "BLOCKED" ? "border-red-500/50" : result.verdict === "EXCELLENT" || result.verdict === "GOOD" ? "border-green-500/50" : result.verdict === "FAIR" ? "border-yellow-500/50" : "border-orange-500/50"}`}>
                    <div className="text-center mb-4">
                      <div className={`text-5xl font-black ${result.color} mb-2`}>
                        {result.emoji} {result.verdict}
                      </div>
                      <div className="text-2xl font-bold text-white">
                        Aurora Visibility: {score.toFixed(0)}%
                      </div>
                    </div>

                    <div className="text-sm text-gray-200 text-center">
                      {low > 70 ? "Dense low clouds completely blocking aurora" :
                       score >= 70 ? "Excellent viewing through thin/high clouds!" :
                       score >= 50 ? "Aurora visible but dimmed by cloud layers" :
                       score >= 30 ? "Only strong aurora visible through clouds" :
                       score >= 10 ? "Heavy clouds severely limiting visibility" :
                       "Aurora completely blocked by thick clouds"}
                    </div>
                  </div>
                );
              })()}

              {/* Cloud Layers Breakdown */}
              <div className="space-y-4">
                {/* Low Clouds */}
                {(() => {
                  const coverage = cloudData.current.cloud_cover_low || 0;
                  const impact = getLayerImpact(coverage, "low");
                  return (
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">☁️</span>
                          <div>
                            <div className="text-lg font-bold text-white">Low Clouds (0-2 km)</div>
                            <div className="text-xs text-gray-400">Stratus, Fog, Cumulus</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">{coverage}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{impact.emoji}</span>
                        <span className={`text-sm font-semibold ${impact.color}`}>
                          {impact.impact} Impact
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${coverage > 70 ? "bg-red-500" : coverage > 40 ? "bg-orange-500" : coverage > 20 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${coverage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {coverage > 70 ? "Dense low clouds completely block aurora - like a ceiling" :
                         coverage > 40 ? "Significant low cloud coverage blocking aurora" :
                         coverage > 20 ? "Some low clouds present but gaps exist" :
                         "Minimal low clouds - aurora should shine through"}
                      </p>
                    </div>
                  );
                })()}

                {/* Mid Clouds */}
                {(() => {
                  const coverage = cloudData.current.cloud_cover_mid || 0;
                  const impact = getLayerImpact(coverage, "mid");
                  return (
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🌥️</span>
                          <div>
                            <div className="text-lg font-bold text-white">Mid Clouds (2-6 km)</div>
                            <div className="text-xs text-gray-400">Altostratus, Altocumulus</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">{coverage}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{impact.emoji}</span>
                        <span className={`text-sm font-semibold ${impact.color}`}>
                          {impact.impact} Impact
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${coverage > 80 ? "bg-orange-500" : coverage > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${coverage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {coverage > 80 ? "Heavy mid-level clouds will dim aurora significantly" :
                         coverage > 50 ? "Moderate mid clouds reducing aurora brightness" :
                         coverage > 20 ? "Some mid clouds present but aurora still visible" :
                         "Minimal mid clouds - good conditions"}
                      </p>
                    </div>
                  );
                })()}

                {/* High Clouds */}
                {(() => {
                  const coverage = cloudData.current.cloud_cover_high || 0;
                  const impact = getLayerImpact(coverage, "high");
                  return (
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">✨</span>
                          <div>
                            <div className="text-lg font-bold text-white">High Clouds (6-13 km)</div>
                            <div className="text-xs text-gray-400">Cirrus, Cirrostratus</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">{coverage}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{impact.emoji}</span>
                        <span className={`text-sm font-semibold ${impact.color}`}>
                          {impact.impact} Impact
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-green-500"
                          style={{ width: `${coverage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {coverage > 80 ? "High thin clouds - aurora easily shines through!" :
                         coverage > 50 ? "Some high clouds but minimal impact on viewing" :
                         "Clear at high altitudes - perfect for aurora"}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Total Cloud Cover Comparison */}
              <div className="mt-6 bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Cloud Cover</div>
                    <div className="text-2xl font-bold text-white">{cloudData.current.cloud_cover}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">Aurora Visibility</div>
                    <div className="text-2xl font-bold text-green-400">
                      {calculateVisibilityScore(
                        cloudData.current.cloud_cover_low || 0,
                        cloudData.current.cloud_cover_mid || 0,
                        cloudData.current.cloud_cover_high || 0
                      ).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 italic">
                  💡 Total cloud cover can be misleading! High thin clouds (cirrus) allow aurora viewing,
                  while low thick clouds (stratus) block it completely. Auroras occur at 80-250 km altitude,
                  far above all clouds (max ~13 km), so visibility depends on cloud opacity, not height.
                </p>
              </div>
            </div>

            {/* 12-Hour Forecast */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-500/30">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📊</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">12-Hour Forecast</h2>
                  <p className="text-sm text-gray-300">Cloud layer trends</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-flex gap-3 pb-4">
                  {cloudData.hourly.cloud_cover.slice(0, 12).map((_, idx: number) => {
                    const low = cloudData.hourly.cloud_cover_low[idx] || 0;
                    const mid = cloudData.hourly.cloud_cover_mid[idx] || 0;
                    const high = cloudData.hourly.cloud_cover_high[idx] || 0;
                    const score = calculateVisibilityScore(low, mid, high);
                    const time = new Date(cloudData.hourly.time[idx]);

                    return (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10 min-w-[140px]">
                        <div className="text-center mb-3">
                          <div className="text-sm font-semibold text-white">
                            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-400">
                            +{idx}h
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Low</span>
                            <span className={`font-bold ${low > 70 ? 'text-red-400' : low > 40 ? 'text-orange-400' : 'text-green-400'}`}>
                              {low}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Mid</span>
                            <span className={`font-bold ${mid > 80 ? 'text-orange-400' : mid > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {mid}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">High</span>
                            <span className="font-bold text-green-400">{high}%</span>
                          </div>
                        </div>

                        <div className="text-center pt-3 border-t border-white/10">
                          <div className={`text-lg font-bold ${score >= 70 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : score >= 30 ? 'text-orange-400' : 'text-red-400'}`}>
                            {score.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-400">Visibility</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {!cloudData && !loading && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">☁️</span>
            <p className="text-xl text-gray-300">Enter a location to analyze cloud layers</p>
          </div>
        )}
      </div>
    </div>
  );
}
