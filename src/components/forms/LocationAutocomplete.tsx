"use client";

import { useState, useEffect } from "react";

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string, latitude: string, longitude: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "e.g., Reykjavik, Iceland",
  required = false,
  className = "",
}: LocationAutocompleteProps) {
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Debounced location search
  useEffect(() => {
    if (!value || value.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&limit=5&accept-language=en`,
          {
            headers: {
              'User-Agent': 'AuroraAddict/1.0',
              'Accept-Language': 'en'
            }
          }
        );
        const data = await response.json();
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        setLocationSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [value]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.display_name, suggestion.lat, suggestion.lon);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value, "", "")}
        onFocus={() => {
          if (locationSuggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
      />

      {/* Autocomplete Dropdown */}
      {showSuggestions && locationSuggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-[#1a1f2e] border border-white/10 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl">
          {locationSuggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleLocationSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-1 text-aurora-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-300">{suggestion.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoadingSuggestions && (
        <div className="absolute right-3 top-3 pointer-events-none">
          <div className="w-5 h-5 border-2 border-aurora-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
