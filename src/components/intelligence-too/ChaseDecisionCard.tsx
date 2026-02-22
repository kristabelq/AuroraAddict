"use client";

import { useState, useEffect, useMemo } from "react";
import { useSpaceWeather } from "@/hooks/useSpaceWeather";
import { useAuroraNotifications } from "@/hooks/useAuroraNotifications";
import {
  detectSubstormPhase,
  type SubstormState,
} from "@/lib/substormDetection";
import {
  findNearestDarkSites,
  formatDriveTime,
  getBortleColor,
  getBortleDescription,
  getCountryFlag,
  type DarkSkySiteWithDistance,
} from "@/lib/darkSkySites";

interface ChaseDecisionCardProps {
  latitude?: number;
  longitude?: number;
  isLoadingLocation?: boolean;
  className?: string;
}

interface CloudCoverData {
  cloudCover: number;
  description: string;
}

export function ChaseDecisionCard({
  latitude,
  longitude,
  isLoadingLocation = false,
  className = "",
}: ChaseDecisionCardProps) {
  const [substormState, setSubstormState] = useState<SubstormState | null>(null);
  const [selectedSite, setSelectedSite] = useState<DarkSkySiteWithDistance | null>(null);
  const [cloudCover, setCloudCover] = useState<Map<string, CloudCoverData>>(new Map());
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [reminderTimeoutId, setReminderTimeoutId] = useState<number | null>(null);

  const { permission, requestPermission, scheduleReminder, cancelReminder } = useAuroraNotifications();

  const { kpIndex, solarWind, magnetometer, isLoading } = useSpaceWeather({
    enableMagnetometer: true,
    refreshInterval: 30000,
  });

  // Find nearest dark sky sites
  const nearestSites = useMemo(() => {
    if (!latitude || !longitude) return [];
    return findNearestDarkSites(latitude, longitude, 5, 300, 4);
  }, [latitude, longitude]);

  // Set first site as default selected
  useEffect(() => {
    if (nearestSites.length > 0 && !selectedSite) {
      setSelectedSite(nearestSites[0]);
    }
  }, [nearestSites, selectedSite]);

  // Fetch cloud cover for nearest sites
  useEffect(() => {
    if (nearestSites.length === 0) return;

    const fetchCloudCover = async () => {
      setIsLoadingCloud(true);
      try {
        const response = await fetch("/api/weather/cloud-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locations: nearestSites.map(site => ({
              lat: site.latitude,
              lon: site.longitude,
              name: site.name,
            })),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newCloudCover = new Map<string, CloudCoverData>();
          data.results.forEach((result: { name: string; cloudCover?: number; description?: string }) => {
            if (result.cloudCover !== undefined) {
              newCloudCover.set(result.name, {
                cloudCover: result.cloudCover,
                description: result.description || "",
              });
            }
          });
          setCloudCover(newCloudCover);
        }
      } catch (error) {
        console.error("Error fetching cloud cover:", error);
      }
      setIsLoadingCloud(false);
    };

    fetchCloudCover();
    // Refresh every 15 minutes
    const interval = setInterval(fetchCloudCover, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [nearestSites]);

  // Detect substorm phase
  useEffect(() => {
    if (!magnetometer || !kpIndex || !solarWind) return;

    const magnetometerData = magnetometer.stations.map((s) => ({
      stationCode: s.code,
      timestamp: new Date(),
      deltaB: s.deltaB,
      latitude: s.latitude,
      geomagLat: s.latitude,
    }));

    const state = detectSubstormPhase({
      magnetometerData,
      currentKp: kpIndex.current,
      currentBz: solarWind.bz,
      solarWindSpeed: solarWind.speed,
      previousState: substormState || undefined,
    });

    setSubstormState(state);
  }, [magnetometer, kpIndex, solarWind]);

  // Calculate activity window and decision timing
  const chaseDecision = useMemo(() => {
    if (!substormState || !selectedSite) {
      return null;
    }

    const now = new Date();
    const driveTimeMs = selectedSite.driveTimeMinutes * 60 * 1000;
    const bufferTimeMs = 15 * 60 * 1000; // 15 min buffer for setup

    let activityStart: Date | null = null;
    let activityEnd: Date | null = null;
    let confidence = substormState.confidence * 100;

    // Determine activity window based on phase
    switch (substormState.phase) {
      case "quiet":
        // Check if conditions are building
        if (solarWind && solarWind.bz < -3) {
          // Southward Bz - activity possible in 1-2 hours
          activityStart = new Date(now.getTime() + 60 * 60 * 1000);
          activityEnd = new Date(activityStart.getTime() + 90 * 60 * 1000);
          confidence = 30;
        }
        break;

      case "growth":
        if (substormState.estimatedTimeToOnset) {
          activityStart = new Date(now.getTime() + substormState.estimatedTimeToOnset * 60 * 1000);
          activityEnd = new Date(activityStart.getTime() + 90 * 60 * 1000);
        }
        break;

      case "onset":
      case "expansion":
        activityStart = now;
        activityEnd = substormState.expectedRecoveryStart
          ? new Date(substormState.expectedRecoveryStart.getTime() + 30 * 60 * 1000)
          : new Date(now.getTime() + 60 * 60 * 1000);
        break;

      case "recovery":
        activityStart = now;
        activityEnd = new Date(now.getTime() + 30 * 60 * 1000);
        confidence = Math.max(20, confidence - 30);
        break;
    }

    if (!activityStart || !activityEnd) {
      return {
        shouldGo: false,
        reason: "No significant activity expected",
        activityWindow: null,
        leaveBy: null,
        countdown: null,
        confidence: 0,
      };
    }

    // Calculate when to leave
    const leaveBy = new Date(activityStart.getTime() - driveTimeMs - bufferTimeMs);
    const countdownMs = leaveBy.getTime() - now.getTime();
    const countdownMinutes = Math.max(0, Math.floor(countdownMs / 60000));

    // Check cloud cover for selected site
    const siteCloud = cloudCover.get(selectedSite.name);
    const cloudPenalty = siteCloud ? Math.max(0, (siteCloud.cloudCover - 30) / 2) : 0;
    const adjustedConfidence = Math.max(0, confidence - cloudPenalty);

    // Decision logic
    const shouldGo =
      adjustedConfidence >= 40 &&
      countdownMinutes > -30 && // Haven't missed the window by more than 30 min
      (substormState.phase !== "quiet" || (solarWind && solarWind.bz < -3));

    let reason = "";
    if (substormState.phase === "expansion" || substormState.phase === "onset") {
      reason = "Activity happening NOW - leave immediately!";
    } else if (substormState.phase === "growth") {
      reason = countdownMinutes > 0
        ? `Activity expected in ~${substormState.estimatedTimeToOnset} min`
        : "Activity imminent - should already be there";
    } else if (substormState.phase === "recovery") {
      reason = "Activity fading but may still catch aurora";
    } else if (solarWind && solarWind.bz < -3) {
      reason = "Bz southward - conditions building";
    } else {
      reason = "Conditions quiet - not recommended";
    }

    return {
      shouldGo,
      reason,
      activityWindow: { start: activityStart, end: activityEnd },
      leaveBy: countdownMinutes >= 0 ? leaveBy : null,
      countdown: countdownMinutes,
      confidence: Math.round(adjustedConfidence),
    };
  }, [substormState, selectedSite, solarWind, cloudCover]);

  // Handle reminder
  const handleSetReminder = async () => {
    if (!chaseDecision?.leaveBy) return;

    let perm = permission;
    if (perm === "default") {
      perm = await requestPermission();
    }

    if (perm !== "granted") {
      alert("Please enable notifications to set reminders");
      return;
    }

    // Schedule reminder 15 minutes before leave time
    const reminderTime = chaseDecision.leaveBy.getTime() - 15 * 60 * 1000 - Date.now();
    if (reminderTime <= 0) {
      alert("Not enough time to set a reminder - you should leave soon!");
      return;
    }

    const timeoutId = scheduleReminder(
      "🚗 Time to head out!",
      `Aurora activity expected in ${Math.round((chaseDecision.countdown || 0) + 15)} minutes. Head to ${selectedSite?.name} now!`,
      reminderTime
    );

    if (timeoutId) {
      setReminderTimeoutId(timeoutId);
      setReminderSet(true);
    }
  };

  const handleCancelReminder = () => {
    if (reminderTimeoutId) {
      cancelReminder(reminderTimeoutId);
      setReminderTimeoutId(null);
      setReminderSet(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getCloudCoverColor = (cloudPercent: number) => {
    if (cloudPercent < 20) return "text-green-400";
    if (cloudPercent < 50) return "text-yellow-400";
    return "text-red-400";
  };

  if (isLoading || isLoadingLocation) {
    return (
      <div className={`bg-white/5 rounded-xl p-6 border border-white/10 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-20 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (nearestSites.length === 0) {
    return (
      <div className={`bg-white/5 rounded-xl p-6 border border-white/10 ${className}`}>
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">No dark sky sites found nearby</p>
          <p className="text-sm">Try the Trip tab to explore destinations further away</p>
        </div>
      </div>
    );
  }

  const decision = chaseDecision;
  const isUrgent = substormState?.phase === "expansion" || substormState?.phase === "onset";

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      {/* Decision Header */}
      <div className={`p-4 ${
        isUrgent
          ? "bg-gradient-to-r from-green-900/80 to-emerald-900/80 border-b border-green-500/30"
          : decision?.shouldGo
          ? "bg-gradient-to-r from-yellow-900/60 to-amber-900/60 border-b border-yellow-500/30"
          : "bg-gradient-to-r from-gray-800/60 to-slate-800/60 border-b border-white/10"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🚗</span>
            <span>Chase Decision</span>
          </h3>
          {decision && (
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              decision.confidence >= 60 ? "bg-green-500/20 text-green-400" :
              decision.confidence >= 40 ? "bg-yellow-500/20 text-yellow-400" :
              "bg-gray-500/20 text-gray-400"
            }`}>
              {decision.confidence}% confidence
            </span>
          )}
        </div>

        <p className={`text-sm ${isUrgent ? "text-green-200" : "text-gray-300"}`}>
          {decision?.reason || "Analyzing conditions..."}
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white/5 p-4 border-x border-b border-white/10 space-y-4">
        {/* Activity Window */}
        {decision?.activityWindow && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Activity Window</div>
            <div className="text-xl font-bold text-white">
              {formatTime(decision.activityWindow.start)} - {formatTime(decision.activityWindow.end)}
            </div>
            {isUrgent && (
              <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Happening NOW
              </div>
            )}
          </div>
        )}

        {/* Selected Site */}
        {selectedSite && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs text-gray-400 mb-1">Suggested Destination</div>
                <div className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>{getCountryFlag(selectedSite.countryCode)}</span>
                  <span>{selectedSite.name}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const nextIndex = nearestSites.indexOf(selectedSite) + 1;
                  setSelectedSite(nearestSites[nextIndex % nearestSites.length]);
                }}
                className="text-xs text-aurora-green hover:underline"
              >
                Change →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-gray-500 text-xs">Distance</div>
                <div className="text-white">{selectedSite.distanceKm} km</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Drive Time</div>
                <div className="text-white">{formatDriveTime(selectedSite.driveTimeMinutes)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Darkness</div>
                <div style={{ color: getBortleColor(selectedSite.bortleClass) }}>
                  Bortle {selectedSite.bortleClass}
                </div>
              </div>
            </div>

            {/* Cloud Cover */}
            {cloudCover.has(selectedSite.name) && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Cloud Cover</span>
                  <span className={`text-sm font-medium ${getCloudCoverColor(cloudCover.get(selectedSite.name)!.cloudCover)}`}>
                    {cloudCover.get(selectedSite.name)!.cloudCover}% ☁️
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 capitalize">
                  {cloudCover.get(selectedSite.name)!.description}
                </div>
              </div>
            )}
            {isLoadingCloud && !cloudCover.has(selectedSite.name) && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="text-xs text-gray-500">Loading cloud cover...</div>
              </div>
            )}
          </div>
        )}

        {/* Leave By / Countdown */}
        {decision?.leaveBy && decision.countdown !== null && decision.countdown >= 0 && (
          <div className={`rounded-lg p-3 ${
            decision.countdown <= 30
              ? "bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-500/30"
              : "bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Leave By</div>
                <div className="text-2xl font-bold text-white">
                  {formatTime(decision.leaveBy)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Countdown</div>
                <div className={`text-2xl font-bold ${decision.countdown <= 30 ? "text-orange-400" : "text-purple-400"}`}>
                  {decision.countdown} min
                </div>
              </div>
            </div>

            {/* Reminder Button */}
            <div className="mt-3">
              {reminderSet ? (
                <button
                  onClick={handleCancelReminder}
                  className="w-full py-2 px-4 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600 transition-colors"
                >
                  Cancel Reminder ✓
                </button>
              ) : (
                <button
                  onClick={handleSetReminder}
                  className="w-full py-2 px-4 rounded-lg bg-aurora-green text-black text-sm font-medium hover:bg-aurora-green/90 transition-colors"
                >
                  🔔 Set Reminder (15 min before)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Immediate Action for Urgent Situations */}
        {isUrgent && (
          <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
            <div className="text-green-400 font-semibold mb-1">⚡ GO NOW!</div>
            <div className="text-sm text-green-200">
              Aurora activity is happening right now. Head to your dark site immediately for best viewing!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
