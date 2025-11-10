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

  useEffect(() => {
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

        // Get data from last 3 days for chart (higher resolution)
        const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);

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

          // Add to processed flares if within last 7 days
          if (i >= Math.max(0, data.length - 168)) {
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
    const { cx, cy, payload } = props;

    if (payload.isMajor) {
      const color = payload.class === 'X' ? '#ff0000' : '#ffaa00';
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={10} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
        </g>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      {/* Header with Back Button */}
      <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 sticky top-[57px] z-50">
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
              <div className="text-sm text-gray-400">{formatTime(lastUpdate.toISOString())}</div>
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
                        formatter={(value: any, name: string, props: any) => [
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
                      {formatTime(currentFlare.time)}
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
                          <div className="text-white font-medium">{formatTime(flare.time)}</div>
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
