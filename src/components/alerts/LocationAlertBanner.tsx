"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Zap,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Bell,
  BellOff,
} from "lucide-react";
import {
  calculateLocationAlert,
  LocationAlert,
  AlertLevel,
  ALERT_COLORS,
} from "@/lib/alerts/locationAlerts";

/**
 * Location Alert Banner Component
 *
 * Displays personalized aurora alerts based on user's location.
 * Color-coded alerts: Purple, Red, Orange, Yellow, Green, None
 */

interface LocationAlertBannerProps {
  latitude?: number;
  longitude?: number;
  className?: string;
  dismissible?: boolean;
  showFactors?: boolean;
  onAlertChange?: (alert: LocationAlert) => void;
}

export function LocationAlertBanner({
  latitude,
  longitude,
  className = "",
  dismissible = true,
  showFactors = true,
  onAlertChange,
}: LocationAlertBannerProps) {
  const [alert, setAlert] = useState<LocationAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(
    latitude && longitude ? { lat: latitude, lon: longitude } : null
  );
  const [isDark, setIsDark] = useState(true);

  // Get user's location if not provided
  useEffect(() => {
    if (latitude && longitude) {
      setUserLocation({ lat: latitude, lon: longitude });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Default to Tromsø if geolocation fails
          setUserLocation({ lat: 69.65, lon: 18.96 });
        }
      );
    }
  }, [latitude, longitude]);

  // Check if it's dark at user's location (simplified)
  useEffect(() => {
    if (!userLocation) return;

    const now = new Date();
    const hours = now.getUTCHours();
    const localOffset = Math.round(userLocation.lon / 15);
    const localHour = (hours + localOffset + 24) % 24;

    // Simplified: dark between 6 PM and 6 AM
    // In reality, this should use SunCalc library
    setIsDark(localHour >= 18 || localHour < 6);
  }, [userLocation]);

  // Fetch space weather data and calculate alert
  const fetchAlertData = useCallback(async () => {
    if (!userLocation) return;

    try {
      setIsLoading(true);

      // Fetch current space weather conditions
      const [kpResponse, hpResponse, magResponse] = await Promise.all([
        fetch("/api/space-weather/kp-index"),
        fetch("/api/space-weather/hp-index").catch(() => null),
        fetch("/api/space-weather/supermag").catch(() => null),
      ]);

      // Parse Kp data
      let currentKp = 2;
      let currentBz = 0;
      let solarWindSpeed = 400;

      if (kpResponse.ok) {
        const kpData = await kpResponse.json();
        if (Array.isArray(kpData) && kpData.length > 1) {
          currentKp = parseFloat(kpData[kpData.length - 1]?.[1]) || 2;
        }
      }

      // Parse Hp data
      let hp30: number | undefined;
      if (hpResponse?.ok) {
        const hpData = await hpResponse.json();
        hp30 = hpData.current?.hp30;
      }

      // Parse solar wind from magnetometer API (it includes this)
      if (magResponse?.ok) {
        const magData = await magResponse.json();
        // Would need actual Bz data here
      }

      // Calculate alert
      const calculatedAlert = calculateLocationAlert({
        latitude: userLocation.lat,
        longitude: userLocation.lon,
        currentKp,
        currentBz,
        solarWindSpeed,
        hp30,
        isDark,
      });

      setAlert(calculatedAlert);
      onAlertChange?.(calculatedAlert);
      setIsLoading(false);
    } catch (error) {
      console.error("Error calculating alert:", error);
      setIsLoading(false);
    }
  }, [userLocation, isDark, onAlertChange]);

  useEffect(() => {
    fetchAlertData();
    const interval = setInterval(fetchAlertData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchAlertData]);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!alert || isDismissed) return null;

  // Don't show banner for "none" level unless there's something notable
  if (alert.level === "none" && !showFactors) return null;

  const alertColors = ALERT_COLORS[alert.level];

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ backgroundColor: alertColors.backgroundColor }}
    >
      {/* Animated gradient for high-priority alerts */}
      {(alert.level === "purple" || alert.level === "red") && (
        <div
          className="absolute inset-0 opacity-30 animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${alertColors.color}40, transparent)`,
          }}
        />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Alert icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${alertColors.color}30` }}
            >
              {alert.level === "purple" || alert.level === "red" ? (
                <Zap className="w-5 h-5" style={{ color: alertColors.color }} />
              ) : alert.level === "orange" || alert.level === "yellow" ? (
                <AlertTriangle
                  className="w-5 h-5"
                  style={{ color: alertColors.color }}
                />
              ) : (
                <Bell className="w-5 h-5" style={{ color: alertColors.color }} />
              )}
            </div>

            {/* Title and message */}
            <div className="flex-1">
              <h3
                className="font-semibold text-lg"
                style={{ color: alertColors.color }}
              >
                {alert.title}
              </h3>
              <p className="text-gray-300 text-sm mt-1">{alert.message}</p>

              {/* Action */}
              {alert.action && (
                <p
                  className="font-medium text-sm mt-2"
                  style={{ color: alertColors.color }}
                >
                  {alert.action}
                </p>
              )}

              {/* Timing */}
              {alert.timing.estimatedTime && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{alert.timing.estimatedTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Expand/collapse button */}
        {showFactors && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 mt-3 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show details
              </>
            )}
          </button>
        )}

        {/* Expanded factors */}
        {showFactors && isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-3">
            {/* Visibility quality */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Visibility at your location</span>
              <span className="text-gray-200 capitalize">
                {alert.visibility.quality}
              </span>
            </div>

            {/* Factors */}
            <div className="space-y-2">
              <div className="text-xs text-gray-400">
                <strong>Kp:</strong> {alert.factors.kpContribution}
              </div>
              <div className="text-xs text-gray-400">
                <strong>Bz:</strong> {alert.factors.bzContribution}
              </div>
              {alert.factors.substormContribution && (
                <div className="text-xs text-gray-400">
                  <strong>Substorm:</strong> {alert.factors.substormContribution}
                </div>
              )}
              {alert.factors.moonImpact && (
                <div className="text-xs text-gray-400">
                  <strong>Moon:</strong> {alert.factors.moonImpact}
                </div>
              )}
              {alert.factors.cloudImpact && (
                <div className="text-xs text-gray-400">
                  <strong>Clouds:</strong> {alert.factors.cloudImpact}
                </div>
              )}
            </div>

            {/* User location */}
            {userLocation && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>
                  {userLocation.lat.toFixed(2)}°N, {userLocation.lon.toFixed(2)}°
                  {userLocation.lon >= 0 ? "E" : "W"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline alert for headers
 */
export function LocationAlertInline({
  latitude,
  longitude,
  className = "",
}: {
  latitude?: number;
  longitude?: number;
  className?: string;
}) {
  const [alert, setAlert] = useState<LocationAlert | null>(null);

  useEffect(() => {
    // Simplified fetch for inline display
    const fetchAlert = async () => {
      try {
        const kpResponse = await fetch("/api/space-weather/kp-index");
        if (!kpResponse.ok) return;

        const kpData = await kpResponse.json();
        const currentKp = parseFloat(kpData[kpData.length - 1]?.[1]) || 2;

        const calculatedAlert = calculateLocationAlert({
          latitude: latitude || 65,
          longitude: longitude || 25,
          currentKp,
          currentBz: 0,
          solarWindSpeed: 400,
          isDark: true,
        });

        setAlert(calculatedAlert);
      } catch {
        // Ignore errors for inline display
      }
    };

    fetchAlert();
  }, [latitude, longitude]);

  if (!alert || alert.level === "none") return null;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${className}`}
      style={{
        backgroundColor: ALERT_COLORS[alert.level].backgroundColor,
        color: ALERT_COLORS[alert.level].color,
      }}
    >
      {alert.level === "purple" || alert.level === "red" ? (
        <Zap className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      )}
      <span className="font-medium">{alert.title}</span>
    </div>
  );
}

export default LocationAlertBanner;
