"use client";

import { useState, useEffect } from "react";
import { Camera, CheckCircle, AlertCircle, MapPin } from "lucide-react";

/**
 * Aurora Confirmed Badge Component
 *
 * Shows when all-sky cameras have detected aurora.
 * Provides "ground truth" confirmation of aurora visibility.
 */

interface CameraDetection {
  stationName: string;
  network: string;
  confidence: number;
}

interface AuroraConfirmedBadgeProps {
  className?: string;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AuroraConfirmedBadge({
  className = "",
  showDetails = true,
  size = "md",
}: AuroraConfirmedBadgeProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationLocations, setConfirmationLocations] = useState<string[]>([]);
  const [detections, setDetections] = useState<CameraDetection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpanded, setShowExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/cameras/network-status");
        if (!response.ok) return;

        const data = await response.json();

        setIsConfirmed(data.auroraConfirmed || false);
        setConfirmationLocations(data.auroraConfirmationLocations || []);

        // Extract detections from stations
        const auroraDetections = (data.stations || [])
          .filter((s: { auroraDetected: boolean }) => s.auroraDetected)
          .map((s: { stationName: string; network: string; auroraConfidence: number }) => ({
            stationName: s.stationName,
            network: s.network,
            confidence: s.auroraConfidence || 0,
          }));

        setDetections(auroraDetections);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching camera status:", error);
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60 * 1000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-full animate-pulse ${className}`}
      >
        <div className="w-4 h-4 bg-gray-600 rounded-full" />
        <div className="w-16 h-3 bg-gray-600 rounded" />
      </div>
    );
  }

  // Size variants
  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (!isConfirmed) {
    // No aurora detected
    return (
      <div
        className={`inline-flex items-center ${sizeClasses[size]} bg-gray-700/50 rounded-full text-gray-400 ${className}`}
      >
        <Camera className={iconSizes[size]} />
        <span>No aurora on cameras</span>
      </div>
    );
  }

  // Aurora confirmed!
  return (
    <div className={className}>
      <button
        onClick={() => showDetails && setShowExpanded(!showExpanded)}
        className={`inline-flex items-center ${sizeClasses[size]} bg-green-500/20 border border-green-500/50 rounded-full text-green-400 hover:bg-green-500/30 transition-colors`}
      >
        <CheckCircle className={`${iconSizes[size]} text-green-500`} />
        <span className="font-medium">Aurora Confirmed!</span>
        {detections.length > 0 && (
          <span className="text-green-300">({detections.length} cameras)</span>
        )}
      </button>

      {/* Expanded details */}
      {showDetails && showExpanded && confirmationLocations.length > 0 && (
        <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-xs text-green-300 font-medium mb-2">
            Detected at:
          </div>
          <div className="flex flex-wrap gap-2">
            {confirmationLocations.map((location) => (
              <div
                key={location}
                className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full text-xs text-green-200"
              >
                <MapPin className="w-3 h-3" />
                {location}
              </div>
            ))}
          </div>

          {/* Detection details */}
          {detections.length > 0 && (
            <div className="mt-3 space-y-1">
              {detections.slice(0, 5).map((detection) => (
                <div
                  key={detection.stationName}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-300">
                    {detection.stationName}{" "}
                    <span className="text-gray-500">({detection.network})</span>
                  </span>
                  <span className="text-green-400">
                    {Math.round(detection.confidence * 100)}% confidence
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500">
            Based on all-sky camera network analysis
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline version for use in headers/banners
 */
export function AuroraConfirmedInline({ className = "" }: { className?: string }) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/cameras/network-status");
        if (!response.ok) return;
        const data = await response.json();
        setIsConfirmed(data.auroraConfirmed || false);
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !isConfirmed) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-green-400 ${className}`}
    >
      <CheckCircle className="w-3 h-3" />
      <span className="text-xs font-medium">Camera Confirmed</span>
    </span>
  );
}

export default AuroraConfirmedBadge;
