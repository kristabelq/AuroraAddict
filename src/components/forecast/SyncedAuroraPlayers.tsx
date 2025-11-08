"use client";

import { useState, useEffect, useRef } from "react";

interface FrameData {
  url: string;
  timestamp: Date;
}

export default function SyncedAuroraPlayers() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [northFrames, setNorthFrames] = useState<FrameData[]>([]);
  const [southFrames, setSouthFrames] = useState<FrameData[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAllFrames();
  }, []);

  const parseTimestamp = (filename: string): Date | null => {
    // Format: aurora_N_2025-10-11_1745.jpg
    const match = filename.match(/aurora_[NS]_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})\.jpg/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      ));
    }
    return null;
  };

  const fetchFramesForHemisphere = async (hemisphere: "north" | "south"): Promise<FrameData[]> => {
    try {
      const response = await fetch(
        `https://services.swpc.noaa.gov/images/animations/ovation/${hemisphere}/`
      );
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a"));

      const frames = links
        .map((link) => link.getAttribute("href"))
        .filter(
          (href) =>
            href &&
            href.startsWith("aurora_") &&
            href.endsWith(".jpg") &&
            href !== "latest.jpg"
        )
        .map((file) => {
          const timestamp = parseTimestamp(file!);
          return {
            url: `https://services.swpc.noaa.gov/images/animations/ovation/${hemisphere}/${file}`,
            timestamp: timestamp || new Date(),
          };
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return frames;
    } catch (error) {
      console.error(`Error fetching ${hemisphere} frames:`, error);
      return [];
    }
  };

  const fetchAllFrames = async () => {
    setLoading(true);
    const [north, south] = await Promise.all([
      fetchFramesForHemisphere("north"),
      fetchFramesForHemisphere("south"),
    ]);
    console.log(`North frames: ${north.length}, South frames: ${south.length}`);
    setNorthFrames(north);
    setSouthFrames(south);
    setLoading(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && northFrames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % northFrames.length);
      }, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, northFrames.length]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrame = parseInt(e.target.value);
    setCurrentFrame(newFrame);
    setIsPlaying(false);
  };

  const formatLocalTime = (date: Date): string => {
    const localTime = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Get UTC offset in hours
    const offsetMinutes = date.getTimezoneOffset();
    const offsetHours = -offsetMinutes / 60;
    const offsetSign = offsetHours >= 0 ? "+" : "-";
    const absOffsetHours = Math.abs(offsetHours);
    const utcOffset = `UTC${offsetSign}${absOffsetHours}`;

    return `${localTime} (${utcOffset})`;
  };

  const formatUTC = (date: Date): string => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }) + " UTC";
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Aurora - 30 Minute Forecast
        </h2>
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-400">Loading forecast animations...</div>
        </div>
      </div>
    );
  }

  const currentTimestamp = northFrames[currentFrame]?.timestamp || new Date();

  // Calculate safe frame index for south hemisphere (handles different array lengths)
  const southFrameIndex = southFrames.length > 0 ? currentFrame % southFrames.length : 0;

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Aurora - 30 Minute Forecast
      </h2>

      {/* Time Display */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Your Local Time</div>
          <div className="text-white font-semibold">
            {formatLocalTime(currentTimestamp)}
          </div>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Forecast Time (UTC)</div>
          <div className="text-white font-semibold">
            {formatUTC(currentTimestamp)}
          </div>
        </div>
      </div>

      {/* Synchronized Video Players */}
      <div className="grid md:grid-cols-2 gap-6 mb-4">
        {/* Northern Hemisphere */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">
            Northern Hemisphere
          </h3>
          <div className="bg-black/30 rounded-lg overflow-hidden">
            <img
              src={northFrames[currentFrame]?.url || northFrames[0]?.url}
              alt="Northern Hemisphere Aurora Forecast"
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.src =
                  "https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg";
              }}
            />
          </div>
        </div>

        {/* Southern Hemisphere */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">
            Southern Hemisphere
          </h3>
          <div className="bg-black/30 rounded-lg overflow-hidden">
            <img
              src={southFrames[southFrameIndex]?.url || southFrames[0]?.url}
              alt="Southern Hemisphere Aurora Forecast"
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.src =
                  "https://services.swpc.noaa.gov/images/animations/ovation/south/latest.jpg";
              }}
            />
          </div>
        </div>
      </div>

      {/* Unified Controls */}
      <div className="bg-black/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors flex-shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Progress Slider */}
          <input
            type="range"
            min="0"
            max={northFrames.length - 1}
            value={currentFrame}
            onChange={handleSliderChange}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #00ff87 0%, #00ff87 ${
                (currentFrame / (northFrames.length - 1)) * 100
              }%, rgba(255,255,255,0.2) ${
                (currentFrame / (northFrames.length - 1)) * 100
              }%, rgba(255,255,255,0.2) 100%)`,
            }}
          />

          {/* Frame Counter */}
          <div className="text-white text-sm font-medium min-w-[80px] text-right">
            {currentFrame + 1} / {northFrames.length}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Real-time OVATION Aurora Forecast Model - {northFrames.length} frames (24 hours)
      </p>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00ff87;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00ff87;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
