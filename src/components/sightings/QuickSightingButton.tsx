"use client";

import { useState, useCallback } from "react";
import { Eye, Send, MapPin, Loader2, X, Check, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

/**
 * Quick Sighting Button Component
 *
 * Floating action button that allows users to quickly report "I see aurora!"
 * with minimal friction. Opens a bottom sheet for intensity and color selection.
 */

interface QuickSightingButtonProps {
  className?: string;
  onSuccess?: (sighting: { id: string; latitude: number; longitude: number }) => void;
  position?: "bottom-right" | "bottom-center";
}

type IntensityLevel = 1 | 2 | 3 | 4 | 5;

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  1: "Faint",
  2: "Dim",
  3: "Moderate",
  4: "Bright",
  5: "Very Bright",
};

const AURORA_COLORS = [
  { id: "green", label: "Green", color: "#22c55e" },
  { id: "purple", label: "Purple", color: "#a855f7" },
  { id: "pink", label: "Pink", color: "#ec4899" },
  { id: "red", label: "Red", color: "#ef4444" },
  { id: "blue", label: "Blue", color: "#3b82f6" },
  { id: "white", label: "White", color: "#f5f5f5" },
];

const AURORA_STRUCTURES = [
  { id: "arc", label: "Arc" },
  { id: "band", label: "Band" },
  { id: "curtain", label: "Curtain" },
  { id: "corona", label: "Corona" },
  { id: "diffuse", label: "Diffuse" },
  { id: "pulsating", label: "Pulsating" },
];

export function QuickSightingButton({
  className = "",
  onSuccess,
  position = "bottom-right",
}: QuickSightingButtonProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [intensity, setIntensity] = useState<IntensityLevel>(3);
  const [selectedColors, setSelectedColors] = useState<string[]>(["green"]);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  const positionClasses = {
    "bottom-right": "right-4 bottom-4",
    "bottom-center": "left-1/2 -translate-x-1/2 bottom-4",
  };

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return null;
    }

    setIsGettingLocation(true);
    return new Promise<{ lat: number; lon: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(loc);
          setIsGettingLocation(false);
          resolve(loc);
        },
        (err) => {
          setError("Could not get your location");
          setIsGettingLocation(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const handleOpen = async () => {
    if (!session) {
      // Would redirect to sign in
      alert("Please sign in to report sightings");
      return;
    }

    setIsOpen(true);
    setError(null);

    // Get location when opening
    if (!location) {
      await getLocation();
    }
  };

  const handleSubmit = async () => {
    if (!session) {
      setError("Please sign in to report sightings");
      return;
    }

    let coords = location;
    if (!coords) {
      coords = await getLocation();
      if (!coords) {
        setError("Location required to report sighting");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sightings/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lon,
          intensity,
          colors: selectedColors,
          structure: selectedStructure,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit sighting");
      }

      const data = await response.json();

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        // Reset form
        setIntensity(3);
        setSelectedColors(["green"]);
        setSelectedStructure(null);
      }, 2000);

      onSuccess?.({
        id: data.sighting.id,
        latitude: data.sighting.latitude,
        longitude: data.sighting.longitude,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId)
        ? prev.filter((c) => c !== colorId)
        : [...prev, colorId]
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className={`fixed ${positionClasses[position]} z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-medium rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-105 active:scale-95 ${className}`}
      >
        <Eye className="w-5 h-5" />
        <span>I See Aurora!</span>
      </button>

      {/* Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Handle */}
            <div className="sticky top-0 bg-gray-900 pt-3 pb-2 px-4">
              <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  Report Aurora Sighting
                </h2>
                <button
                  onClick={() => !isSubmitting && setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-lg font-medium text-white">Sighting Reported!</p>
                <p className="text-sm text-gray-400 mt-1">
                  It will appear on the map for 2 hours
                </p>
              </div>
            ) : (
              <div className="px-4 pb-8 space-y-6">
                {/* Location */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Location</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                    {isGettingLocation ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <MapPin className="w-5 h-5 text-green-400" />
                    )}
                    <span className="text-gray-300">
                      {location
                        ? `${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°`
                        : isGettingLocation
                        ? "Getting location..."
                        : "Location not available"}
                    </span>
                    {!location && !isGettingLocation && (
                      <button
                        onClick={getLocation}
                        className="ml-auto text-xs text-green-400 hover:text-green-300"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>

                {/* Intensity */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Brightness: <span className="text-white">{INTENSITY_LABELS[intensity]}</span>
                  </label>
                  <div className="flex gap-2">
                    {([1, 2, 3, 4, 5] as IntensityLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setIntensity(level)}
                        className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                          intensity === level
                            ? "bg-green-500 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Colors Seen (select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AURORA_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => toggleColor(color.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          selectedColors.includes(color.id)
                            ? "ring-2 ring-offset-2 ring-offset-gray-900"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: `${color.color}30`,
                          color: color.color,
                          // @ts-expect-error - CSS custom property for ring color
                          "--tw-ring-color": selectedColors.includes(color.id)
                            ? color.color
                            : undefined,
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color.color }}
                        />
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Structure */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Aurora Structure (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AURORA_STRUCTURES.map((structure) => (
                      <button
                        key={structure.id}
                        onClick={() =>
                          setSelectedStructure(
                            selectedStructure === structure.id ? null : structure.id
                          )
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedStructure === structure.id
                            ? "bg-purple-500/30 text-purple-300 ring-1 ring-purple-500"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {structure.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !location}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Report Sighting
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your sighting will appear on the map for 2 hours and help other aurora hunters!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default QuickSightingButton;
