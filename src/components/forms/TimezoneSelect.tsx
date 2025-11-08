"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { getAllTimezones, formatTimezoneOffset, getTimezoneName } from "@/utils/timezones";

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

export default function TimezoneSelect({
  value,
  onChange,
  className = "",
}: TimezoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allTimezones = useMemo(() => getAllTimezones(), []);

  // Filter timezones based on search query
  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTimezones;
    }

    const query = searchQuery.toLowerCase();
    return allTimezones.filter(
      (tz) =>
        tz.label.toLowerCase().includes(query) ||
        tz.value.toLowerCase().includes(query)
    );
  }, [allTimezones, searchQuery]);

  // Get display label for selected timezone
  const selectedLabel = useMemo(() => {
    const selected = allTimezones.find((tz) => tz.value === value);
    if (selected) {
      return selected.label;
    }
    // Fallback if timezone not in list
    return `${formatTimezoneOffset(value)} ${getTimezoneName(value)}`;
  }, [value, allTimezones]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (timezone: string) => {
    onChange(timezone);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected value display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex items-center justify-between ${className}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-2xl border border-gray-300 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search timezones..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Timezone list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredTimezones.length > 0 ? (
              filteredTimezones.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => handleSelect(tz.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                    tz.value === value
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "text-gray-900"
                  }`}
                >
                  {tz.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No timezones found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
