"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TimeHeader from "@/components/TimeHeader";
import SyncedAuroraPlayers from "@/components/forecast/SyncedAuroraPlayers";

interface KpData {
  time_tag: string;
  kp: string;
  observed: string;
  noaa_scale: string | null;
}

interface Day27Data {
  date: string;
  radioFlux: number;
  aIndex: number;
  kpIndex: number;
  isObserved?: boolean;
}

interface ObservedKpData {
  time_tag: string;
  kp: string;
}

export default function ForecastPage() {
  const router = useRouter();
  const [kpData, setKpData] = useState<KpData[]>([]);
  const [day27Data, setDay27Data] = useState<Day27Data[]>([]);
  const [observedKpData, setObservedKpData] = useState<ObservedKpData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loading27Day, setLoading27Day] = useState(true);
  const [currentKp, setCurrentKp] = useState<string>("0.00");

  useEffect(() => {
    fetchKpData();
    fetchObservedKpData();
    fetch27DayData();
  }, []);

  const fetchKpData = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
      );
      const data = await response.json();

      // Remove header row and map to typed objects
      const formattedData: KpData[] = data.slice(1).map((row: string[]) => ({
        time_tag: row[0],
        kp: row[1],
        observed: row[2],
        noaa_scale: row[3],
      }));

      setKpData(formattedData);

      // Find the most recent observed KP value
      const latestObserved = formattedData
        .filter((d) => d.observed === "observed")
        .pop();
      if (latestObserved) {
        setCurrentKp(latestObserved.kp);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching KP data:", error);
      setLoading(false);
    }
  };

  const fetchObservedKpData = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
      );
      const data = await response.json();

      // Remove header row and map to typed objects
      const formattedData: ObservedKpData[] = data.slice(1).map((row: string[]) => ({
        time_tag: row[0],
        kp: row[1],
      }));

      setObservedKpData(formattedData);
    } catch (error) {
      console.error("Error fetching observed KP data:", error);
    }
  };

  const fetch27DayData = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/text/27-day-outlook.txt"
      );
      const text = await response.text();

      // Parse the text data
      const lines = text.split("\n");
      const dataLines: Day27Data[] = [];

      // Find the data section - lines that start with a year (202x)
      for (const line of lines) {
        const trimmed = line.trim();

        // Check if line starts with a year (2025, 2026, etc.)
        if (trimmed.match(/^202\d/)) {
          // Parse lines like: "2025 Oct 13     140          18          4"
          const parts = trimmed.split(/\s+/);

          if (parts.length >= 5) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            const dateStr = `${year} ${month} ${day}`;

            // Validate the numbers before adding
            const radioFlux = parseInt(parts[3]);
            const aIndex = parseInt(parts[4]);
            const kpIndex = parseInt(parts[5]);

            if (!isNaN(radioFlux) && !isNaN(aIndex) && !isNaN(kpIndex)) {
              dataLines.push({
                date: dateStr,
                radioFlux,
                aIndex,
                kpIndex,
              });
            }
          }
        }
      }

      setDay27Data(dataLines);
      setLoading27Day(false);
    } catch (error) {
      console.error("Error fetching 27-day data:", error);
      setLoading27Day(false);
    }
  };


  const getKpColor = (kp: number) => {
    if (kp >= 5) return "#ff0000"; // Red - High activity
    if (kp >= 4) return "#ffaa00"; // Orange
    if (kp >= 3) return "#ffff00"; // Yellow
    return "#00ff00"; // Green - Low activity
  };

  const getBarHeight = (kp: number) => {
    const maxHeight = 200; // pixels
    return (kp / 9) * maxHeight; // KP scale is 0-9
  };

  // Get historical data (observed only)
  const historicalData = kpData
    .filter((d) => d.observed === "observed")
    .slice(-6); // Last 6 observations

  // Get upcoming hours (predicted)
  const upcomingHours = kpData
    .filter((d) => d.observed === "predicted")
    .slice(0, 6); // Next 6 predictions

  // Get long-term forecast (next 6 days, one per day)
  const longTermForecast = kpData
    .filter((d) => d.observed === "predicted")
    .reduce((acc: KpData[], curr) => {
      const date = new Date(curr.time_tag).toDateString();
      if (!acc.find((item) => new Date(item.time_tag).toDateString() === date)) {
        acc.push(curr);
      }
      return acc;
    }, [])
    .slice(0, 6);

  const formatTime = (timeTag: string) => {
    const date = new Date(timeTag);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  const formatDate = (timeTag: string) => {
    const date = new Date(timeTag);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
    });
  };

  const format27DayDate = (dateStr: string) => {
    // Parse "2025 Oct 13" format
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };


  // Merge observed KP data with forecast data
  const getMerged27DayData = () => {
    if (observedKpData.length === 0 || day27Data.length === 0) {
      return day27Data;
    }

    // Calculate max KP per day from observed data
    const observedDailyMax = new Map<string, number>();
    observedKpData.forEach((reading) => {
      const date = new Date(reading.time_tag);
      const dateKey = date.toISOString().split("T")[0];
      const kpValue = parseFloat(reading.kp);

      if (!observedDailyMax.has(dateKey) || kpValue > observedDailyMax.get(dateKey)!) {
        observedDailyMax.set(dateKey, kpValue);
      }
    });

    // Create merged data array
    const merged: Day27Data[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    day27Data.forEach((forecastDay) => {
      const forecastDate = new Date(forecastDay.date);
      forecastDate.setHours(0, 0, 0, 0);
      const dateKey = forecastDate.toISOString().split("T")[0];

      // Check if we have observed data for this date
      if (observedDailyMax.has(dateKey)) {
        merged.push({
          ...forecastDay,
          kpIndex: Math.round(observedDailyMax.get(dateKey)!),
          isObserved: true,
        });
      } else {
        merged.push({
          ...forecastDay,
          isObserved: false,
        });
      }
    });

    return merged;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center">
        <div className="text-gray-400">Loading forecast data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/intelligence?tab=aurora-intel")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Aurora Intel
          </button>

          <h1 className="text-3xl font-bold mb-2">Kp Forecast</h1>
          <p className="text-gray-400">
            KP index data from NOAA Space Weather Prediction Center
          </p>
        </div>

        {/* Current KP */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6 text-center">
          <div className="text-gray-400 mb-2">Current KP Index</div>
          <div
            className="text-6xl font-bold mb-2"
            style={{ color: getKpColor(parseFloat(currentKp)) }}
          >
            {currentKp}
          </div>
          <div className="text-sm text-gray-400">
            {parseFloat(currentKp) >= 5
              ? "High Activity - Great viewing conditions!"
              : parseFloat(currentKp) >= 3
              ? "Moderate Activity - Possible aurora"
              : "Low Activity - Limited visibility"}
          </div>
        </div>

        {/* Aurora Forecast Animations - Synchronized */}
        <SyncedAuroraPlayers />

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
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
              <p className="font-semibold text-white mb-2">
                Understanding KP Index:
              </p>
              <p className="mb-2">
                <span className="text-green-400">KP 0-3:</span> Low activity -
                Aurora visible near poles
              </p>
              <p className="mb-2">
                <span className="text-yellow-400">KP 3-5:</span> Moderate
                activity - Aurora visible at higher latitudes
              </p>
              <p>
                <span className="text-red-400">KP 5-9:</span> High activity -
                Aurora visible at lower latitudes
              </p>
            </div>
          </div>
        </div>

        {/* KP Index - Upcoming hours */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            KP Index - Upcoming hours
          </h2>
          <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-gray-400 text-sm pr-2">
              <span>8.00</span>
              <span>6.00</span>
              <span>4.00</span>
              <span>2.00</span>
              <span>0.00</span>
            </div>

            {/* Chart */}
            <div className="ml-12 h-full flex items-end justify-around gap-2">
              {upcomingHours.map((data, index) => {
                const kpValue = parseFloat(data.kp);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full">
                      <div className="text-white text-xs mb-1 text-center">
                        {kpValue.toFixed(2)}
                      </div>
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${getBarHeight(kpValue)}px`,
                          backgroundColor: getKpColor(kpValue),
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-center">
                      {formatTime(data.time_tag)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KP Index - Long term forecast */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            KP Index - Long term forecast
          </h2>
          <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-gray-400 text-sm pr-2">
              <span>8.00</span>
              <span>6.00</span>
              <span>4.00</span>
              <span>2.00</span>
              <span>0.00</span>
            </div>

            {/* Chart */}
            <div className="ml-12 h-full flex items-end justify-around gap-2">
              {longTermForecast.map((data, index) => {
                const kpValue = parseFloat(data.kp);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full">
                      <div className="text-white text-xs mb-1 text-center">
                        {kpValue.toFixed(2)}
                      </div>
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${getBarHeight(kpValue)}px`,
                          backgroundColor: getKpColor(kpValue),
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-center">
                      {formatDate(data.time_tag)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 27-Day KP Forecast */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            27-Day KP Forecast
          </h2>
          {loading27Day ? (
            <div className="text-center py-12 text-gray-400">
              Loading 27-day forecast...
            </div>
          ) : getMerged27DayData().length > 0 ? (
            <>
              {/* KP Scale Reference */}
              <div className="flex items-center gap-2 mb-6 text-xs text-gray-400">
                <span>KP Scale:</span>
                <div className="flex gap-1">
                  <span className="text-green-400">0-3 Low</span>
                  <span>|</span>
                  <span className="text-yellow-400">3-5 Moderate</span>
                  <span>|</span>
                  <span className="text-red-400">5-9 High</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {getMerged27DayData().map((data, index) => {
                  const kpValue = data.kpIndex;
                  const barWidth = (kpValue / 9) * 100; // Percentage of max KP (9)

                  return (
                    <div key={index} className="flex items-center gap-3">
                      {/* Date label */}
                      <div className="w-20 text-xs text-gray-400 text-right">
                        {format27DayDate(data.date)}
                      </div>

                      {/* Bar container */}
                      <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden relative">
                        {/* Bar */}
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: getKpColor(kpValue),
                          }}
                        />

                        {/* KP value label */}
                        <div className="absolute inset-0 flex items-center justify-end pr-3">
                          <span className="text-xs font-semibold text-white drop-shadow-lg">
                            {kpValue}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info about 27-day forecast */}
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
                    <p className="font-semibold text-white mb-2">
                      About the 27-Day Forecast:
                    </p>
                    <p className="mb-2">
                      This extended forecast shows the maximum daily KP index for
                      the next 27 days. Bars with full opacity show real-time
                      observed data from NOAA, while transparent bars show
                      predicted values. The forecast is updated weekly.
                    </p>
                    <p>
                      Higher KP values indicate better chances of aurora activity.
                      Use this data to plan aurora viewing trips in advance.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No 27-day forecast data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
