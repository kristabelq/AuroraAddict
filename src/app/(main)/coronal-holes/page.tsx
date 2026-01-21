"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TimeHeader from "@/components/TimeHeader";

interface HSSData {
  hssID: string;
  eventTime: string;
  instruments?: Array<{ displayName: string }>;
  linkedEvents?: Array<{ activityID: string }>;
  note?: string;
}

export default function CoronalHolesPage() {
  const router = useRouter();
  const [hssList, setHssList] = useState<HSSData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [solarImageUrl, setSolarImageUrl] = useState<string>("");

  useEffect(() => {
    fetchHSSData();
    fetchSolarImage();
    // Refresh every 30 minutes
    const interval = setInterval(() => {
      fetchHSSData();
      fetchSolarImage();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSolarImage = async () => {
    try {
      // Use Helioviewer API to get latest SDO/AIA 193 image (best for coronal holes)
      // Documentation: https://api.helioviewer.org/docs/v2/
      const imageUrl = `https://api.helioviewer.org/v2/getJP2Image/?` +
        `date=${new Date().toISOString().split('.')[0]}Z` +
        `&sourceId=8` + // SDO/AIA 193 Å - best wavelength for coronal holes
        `&display=true`;

      setSolarImageUrl(imageUrl);
    } catch (error) {
      console.error("Error fetching solar image:", error);
    }
  };

  const fetchHSSData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Get last 30 days to show pattern

      const formatDate = (date: Date) => {
        return date.toISOString().split("T")[0];
      };

      const response = await fetch(
        `https://api.nasa.gov/DONKI/HSS?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=NIXvIqoTvk1qIplmptffaH4sQYgTnlDD6bH4kIYM`
      );

      if (response.ok) {
        const data = await response.json();
        setHssList(data || []);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching HSS data:", error);
      setLoading(false);
    }
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
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
  };

  const getTimeUntil = (timeString: string) => {
    const then = new Date(timeString);
    const now = new Date();
    const diffMs = then.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    if (diffMs > 0) return "arriving soon";
    return getTimeSince(timeString);
  };

  const getHSSStatus = (timeString: string): "upcoming" | "active" | "past" => {
    const eventDate = new Date(timeString);
    const now = new Date();
    const diffDays = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return "upcoming";
    if (diffDays >= -3) return "active"; // HSS effects last 2-5 days
    return "past";
  };

  const getStatusColor = (status: "upcoming" | "active" | "past") => {
    if (status === "upcoming") return "#ffaa00";
    if (status === "active") return "#00ff00";
    return "#666666";
  };

  const getExpectedKp = () => "4-6";

  const upcomingHSS = hssList.filter((hss) => getHSSStatus(hss.eventTime) === "upcoming");
  const activeHSS = hssList.filter((hss) => getHSSStatus(hss.eventTime) === "active");

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
              <span className="font-medium">Back to Cosmic Intel</span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">🕳️</span>
                Coronal Holes
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                High Speed Stream (HSS) Tracking from NASA DONKI Database
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
            <div className="text-xl text-white">Loading coronal hole data...</div>
          </div>
        ) : (
          <>
            {/* Latest Solar Image */}
            {solarImageUrl && (
              <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/30">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-3xl">☀️</span>
                  Latest Sun Image - Coronal Holes Visible as Dark Regions
                </h2>
                <a
                  href="https://solarham.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-black rounded-xl overflow-hidden mb-3 cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
                >
                  <img
                    src={solarImageUrl}
                    alt="Latest Sun image from SDO/AIA 193Å showing coronal holes"
                    className="w-full h-auto"
                    onError={(e) => {
                      // Fallback if Helioviewer API has issues
                      (e.target as HTMLImageElement).src = "https://soho.nascom.nasa.gov/data/realtime/eit_195/1024/latest.jpg";
                    }}
                  />
                </a>
                <p className="text-xs text-gray-400 italic">
                  Image from NASA Solar Dynamics Observatory (SDO) at 193 Angstroms wavelength.
                  Coronal holes appear as dark areas. Updates every 30 minutes. Click for more data on SolarHam.net
                </p>
              </div>
            )}

            {/* What is a Coronal Hole? */}
            <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 backdrop-blur-lg rounded-2xl p-6 border border-violet-500/30">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-3xl">💡</span>
                What are Coronal Holes?
              </h2>
              <p className="text-gray-200 mb-3">
                <strong>Coronal holes</strong> are areas on the Sun where the magnetic field opens up into space, allowing solar wind to escape at high speed. These regions <strong>appear as dark areas</strong> in extreme ultraviolet and X-ray images of the Sun (see image above).
              </p>
              <p className="text-gray-200 mb-3">
                When coronal holes face Earth, they send <strong>High Speed Streams (HSS)</strong> of solar wind our way, traveling at 500-800 km/s - much faster than normal solar wind.
              </p>
              <p className="text-gray-200">
                <span className="text-aurora-green font-semibold">Why they matter for aurora hunting:</span> Coronal holes produce predictable, moderate aurora activity (Kp 4-6) lasting 2-5 days. Perfect for planning multi-day aurora photography trips!
              </p>
            </div>

            {/* Active/Upcoming HSS Events */}
            {(activeHSS.length > 0 || upcomingHSS.length > 0) ? (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-green-500">🎯</span>
                  Active & Upcoming High Speed Streams
                </h2>

                {activeHSS.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-400 mb-3">Currently Active</h3>
                    <div className="space-y-3">
                      {activeHSS.map((hss) => (
                        <div
                          key={hss.hssID}
                          className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="text-xl font-bold text-green-400">HSS Active Now</div>
                                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                  GO HUNT
                                </span>
                              </div>
                              <div className="text-sm text-gray-400">
                                Started: {formatTime(hss.eventTime)} ({getTimeSince(hss.eventTime)})
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Expected Kp</div>
                              <div className="text-xl font-bold text-yellow-400">{getExpectedKp()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Duration</div>
                              <div className="text-xl font-bold text-white">2-5 days</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Type</div>
                              <div className="text-xl font-bold text-white">Moderate</div>
                            </div>
                          </div>

                          {hss.note && (
                            <div className="text-sm text-gray-300 bg-white/5 rounded p-2 mb-2">
                              {hss.note}
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-center gap-2 text-sm text-green-300">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Great conditions for aurora photography over the next few days!</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {upcomingHSS.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-400 mb-3">Upcoming</h3>
                    <div className="space-y-3">
                      {upcomingHSS.map((hss) => (
                        <div
                          key={hss.hssID}
                          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-xl font-bold text-yellow-400">HSS Approaching</div>
                              <div className="text-sm text-gray-400">
                                Expected: {formatTime(hss.eventTime)} ({getTimeUntil(hss.eventTime)})
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Expected Kp</div>
                              <div className="text-xl font-bold text-yellow-400">{getExpectedKp()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Duration</div>
                              <div className="text-xl font-bold text-white">2-5 days</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Type</div>
                              <div className="text-xl font-bold text-white">Moderate</div>
                            </div>
                          </div>

                          {hss.note && (
                            <div className="text-sm text-gray-300 bg-white/5 rounded p-2">
                              {hss.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
                <div className="text-6xl mb-3">📅</div>
                <h2 className="text-2xl font-bold text-white mb-2">No Active HSS Events</h2>
                <p className="text-gray-400">
                  No high speed streams detected in the near future. Check back in a few days!
                </p>
              </div>
            )}

            {/* Predicted Next HSS */}
            {hssList.length > 0 && (() => {
              // Calculate predicted next HSS based on most recent event + 27 days
              const sortedEvents = [...hssList].sort((a, b) =>
                new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
              );
              const mostRecentEvent = sortedEvents[0];
              const mostRecentDate = new Date(mostRecentEvent.eventTime);
              const predictedDate = new Date(mostRecentDate);
              predictedDate.setDate(predictedDate.getDate() + 27);

              // Calculate date range (±2 days for prediction uncertainty)
              const rangeStart = new Date(predictedDate);
              rangeStart.setDate(rangeStart.getDate() - 2);
              const rangeEnd = new Date(predictedDate);
              rangeEnd.setDate(rangeEnd.getDate() + 2);

              const formatPredictionDate = (date: Date) => {
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });
              };

              const isPredictionFuture = predictedDate.getTime() > new Date().getTime();

              return isPredictionFuture ? (
                <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🔮</span>
                    Predicted Next HSS Event
                  </h2>
                  <div className="bg-white/10 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Expected Date Range</div>
                        <div className="text-xl font-bold text-purple-300">
                          {formatPredictionDate(rangeStart)} - {formatPredictionDate(rangeEnd)}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Peak: {formatPredictionDate(predictedDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Expected Kp</div>
                        <div className="text-2xl font-bold text-yellow-400">4-6</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 bg-white/10 rounded p-3">
                      <span className="font-semibold text-purple-300">📊 Based on 27-day solar rotation cycle</span>
                      <br />
                      Previous HSS: {formatTime(mostRecentEvent.eventTime)}
                      <br />
                      <span className="text-gray-400 text-xs mt-1 block">
                        * Prediction accuracy ±2 days. Coronal holes may evolve, merge, or dissipate between rotations.
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Recent HSS History (Last 30 Days) */}
            {hssList.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">Recent HSS Events (Last 30 Days)</h2>
                <div className="space-y-2">
                  {[...hssList].sort((a, b) =>
                    new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
                  ).slice(0, 15).map((hss) => {
                    const status = getHSSStatus(hss.eventTime);
                    return (
                      <div
                        key={hss.hssID}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getStatusColor(status) }}
                            />
                            <div>
                              <div className="text-white font-medium">{formatTime(hss.eventTime)}</div>
                              <div className="text-sm text-gray-400 capitalize">{status}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{getTimeUntil(hss.eventTime)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coronal Hole Characteristics */}
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
                  <p className="font-semibold text-white mb-3 text-lg">Coronal Hole Characteristics:</p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">🔄 Predictable Pattern:</span> Coronal holes rotate with the Sun (~27-day cycle). If a coronal hole causes auroras today, expect similar activity in approximately 27 days when it faces Earth again!
                  </p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">⏱️ Duration:</span> HSS effects typically last 2-5 days, giving you multiple nights to hunt auroras. Much longer than CME-driven storms which often last just one night.
                  </p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">📊 Intensity:</span> Usually produces Kp 4-6 aurora activity. Not as intense as major CME storms, but reliable and consistent. Perfect for mid-to-high latitude viewing.
                  </p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">🎯 Planning Advantage:</span> The predictability makes coronal holes ideal for planning multi-day aurora photography trips weeks in advance!
                  </p>

                  <p className="mb-2">
                    <span className="text-aurora-green font-semibold">🌬️ Speed:</span> HSS travels at 500-800 km/s - faster than normal solar wind (300-400 km/s) but slower than fast CMEs (&gt;1000 km/s).
                  </p>

                  <p className="text-yellow-300 font-semibold mt-4">
                    💡 Pro Tip: Track HSS patterns! If you see strong aurora from a coronal hole today, mark your calendar for ~27 days from now for a potential repeat performance.
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison: Coronal Holes vs CMEs */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Coronal Holes vs CMEs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-violet-300 mb-3">🕳️ Coronal Holes (HSS)</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Predictable ~27-day cycle</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Lasts 2-5 days (multiple nights)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Kp 4-6 (moderate, reliable)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Great for planning trips</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Consistent performance</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-red-300 mb-3">☄️ CMEs</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>Unpredictable (no cycle)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>Usually lasts 6-24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>Kp 5-9 (can be extreme)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>Short notice (1-3 days)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>Performance varies (Bz dependent)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Best Strategy */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>🎯</span>
                Best Strategy for Aurora Hunting:
              </h3>
              <p className="text-sm text-gray-300">
                <strong className="text-green-400">Plan your trips around coronal holes</strong> (predictable, multi-day events), but stay flexible for CME alerts (shorter notice, potentially more spectacular). This gives you the best of both worlds: reliable aurora activity with a chance for extraordinary displays!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
