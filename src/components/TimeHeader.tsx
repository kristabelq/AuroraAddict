"use client";

import { useState, useEffect } from "react";

export default function TimeHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, utc: boolean = false) => {
    if (utc) {
      return date.toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date, utc: boolean = false) => {
    if (utc) {
      return date.toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!mounted) {
    return (
      <div className="sticky top-0 z-[9999]">
        <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 px-4 py-3">
          <div className="max-w-screen-lg mx-auto">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div>
                <span className="text-gray-400">UTC:</span>{" "}
                <span className="font-mono text-white">--:--:--</span>
              </div>
              <div>
                <span className="text-gray-400">Local:</span>{" "}
                <span className="font-mono text-white">--:--:--</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-sm border-b border-purple-500/30 px-4 py-2">
          <div className="max-w-screen-lg mx-auto">
            <p className="text-center text-xs sm:text-sm text-purple-100">
              <span className="inline-flex items-center gap-1.5">
                <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">BETA</span>
                <span className="text-purple-200">
                  Data is still evolving and may contain inaccuracies.
                </span>
                <a
                  href="https://forms.gle/yoPfrnhPHWcoMHcv6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white transition-colors font-medium"
                >
                  Report issues →
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-[9999]">
      {/* Time Bar */}
      <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div>
              <span className="text-gray-400">UTC:</span>{" "}
              <span className="font-mono text-white">{formatTime(currentTime, true)}</span>
              <span className="text-gray-500 ml-2 text-xs">{formatDate(currentTime, true)}</span>
            </div>
            <div>
              <span className="text-gray-400">Local:</span>{" "}
              <span className="font-mono text-white">{formatTime(currentTime)}</span>
              <span className="text-gray-500 ml-2 text-xs">{formatDate(currentTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Banner */}
      <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-sm border-b border-purple-500/30 px-3 py-1.5">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-center gap-2 text-[11px] sm:text-sm text-purple-100">
            <span className="bg-purple-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">BETA</span>
            <span className="text-purple-200">
              Data still evolving, may be inaccurate.
            </span>
            <a
              href="https://forms.gle/yoPfrnhPHWcoMHcv6"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white transition-colors font-medium flex-shrink-0"
            >
              Report →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
