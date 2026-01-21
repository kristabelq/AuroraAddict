"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TimeHeader from "@/components/TimeHeader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Dot } from 'recharts';

interface FlareData {
  time: string;
  class: string;
  intensity: number;
  flux: number;
}

interface ChartDataPoint {
  timestamp: number;
  time: string;
  flux: number;
  class: string;
  isMajor: boolean; // M or X class
}

export default function SolarFlaresPage() {
  const router = useRouter();
  const [currentFlare, setCurrentFlare] = useState<FlareData | null>(null);
  const [flareHistory, setFlareHistory] = useState<FlareData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSolarFlareData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSolarFlareData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSolarFlareData = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json"
      );
      const data = await response.json();

      if (data && data.length > 0) {
        // Process all flare data from last 7 days
        const processedFlares: FlareData[] = [];
        const chartPoints: ChartDataPoint[] = [];

        // Timestamp-based filtering for consistent results
        const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        for (let i = data.length - 1; i >= 0; i--) {
          const reading = data[i];
          const flux = parseFloat(reading.flux);
          const timestamp = new Date(reading.time_tag).getTime();

          let flareClass = "A";
          let intensity = 0;

          if (flux >= 1e-4) {
            flareClass = "X";
            intensity = flux / 1e-4;
          } else if (flux >= 1e-5) {
            flareClass = "M";
            intensity = flux / 1e-5;
          } else if (flux >= 1e-6) {
            flareClass = "C";
            intensity = flux / 1e-6;
          } else if (flux >= 1e-7) {
            flareClass = "B";
            intensity = flux / 1e-7;
          } else {
            flareClass = "A";
            intensity = flux / 1e-8;
          }

          const flareData = {
            time: reading.time_tag,
            class: flareClass,
            intensity: parseFloat(intensity.toFixed(1)),
            flux: flux,
          };

          // Add to processed flares if within last 7 days (timestamp-based)
          if (timestamp >= sevenDaysAgo) {
            processedFlares.push(flareData);
          }

          // Add to chart data if within last 3 days
          if (timestamp >= threeDaysAgo) {
            chartPoints.push({
              timestamp,
              time: reading.time_tag,
              flux,
              class: flareClass,
              isMajor: flareClass === 'M' || flareClass === 'X'
            });
          }
        }

        // Reverse chart data to show oldest to newest
        chartPoints.reverse();

        // Set current flare (most recent)
        setCurrentFlare(processedFlares[0]);

        // Filter significant flares (C-class and above) for history
        const significantFlares = processedFlares.filter(
          (flare) => flare.class === "X" || flare.class === "M" || flare.class === "C"
        );

        // Debug logging
        const majorFlares = significantFlares.filter(f => f.class === 'M' || f.class === 'X');
        console.log('🔥 Major flares found:', majorFlares.length);
        console.log('🔥 Major flares:', majorFlares.slice(0, 5).map(f => ({
          class: f.class,
          intensity: f.intensity,
          time: f.time,
          age: Math.floor((Date.now() - new Date(f.time).getTime()) / (1000 * 60 * 60)) + 'h ago'
        })));

        setFlareHistory(significantFlares.slice(0, 20));
        setChartData(chartPoints);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching solar flare data:", error);
      setLoading(false);
    }
  };

  const getFlareColor = (flareClass: string) => {
    if (flareClass === "X") return "#ff0000";
    if (flareClass === "M") return "#ffaa00";
    if (flareClass === "C") return "#ffff00";
    if (flareClass === "B") return "#7fff00";
    return "#00ff00";
  };

  const getFlareDescription = (flareClass: string) => {
    if (flareClass === "X")
      return "Major flare - Can cause planet-wide radio blackouts and long-lasting radiation storms";
    if (flareClass === "M")
      return "Moderate flare - Can cause brief radio blackouts at poles and minor radiation storms";
    if (flareClass === "C")
      return "Minor flare - Few noticeable consequences on Earth";
    if (flareClass === "B") return "Small flare - No significant effects on Earth";
    return "Background level - Normal solar activity";
  };

  const getAuroraProbability = (flareClass: string, intensity: number) => {
    if (flareClass === "X") {
      if (intensity >= 5) return { level: "Very High", percentage: "90-100%", color: "#ff0000" };
      if (intensity >= 2) return { level: "High", percentage: "70-90%", color: "#ff4400" };
      return { level: "Moderate-High", percentage: "50-70%", color: "#ff8800" };
    }
    if (flareClass === "M") {
      if (intensity >= 5) return { level: "Moderate", percentage: "40-60%", color: "#ffaa00" };
      return { level: "Low-Moderate", percentage: "20-40%", color: "#ffdd00" };
    }
    if (flareClass === "C") {
      return { level: "Low", percentage: "10-20%", color: "#ffff00" };
    }
    return { level: "Very Low", percentage: "<10%", color: "#7fff00" };
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
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

  // Chart formatting helpers
  const formatXAxisTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays >= 2) return '2 days ago';
    if (diffDays >= 1) return 'yesterday';
    return 'today';
  };

  const formatFluxValue = (value: number) => {
    if (value >= 1e-4) return 'X';
    if (value >= 1e-5) return 'M';
    if (value >= 1e-6) return 'C';
    if (value >= 1e-7) return 'B';
    return 'A';
  };

  // Custom dot renderer for highlighting M and X class flares
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;

    if (payload.isMajor) {
      const color = payload.class === 'X' ? '#ff0000' : '#ffaa00';
      return (
        <g key={`major-flare-${index || payload.timestamp}`}>
          <circle key={`inner-${index || payload.timestamp}`} cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={2} />
          <circle key={`outer-${index || payload.timestamp}`} cx={cx} cy={cy} r={10} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
        </g>
      );
    }
    return null;
  };

  // Calculate aurora probability window (1-3 days after flare)
  const getAuroraWindow = (flareTime: string) => {
    const flareDate = new Date(flareTime);
    const now = new Date();
    const hoursSinceFlare = (now.getTime() - flareDate.getTime()) / (1000 * 60 * 60);

    const windowStart = 24; // 1 day
    const windowEnd = 72; // 3 days

    if (hoursSinceFlare < windowStart) {
      const hoursUntilWindow = windowStart - hoursSinceFlare;
      return {
        status: 'approaching',
        message: `Aurora window opens in ${Math.floor(hoursUntilWindow)} hours`,
        hoursUntil: Math.floor(hoursUntilWindow),
        daysUntil: Math.ceil(hoursUntilWindow / 24),
        inWindow: false
      };
    } else if (hoursSinceFlare >= windowStart && hoursSinceFlare <= windowEnd) {
      const hoursRemaining = windowEnd - hoursSinceFlare;
      return {
        status: 'active',
        message: `Aurora window ACTIVE - ${Math.floor(hoursRemaining)} hours remaining`,
        hoursRemaining: Math.floor(hoursRemaining),
        inWindow: true
      };
    } else {
      return {
        status: 'passed',
        message: 'Aurora window has passed',
        inWindow: false
      };
    }
  };

  // Get recent major flares (M and X class only)
  const getRecentMajorFlares = () => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    return flareHistory
      .filter(flare => {
        const flareTime = new Date(flare.time).getTime();
        return (flare.class === 'M' || flare.class === 'X') && flareTime >= threeDaysAgo;
      })
      .slice(0, 5); // Show top 5 most recent
  };

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
                <span className="text-4xl">⚡</span>
                Solar Flares
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Real-time X-ray flux monitoring from GOES satellites
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Last updated</div>
              <div className="text-sm text-gray-400">
                {mounted ? formatTime(lastUpdate.toISOString()) : '--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-xl text-white">Loading solar flare data...</div>
          </div>
        ) : (
          <>
            {/* X-Ray Flux Chart */}
            {chartData.length > 0 && currentFlare && (
              <div className="bg-black/80 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Solar Flare Detection</h2>
                      <p className="text-sm text-gray-400">GOES-16 X-Ray Flux (1-8 Angstrom)</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Current</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold" style={{ color: getFlareColor(currentFlare.class) }}>
                          {currentFlare.class}{currentFlare.intensity.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative p-4" style={{ backgroundColor: '#000' }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 30 }}>
                      {/* Color-coded flare class zones */}
                      <ReferenceArea y1={1e-4} y2={1e-3} fill="#ff0000" fillOpacity={0.15} />
                      <ReferenceArea y1={1e-5} y2={1e-4} fill="#ffaa00" fillOpacity={0.15} />
                      <ReferenceArea y1={1e-6} y2={1e-5} fill="#ffff00" fillOpacity={0.15} />
                      <ReferenceArea y1={1e-7} y2={1e-6} fill="#7fff00" fillOpacity={0.15} />
                      <ReferenceArea y1={1e-8} y2={1e-7} fill="#00ff00" fillOpacity={0.15} />

                      {/* Grid */}
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />

                      {/* X-Axis (Time) */}
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={formatXAxisTime}
                        stroke="#999"
                        tick={{ fill: '#999' }}
                        ticks={[
                          chartData[0]?.timestamp || 0,
                          chartData[Math.floor(chartData.length / 3)]?.timestamp || 0,
                          chartData[Math.floor(2 * chartData.length / 3)]?.timestamp || 0,
                        ]}
                        label={{ value: 'Time', position: 'bottom', fill: '#999', offset: 10 }}
                      />

                      {/* Y-Axis (Log scale flux) */}
                      <YAxis
                        scale="log"
                        domain={[1e-8, 1e-3]}
                        tickFormatter={(value) => value.toExponential(0)}
                        stroke="#999"
                        tick={{ fill: '#999' }}
                        ticks={[1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3]}
                        width={60}
                      />

                      {/* Flare class reference lines */}
                      <ReferenceLine y={1e-4} stroke="#ff0000" strokeDasharray="3 3" label={{ value: 'X', position: 'right', fill: '#ff0000', fontSize: 14, fontWeight: 'bold' }} />
                      <ReferenceLine y={1e-5} stroke="#ffaa00" strokeDasharray="3 3" label={{ value: 'M', position: 'right', fill: '#ffaa00', fontSize: 14, fontWeight: 'bold' }} />
                      <ReferenceLine y={1e-6} stroke="#ffff00" strokeDasharray="3 3" label={{ value: 'C', position: 'right', fill: '#ffff00', fontSize: 14, fontWeight: 'bold' }} />
                      <ReferenceLine y={1e-7} stroke="#7fff00" strokeDasharray="3 3" label={{ value: 'B', position: 'right', fill: '#7fff00', fontSize: 14, fontWeight: 'bold' }} />
                      <ReferenceLine y={1e-8} stroke="#00ff00" strokeDasharray="3 3" label={{ value: 'A', position: 'right', fill: '#00ff00', fontSize: 14, fontWeight: 'bold' }} />

                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any, name: string | undefined, props: any) => [
                          `${props.payload.class}${props.payload.intensity?.toFixed(1)} (${value.toExponential(2)} W/m²)`,
                          'X-Ray Flux'
                        ]}
                        labelFormatter={(timestamp: number) => new Date(timestamp).toLocaleString()}
                      />

                      {/* Main flux line */}
                      <Line
                        type="monotone"
                        dataKey="flux"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={renderCustomDot as any}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Class labels on right side */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold space-y-12">
                    <div className="text-[#ff0000] bg-black/70 px-2 py-1 rounded">X</div>
                    <div className="text-[#ffaa00] bg-black/70 px-2 py-1 rounded">M</div>
                    <div className="text-[#ffff00] bg-black/70 px-2 py-1 rounded">C</div>
                    <div className="text-[#7fff00] bg-black/70 px-2 py-1 rounded">B</div>
                    <div className="text-[#00ff00] bg-black/70 px-2 py-1 rounded">A</div>
                  </div>
                </div>

                {/* Chart legend */}
                <div className="bg-gray-900/50 p-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                      <span>Data provided by: NOAA/SWPC</span>
                      <span>•</span>
                      <span>Updates every 5 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#ff0000]"></div>
                        <span>X-class</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#ffaa00]"></div>
                        <span>M-class</span>
                      </div>
                      <span className="text-gray-600">= Major flares highlighted</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent M and X Class Flare Alerts */}
            {getRecentMajorFlares().length > 0 && (
              <div className="bg-gradient-to-br from-red-900/30 via-orange-900/30 to-yellow-900/30 backdrop-blur-lg rounded-2xl border-2 border-orange-500/40 overflow-hidden">
                <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 p-4 border-b border-orange-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Major Flare Activity Alert</h2>
                      <p className="text-sm text-orange-200">Recent M/X class flares - Aurora probability tracking</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {getRecentMajorFlares().map((flare, index) => {
                    const window = getAuroraWindow(flare.time);
                    const isXClass = flare.class === 'X';
                    const flareColor = isXClass ? 'red' : 'orange';

                    return (
                      <div
                        key={index}
                        className={`relative bg-gradient-to-r ${
                          isXClass
                            ? 'from-red-900/40 to-red-800/40 border-red-500/50'
                            : 'from-orange-900/40 to-orange-800/40 border-orange-500/50'
                        } border-2 rounded-xl p-5 ${
                          window.inWindow ? 'ring-4 ring-green-500/50 animate-pulse' : ''
                        }`}
                      >
                        {/* Active window badge */}
                        {window.inWindow && (
                          <div className="absolute -top-3 -right-3 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            AURORA WINDOW ACTIVE
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-4">
                          {/* Flare info */}
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center ${
                                isXClass ? 'bg-red-500/30' : 'bg-orange-500/30'
                              } border-2 ${isXClass ? 'border-red-500' : 'border-orange-500'}`}
                            >
                              <div className={`text-3xl font-bold ${isXClass ? 'text-red-300' : 'text-orange-300'}`}>
                                {flare.class}{flare.intensity.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-400 uppercase tracking-wider">Flare</div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  isXClass ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                                }`}>
                                  {isXClass ? 'MAJOR FLARE' : 'MODERATE FLARE'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Detected {getTimeSince(flare.time)}
                                </div>
                              </div>
                              <div className="text-sm text-gray-300 mb-1">
                                {mounted ? formatTime(flare.time) : '--'}
                              </div>
                              <div className="text-xs text-gray-400">
                                X-ray flux: {flare.flux.toExponential(2)} W/m²
                              </div>
                            </div>
                          </div>

                          {/* Aurora probability window */}
                          <div className="text-right min-w-[200px]">
                            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Aurora Probability</div>
                            <div className={`text-lg font-bold mb-2 ${
                              window.status === 'active' ? 'text-green-400' :
                              window.status === 'approaching' ? 'text-yellow-400' :
                              'text-gray-500'
                            }`}>
                              {window.status === 'active' ? '🌟 HIGH' :
                               window.status === 'approaching' ? '⏳ RISING' :
                               '❌ LOW'}
                            </div>
                            <div className={`text-sm mb-2 ${
                              window.status === 'active' ? 'text-green-300' :
                              window.status === 'approaching' ? 'text-yellow-300' :
                              'text-gray-400'
                            }`}>
                              {window.message}
                            </div>

                            {/* Countdown/Progress bar */}
                            {window.status !== 'passed' && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                  <span>1 day</span>
                                  <span>3 days</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      window.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}
                                    style={{
                                      width: window.status === 'active'
                                        ? `${((72 - (window.hoursRemaining || 0)) / 48) * 100}%`
                                        : `${((24 - (window.hoursUntil || 0)) / 24) * 100}%`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CME reminder */}
                        {window.status !== 'passed' && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-start gap-2 text-xs text-yellow-200">
                              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                <strong>Remember:</strong> Check CME coronagraph data to confirm if this flare launched an Earth-directed CME.
                                Only CMEs produce auroras - the flare itself indicates potential but not certainty.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Summary banner */}
                  <div className="mt-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-purple-200 mb-1">
                          📚 Aurora Hunting Tips
                        </div>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• M and X class flares have highest CME probability (60-90%)</li>
                          <li>• Aurora window peaks 1-3 days after flare detection</li>
                          <li>• Check solar wind speed and Bz orientation for best aurora forecasting</li>
                          <li>• Active window = Plan your aurora hunt NOW!</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Flare Status */}
            {currentFlare && (
              <div className="bg-gradient-to-br from-yellow-900/40 to-amber-900/40 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Current Solar Activity</div>
                    <div className="flex items-baseline gap-4">
                      <div
                        className="text-7xl font-bold"
                        style={{ color: getFlareColor(currentFlare.class) }}
                      >
                        {currentFlare.class}
                        {currentFlare.intensity.toFixed(1)}
                      </div>
                      <div className="text-gray-300">
                        <div className="text-sm">Class</div>
                        <div className="text-2xl font-bold">{currentFlare.class}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-2">Detected</div>
                    <div className="text-xl text-white font-semibold">
                      {getTimeSince(currentFlare.time)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {mounted ? formatTime(currentFlare.time) : '--'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Description</div>
                    <div className="text-white">{getFlareDescription(currentFlare.class)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">X-ray Flux</div>
                      <div className="text-2xl font-bold text-white">
                        {currentFlare.flux.toExponential(2)} W/m²
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Aurora Probability</div>
                      <div
                        className="text-2xl font-bold"
                        style={{
                          color: getAuroraProbability(currentFlare.class, currentFlare.intensity)
                            .color,
                        }}
                      >
                        {getAuroraProbability(currentFlare.class, currentFlare.intensity).level}
                      </div>
                      <div className="text-sm text-gray-400">
                        {getAuroraProbability(currentFlare.class, currentFlare.intensity).percentage}{" "}
                        chance in 2-3 days
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Classification Guide */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Solar Flare Classification</h2>
              <div className="space-y-3">
                {[
                  {
                    class: "X",
                    color: "#ff0000",
                    desc: "Major - Strongest flares, each 10× more powerful than previous",
                  },
                  { class: "M", color: "#ffaa00", desc: "Moderate - Medium-sized flares" },
                  { class: "C", color: "#ffff00", desc: "Minor - Small flares, little impact" },
                  { class: "B", color: "#7fff00", desc: "Small - Minimal activity" },
                  { class: "A", color: "#00ff00", desc: "Background - Normal solar radiation" },
                ].map((item) => (
                  <div key={item.class} className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold"
                      style={{ backgroundColor: item.color + "20", color: item.color }}
                    >
                      {item.class}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Significant Flares */}
            {flareHistory.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">
                  Recent Significant Flares (C-class and above)
                </h2>
                <div className="space-y-2">
                  {flareHistory.map((flare, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold"
                          style={{
                            backgroundColor: getFlareColor(flare.class) + "20",
                            color: getFlareColor(flare.class),
                          }}
                        >
                          {flare.class}
                          {flare.intensity.toFixed(1)}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {mounted ? formatTime(flare.time) : '--'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {flare.flux.toExponential(2)} W/m²
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">{getTimeSince(flare.time)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flare-CME Connection */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Flares → CMEs → Aurora: The Connection</h2>
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded p-4">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">1. Solar Flare Erupts ⚡</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    A solar flare releases electromagnetic radiation (light, X-rays, radio waves) that reaches Earth in just 8 minutes at the speed of light.
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Effect on Earth:</strong> Radio blackouts, GPS disruption - but no aurora yet!
                  </p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded p-4">
                  <h3 className="text-lg font-semibold text-orange-300 mb-2">2. CME Launches ☄️</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    Strong flares (especially X-class) often launch a Coronal Mass Ejection - billions of tons of magnetized plasma that travels much slower than light.
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Timeline:</strong> Check coronagraph images 20-60 minutes after major flare for CME confirmation.
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">3. CME Travels to Earth 🌍</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    If Earth-directed, the CME travels for 1-3 days depending on speed. This is when aurora hunters prepare!
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Your window:</strong> From flare detection to aurora = 1-3 days of preparation time.
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">4. Aurora! 🌌</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    When the CME hits Earth's magnetosphere, if the magnetic field orientation is favorable (Bz south), spectacular aurora displays light up the sky!
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Duration:</strong> Aurora can last from a few hours to multiple days depending on CME size and speed.
                  </p>
                </div>
              </div>
            </div>

            {/* Flare Class vs CME Probability */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Flare Class vs CME Launch Probability</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded">
                  <div>
                    <div className="text-red-300 font-bold">X-class Flares</div>
                    <div className="text-xs text-gray-400">Major flares, most powerful</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-300">~90%</div>
                    <div className="text-xs text-gray-400">CME probability</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded">
                  <div>
                    <div className="text-orange-300 font-bold">M-class Flares</div>
                    <div className="text-xs text-gray-400">Moderate flares</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-300">~60%</div>
                    <div className="text-xs text-gray-400">CME probability</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <div>
                    <div className="text-yellow-300 font-bold">C-class Flares</div>
                    <div className="text-xs text-gray-400">Minor flares</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-300">~20%</div>
                    <div className="text-xs text-gray-400">CME probability</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-300">
                  <span className="text-aurora-green font-semibold">Key Insight:</span> Flare ≠ CME ≠ Aurora.
                  <strong> Flares are electromagnetic (instant)</strong>, <strong>CMEs are plasma (slow)</strong>.
                  A strong flare WITHOUT a CME produces no aurora - just radio effects!
                </p>
              </div>
            </div>

            {/* Important Distinction */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-yellow-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-white mb-2">⚠️ Critical: Flare ≠ Guaranteed Aurora!</p>
                  <p className="mb-2">
                    <strong>What matters for aurora:</strong> Not the flare itself, but whether it launches an <strong>Earth-directed CME</strong>.
                  </p>
                  <p className="mb-2">
                    <strong>When to watch for CMEs:</strong> After X-class or strong M-class flares (M5+), check SOHO/LASCO coronagraph images 20-60 minutes later for CME confirmation.
                  </p>
                  <p className="text-yellow-300 font-semibold">
                    → If you see a full halo CME after an X-class flare from an Earth-facing region = Plan aurora hunt for 1-3 days later!
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-blue-400 flex-shrink-0"
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
                  <p className="font-semibold text-white mb-2">Data Sources & Updates:</p>
                  <p className="mb-2">
                    Solar flare data updates every 5 minutes from NOAA GOES satellites measuring X-ray flux in the 1-8 Angstrom wavelength.
                  </p>
                  <p className="mb-2">
                    <span className="text-aurora-green">Classification:</span> A → B → C → M → X (each class is 10× stronger than the previous)
                  </p>
                  <p>
                    <span className="text-aurora-green">Pro Tip:</span> When you see an X-class flare, immediately check the <strong>CME Alerts</strong> page to see if an Earth-directed CME was launched!
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
