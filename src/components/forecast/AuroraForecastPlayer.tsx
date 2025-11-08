"use client";

import { useState, useEffect, useRef } from "react";

interface AuroraForecastPlayerProps {
  hemisphere: "north" | "south";
  title: string;
}

export default function AuroraForecastPlayer({
  hemisphere,
  title,
}: AuroraForecastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchFrames();
  }, [hemisphere]);

  const fetchFrames = async () => {
    try {
      setLoading(true);
      // Fetch directory listing
      const response = await fetch(
        `https://services.swpc.noaa.gov/images/animations/ovation/${hemisphere}/`
      );
      const html = await response.text();

      // Parse HTML to extract image filenames (excluding latest.jpg)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a"));

      const imageFiles = links
        .map((link) => link.getAttribute("href"))
        .filter(
          (href) =>
            href &&
            href.startsWith("aurora_") &&
            href.endsWith(".jpg") &&
            href !== "latest.jpg"
        )
        .sort() // Sort chronologically
        .map(
          (file) =>
            `https://services.swpc.noaa.gov/images/animations/ovation/${hemisphere}/${file}`
        );

      setFrames(imageFiles);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching aurora frames:", error);
      // Fallback to latest image
      setFrames([
        `https://services.swpc.noaa.gov/images/animations/ovation/${hemisphere}/latest.jpg`,
      ]);
      setLoading(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
      }, 200); // Change frame every 200ms for smooth animation
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
  }, [isPlaying, frames.length]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrame = parseInt(e.target.value);
    setCurrentFrame(newFrame);
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="bg-black/30 rounded-lg overflow-hidden h-96 flex items-center justify-center">
        <div className="text-gray-400">Loading forecast...</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-3">{title}</h3>
      <div className="bg-black/30 rounded-lg overflow-hidden relative">
        {/* Forecast Image */}
        <img
          src={frames[currentFrame] || frames[0]}
          alt={`${title} Aurora Forecast`}
          className="w-full h-auto"
          onError={(e) => {
            e.currentTarget.src =
              `https://services.swpc.noaa.gov/images/animations/ovation/${hemisphere}/latest.jpg`;
          }}
        />

        {/* Video Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors"
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
              max={frames.length - 1}
              value={currentFrame}
              onChange={handleSliderChange}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #00ff87 0%, #00ff87 ${
                  (currentFrame / (frames.length - 1)) * 100
                }%, rgba(255,255,255,0.2) ${
                  (currentFrame / (frames.length - 1)) * 100
                }%, rgba(255,255,255,0.2) 100%)`,
              }}
            />

            {/* Frame Counter */}
            <div className="text-white text-sm font-medium min-w-[80px] text-right">
              {currentFrame + 1} / {frames.length}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Real-time OVATION Aurora Forecast Model - {frames.length} frames (24 hours)
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
