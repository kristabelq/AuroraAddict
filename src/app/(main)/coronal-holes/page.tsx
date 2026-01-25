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
  const [selectedSdoChannel, setSelectedSdoChannel] = useState<string>("0193"); // Default to AIA 193 for coronal holes
  const [sdoImageKey, setSdoImageKey] = useState(Date.now());

  // SDO image channels - All available from AIA 193 to HMI Dopplergram
  const sdoChannels = [
    { id: "0193", name: "AIA 193", desc: "Corona & hot flare plasma", temp: "1.5 million K", best: true },
    { id: "0211", name: "AIA 211", desc: "Active regions & corona", temp: "2 million K" },
    { id: "0171", name: "AIA 171", desc: "Quiet corona & coronal loops", temp: "1 million K" },
    { id: "0304", name: "AIA 304", desc: "Chromosphere - Best for flares", temp: "50,000 K" },
    { id: "0131", name: "AIA 131", desc: "Flare plasma & hot active regions", temp: "10 million K" },
    { id: "0335", name: "AIA 335", desc: "Active regions & coronal plasma", temp: "2.5 million K" },
    { id: "0094", name: "AIA 094", desc: "Hot corona & flare regions", temp: "6.3 million K" },
    { id: "1600", name: "AIA 1600", desc: "Upper photosphere & transition region", temp: "10,000 K" },
    { id: "1700", name: "AIA 1700", desc: "Photosphere - Surface temperature", temp: "4,500 K" },
    { id: "HMIIC", name: "HMI Intensitygram", desc: "Visible light - Sunspots", temp: "Surface" },
    { id: "HMIB", name: "HMI Magnetogram", desc: "Magnetic field polarity", temp: "Surface" },
    { id: "HMID", name: "HMI Dopplergram", desc: "Surface velocity & rotation", temp: "Surface" },
  ];

  useEffect(() => {
    fetchHSSData();
    // Refresh HSS data every 30 minutes
    const interval = setInterval(() => {
      fetchHSSData();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh SDO images every 5 minutes
  useEffect(() => {
    const sdoInterval = setInterval(() => {
      setSdoImageKey(Date.now());
    }, 5 * 60 * 1000);
    return () => clearInterval(sdoInterval);
  }, []);

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
              <span className="font-medium">Back to Aurora Forecast</span>
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

            {/* Live Sun View - SDO Images */}
            <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-lg rounded-2xl border border-orange-500/30 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 p-4 border-b border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">☀️</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">Live Sun View</h2>
                      <p className="text-sm text-orange-200">NASA Solar Dynamics Observatory (SDO) - Updated every 15 minutes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSdoImageKey(Date.now())}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="p-4">
                {/* Coronal hole tip */}
                <div className="mb-4 bg-violet-500/20 border border-violet-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-lg">💡</span>
                    <div className="text-violet-200">
                      <strong>Tip:</strong> Coronal holes appear as <strong>dark regions</strong> in AIA 193 and AIA 211.
                      These dark areas are where high-speed solar wind escapes into space!
                    </div>
                  </div>
                </div>

                {/* Channel dropdown selector */}
                <div className="mb-4">
                  <select
                    value={selectedSdoChannel}
                    onChange={(e) => setSelectedSdoChannel(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                  >
                    {sdoChannels.map((channel) => (
                      <option key={channel.id} value={channel.id} className="bg-gray-900 text-white">
                        {channel.name} - {channel.desc} {channel.best ? "(Best for Coronal Holes)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected channel info */}
                <div className="mb-4 text-center">
                  <div className="text-lg font-semibold text-white">
                    {sdoChannels.find(c => c.id === selectedSdoChannel)?.name}
                    {sdoChannels.find(c => c.id === selectedSdoChannel)?.best && (
                      <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Best for Coronal Holes</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {sdoChannels.find(c => c.id === selectedSdoChannel)?.desc} • {sdoChannels.find(c => c.id === selectedSdoChannel)?.temp}
                  </div>
                </div>

                {/* SDO Image with Navigation Arrows */}
                <div className="relative max-w-2xl mx-auto">
                  {/* Left Arrow */}
                  <button
                    onClick={() => {
                      const currentIndex = sdoChannels.findIndex(c => c.id === selectedSdoChannel);
                      const prevIndex = currentIndex === 0 ? sdoChannels.length - 1 : currentIndex - 1;
                      setSelectedSdoChannel(sdoChannels[prevIndex].id);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Image */}
                  <div className="aspect-square bg-black rounded-xl overflow-hidden">
                    <img
                      key={sdoImageKey + selectedSdoChannel}
                      src={`https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_${selectedSdoChannel}.jpg?t=${sdoImageKey}`}
                      alt={`Sun - ${sdoChannels.find(c => c.id === selectedSdoChannel)?.name}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/sun-placeholder.png";
                      }}
                    />
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => {
                      const currentIndex = sdoChannels.findIndex(c => c.id === selectedSdoChannel);
                      const nextIndex = currentIndex === sdoChannels.length - 1 ? 0 : currentIndex + 1;
                      setSelectedSdoChannel(sdoChannels[nextIndex].id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Live indicator */}
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">LIVE</span>
                      <span className="text-gray-400 text-xs">• NASA SDO</span>
                    </div>
                  </div>

                  {/* Image counter */}
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-white text-sm">
                      {sdoChannels.findIndex(c => c.id === selectedSdoChannel) + 1} / {sdoChannels.length}
                    </span>
                  </div>
                </div>

                {/* Dot indicators */}
                <div className="mt-4 flex justify-center gap-1.5">
                  {sdoChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedSdoChannel(channel.id)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedSdoChannel === channel.id
                          ? "bg-orange-500 w-4"
                          : "bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>

                {/* Link to SolarHam */}
                <div className="mt-4 text-center">
                  <a
                    href="https://solarham.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-orange-300 hover:text-orange-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    More solar data on SolarHam.net
                  </a>
                </div>
              </div>
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

          </>
        )}
      </div>
    </div>
  );
}
