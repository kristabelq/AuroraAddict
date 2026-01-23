"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TimeHeader from "@/components/TimeHeader";

interface CMEData {
  activityID: string;
  startTime: string;
  sourceLocation?: string;
  note?: string;
  linkedEvents?: Array<{ activityID: string }>;
  cmeAnalyses?: Array<{
    time21_5?: string;
    latitude?: number;
    longitude?: number;
    halfAngle?: number;
    speed?: number;
    type?: string;
    isMostAccurate?: boolean;
    note?: string;
    enlilList?: Array<{
      estimatedShockArrivalTime?: string;
      estimatedDuration?: number;
      kpIndex?: number;
    }>;
  }>;
}

export default function CMEAlertsPage() {
  const router = useRouter();
  const [cmeList, setCmeList] = useState<CMEData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchCMEData();
    // Refresh every 30 minutes
    const interval = setInterval(fetchCMEData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCMEData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const formatDate = (date: Date) => {
        return date.toISOString().split("T")[0];
      };

      const response = await fetch(
        `https://api.nasa.gov/DONKI/CME?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=NIXvIqoTvk1qIplmptffaH4sQYgTnlDD6bH4kIYM`
      );

      if (response.ok) {
        const data = await response.json();
        setCmeList(data || []);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching CME data:", error);
      setLoading(false);
    }
  };

  const getCMEType = (halfAngle?: number, type?: string): string => {
    if (type?.toLowerCase().includes("s")) return "Full Halo";
    if (halfAngle && halfAngle >= 180) return "Full Halo";
    if (halfAngle && halfAngle >= 90) return "Partial Halo";
    if (halfAngle && halfAngle >= 60) return "Wide CME";
    return "Narrow CME";
  };

  const isEarthDirected = (
    latitude?: number,
    longitude?: number,
    type?: string,
    enlilList?: any[]
  ): boolean => {
    if (type?.toLowerCase().includes("s")) return true;
    if (enlilList && enlilList.length > 0) return true;
    if (latitude !== undefined && longitude !== undefined) {
      return Math.abs(latitude) <= 30 && Math.abs(longitude) <= 30;
    }
    return false;
  };

  const getSpeedColor = (speed?: number) => {
    // Traffic light system: Green = Good for aurora (fast), Yellow = Moderate, Red = Poor (slow)
    if (!speed) return "#666666";
    if (speed >= 500) return "#22c55e"; // Green - good for aurora
    if (speed >= 400) return "#eab308"; // Yellow - moderate
    return "#ef4444"; // Red - poor for aurora
  };

  const getSpeedCategory = (speed?: number): string => {
    if (!speed) return "Unknown";
    if (speed >= 1200) return "Extremely Fast";
    if (speed >= 700) return "Fast";
    if (speed >= 400) return "Moderate";
    return "Slow";
  };

  const getExpectedKp = (speed?: number): string => {
    if (!speed) return "N/A";
    if (speed >= 1000) return "7-9";
    if (speed >= 700) return "5-7";
    if (speed >= 500) return "4-6";
    return "3-5";
  };

  const getAuroraLatitude = (speed?: number): string => {
    if (!speed) return "N/A";
    if (speed >= 1000) return "40-50°N";
    if (speed >= 700) return "50-55°N";
    if (speed >= 500) return "55-60°N";
    return "60-65°N";
  };

  const getTravelTime = (speed?: number): string => {
    if (!speed) return "Unknown";
    const hours = (150000000 / speed) / 3600; // Distance to Earth / speed
    if (hours < 24) return `${Math.round(hours)} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  const getEstimatedArrival = (startTime: string, speed?: number): Date | null => {
    if (!speed) return null;
    const detectionTime = new Date(startTime);
    const travelTimeHours = (150000000 / speed) / 3600;
    return new Date(detectionTime.getTime() + travelTimeHours * 60 * 60 * 1000);
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getTimeSince = (timeString: string) => {
    const then = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const getTimeOfDayEmoji = (date: Date): string => {
    const hour = date.getHours();

    // Night: 8 PM - 6 AM (20:00 - 06:00)
    if (hour >= 20 || hour < 6) return "🌙";

    // Morning twilight: 6 AM - 8 AM (06:00 - 08:00)
    if (hour >= 6 && hour < 8) return "🌅";

    // Day: 8 AM - 6 PM (08:00 - 18:00)
    if (hour >= 8 && hour < 18) return "☀️";

    // Evening twilight: 6 PM - 8 PM (18:00 - 20:00)
    return "🌆";
  };

  // Filter for Earth-directed CMEs and sort by latest first
  const earthDirectedCMEs = cmeList
    .filter((cme) => {
      if (cme.cmeAnalyses && cme.cmeAnalyses.length > 0) {
        const analysis = cme.cmeAnalyses.find((a) => a.isMostAccurate) || cme.cmeAnalyses[0];
        return isEarthDirected(
          analysis.latitude,
          analysis.longitude,
          analysis.type,
          analysis.enlilList
        );
      }
      return false;
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      {/* Header with Back Button */}
      <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 sticky top-[45px] z-50">
        <div className="max-w-screen-lg mx-auto p-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/intelligence?tab=cosmic")}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="font-medium">Back to Aurora Forecast</span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">☄️</span>
                CME Alerts
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Coronal Mass Ejections from NASA DONKI Database
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Last updated</div>
              <div className="text-sm text-gray-400">{formatTime(lastUpdate.toISOString())}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-xl text-white">Loading CME data...</div>
          </div>
        ) : (
          <>
            {/* What is a CME? */}
            <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-3xl">💡</span>
                What is a CME?
              </h2>
              <p className="text-gray-200 mb-3">
                A <strong>Coronal Mass Ejection (CME)</strong> is a massive burst of solar plasma and magnetic field ejected from the Sun's corona. CMEs contain billions of tons of material traveling at speeds up to 3,000 km/s.
              </p>
              <p className="text-gray-200">
                <span className="text-aurora-green font-semibold">Why CMEs matter:</span> CMEs are the #1 cause of the strongest, most spectacular aurora displays. They can trigger geomagnetic storms lasting hours to days.
              </p>
            </div>

            {/* Earth-Directed CMEs (Past 7 Days) */}
            {earthDirectedCMEs.length > 0 ? (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-red-500">🎯</span>
                  Earth-Directed CMEs (Last 7 Days)
                </h2>
                <div className="space-y-4">
                  {earthDirectedCMEs.map((cme, index) => {
                    const analysis = cme.cmeAnalyses?.find((a) => a.isMostAccurate) || cme.cmeAnalyses?.[0];
                    const speed = analysis?.speed || 0;
                    const cmeType = getCMEType(analysis?.halfAngle, analysis?.type);
                    const arrivalTime = analysis?.enlilList?.[0]?.estimatedShockArrivalTime;
                    const estimatedArrival = getEstimatedArrival(cme.startTime, speed);

                    return (
                      <div
                        key={cme.activityID}
                        className="bg-white/5 rounded-lg p-4 border border-red-500/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-2xl font-bold text-white">
                                {cmeType}
                              </div>
                              {speed >= 700 && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                                  HIGH PRIORITY
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              Detected: {formatTime(cme.startTime)} ({getTimeSince(cme.startTime)})
                            </div>
                            {estimatedArrival && (
                              <div className="text-sm text-aurora-green font-medium">
                                Estimated Arrival: {formatTime(estimatedArrival.toISOString())} {getTimeOfDayEmoji(estimatedArrival)}
                              </div>
                            )}
                            {speed >= 700 && (
                              <div className="flex items-center gap-2 text-sm text-yellow-300 mt-1">
                                <span>⚠️</span>
                                <span>Plan aurora hunt for arrival window!</span>
                              </div>
                            )}
                            {cme.sourceLocation && (
                              <div className="text-sm text-gray-400">
                                Source: {cme.sourceLocation}
                              </div>
                            )}
                          </div>
                          {speed >= 700 && (
                            <button
                              onClick={() => router.push("/createhunt")}
                              className="px-4 py-2 bg-aurora-green text-black rounded-lg font-semibold hover:bg-aurora-green/80 transition-colors flex items-center gap-2 flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Plan Hunt
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Speed</div>
                            <div
                              className="text-xl font-bold"
                              style={{ color: getSpeedColor(speed) }}
                            >
                              {speed} km/s
                            </div>
                            <div className="text-xs text-gray-400">{getSpeedCategory(speed)}</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 mb-1">Travel Time</div>
                            <div className="text-xl font-bold text-white">{getTravelTime(speed)}</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 mb-1">Expected Kp</div>
                            <div className="text-xl font-bold text-yellow-400">{getExpectedKp(speed)}</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 mb-1">Visible To</div>
                            <div className="text-xl font-bold text-white">{getAuroraLatitude(speed)}</div>
                          </div>
                        </div>

                        {arrivalTime && (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">📅</span>
                              <div>
                                <div className="text-sm text-gray-400">Predicted Arrival</div>
                                <div className="text-lg font-bold text-white">
                                  {formatTime(arrivalTime)} {getTimeOfDayEmoji(new Date(arrivalTime))}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Uncertainty: ±12 hours
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {analysis?.halfAngle && (
                          <div className="text-xs text-gray-400 mb-2">
                            Angular Width: {analysis.halfAngle}° ({analysis.halfAngle >= 180 ? "Full Halo" : analysis.halfAngle >= 90 ? "Wide" : "Narrow"})
                          </div>
                        )}

                        {cme.note && (
                          <div className="text-sm text-gray-300 bg-white/5 rounded p-2">
                            {cme.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
                <div className="text-6xl mb-3">✅</div>
                <h2 className="text-2xl font-bold text-white mb-2">No Earth-Directed CMEs</h2>
                <p className="text-gray-400">
                  No Earth-directed CMEs detected in the last 7 days. Check back regularly for updates.
                </p>
              </div>
            )}

            {/* All Recent CMEs */}
            {cmeList.length > earthDirectedCMEs.length && (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">Other Recent CMEs (Non Earth-Directed)</h2>
                <div className="space-y-2">
                  {cmeList
                    .filter((cme) => !earthDirectedCMEs.includes(cme))
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 10)
                    .map((cme) => {
                      const analysis = cme.cmeAnalyses?.find((a) => a.isMostAccurate) || cme.cmeAnalyses?.[0];
                      const speed = analysis?.speed || 0;
                      const estimatedArrival = getEstimatedArrival(cme.startTime, speed);

                      return (
                        <div
                          key={cme.activityID}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium">{formatTime(cme.startTime)}</div>
                            <div className="text-sm text-gray-400">
                              {cme.sourceLocation || "Source unknown"} • {getCMEType(analysis?.halfAngle, analysis?.type)}
                            </div>
                            {estimatedArrival && (
                              <div className="text-xs text-aurora-green/80 mt-1">
                                Est. Arrival: {formatTime(estimatedArrival.toISOString())} {getTimeOfDayEmoji(estimatedArrival)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">{speed || "N/A"} km/s</div>
                            <div className="text-xs text-gray-400">{getTimeSince(cme.startTime)}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Critical CME Parameters Guide */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-white mb-3 text-lg">Critical CME Parameters for Aurora Hunters:</p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">🎯 Direction:</span> Full Halo CMEs are directly Earth-facing (70-90% impact probability). Partial halos may graze Earth (30-60% impact).
                  </p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">⚡ Speed:</span> <strong>&gt;700 km/s = Plan hunt!</strong> • 500-700 km/s: Strong aurora (Kp 5-7) • &gt;1000 km/s: Major storm (Kp 7-8)
                  </p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">📅 Arrival Time:</span> Typical travel time: 1-3 days (±12 hour uncertainty). Be ready 12 hours before and stay alert 24 hours after predicted arrival.
                  </p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">🧲 Bz Component:</span> The make-or-break factor! CME Bz south (negative) = Strong aurora. CME Bz north (positive) = Weak aurora (despite powerful CME). Cannot be predicted until 1 hour before Earth impact.
                  </p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">🌟 Associated Flare:</span> X-class or strong M-class flares often produce fast CMEs. Check for CME in coronagraph images 20-60 minutes after major flares.
                  </p>

                  <p className="text-yellow-300 font-semibold mt-4">
                    ⚠️ Remember: The most powerful CME can produce disappointing aurora if Bz stays north. Always monitor real-time Bz when CME arrives!
                  </p>
                </div>
              </div>
            </div>

            {/* Best Case Scenario */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>🏆</span>
                Best Case Scenario (Epic Aurora):
              </h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>✓ Full halo CME (Earth-directed)</li>
                <li>✓ Speed: &gt;1000 km/s (FAST!)</li>
                <li>✓ Mass: &gt;5 billion tons (Large)</li>
                <li>✓ Source: Central disk (±15° longitude)</li>
                <li>✓ Associated: X-class flare</li>
                <li>✓ Bz rotates strongly south (-20+ nT)</li>
                <li className="text-green-300 font-semibold pt-2">→ Result: Kp 8-9, aurora visible to 40-50°N, multi-colored displays, 2-3 nights of activity</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
