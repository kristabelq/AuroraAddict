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
      <div className="sticky top-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 px-4 py-3 z-[9999]">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-center gap-8 text-sm">
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
    );
  }

  return (
    <div className="sticky top-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 px-4 py-3 z-[9999]">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-center justify-center gap-8 text-sm">
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
  );
}
