"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DataSourcesPage() {
  const router = useRouter();
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Update the last checked time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLastChecked(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const dataSources = [
    {
      name: "NOAA Space Weather Prediction Center",
      description: "KP Index, Solar Wind Data (Bz, Speed, Density)",
      url: "https://services.swpc.noaa.gov/",
      endpoints: [
        "/text/3-day-geomag-forecast.txt",
        "/products/solar-wind/mag-1-day.json",
        "/products/solar-wind/plasma-1-day.json"
      ],
      updateFrequency: "Real-time (1-minute intervals)",
      icon: "🛰️"
    },
    {
      name: "Open-Meteo Weather API",
      description: "Cloud Cover, Wind, Humidity, Precipitation Forecasts",
      url: "https://api.open-meteo.com/",
      endpoints: [
        "/v1/forecast?hourly=cloud_cover,wind_speed_10m,wind_direction_10m,relative_humidity_2m,precipitation_probability"
      ],
      updateFrequency: "Hourly updates",
      icon: "☁️"
    },
    {
      name: "Sunrise-Sunset.org API",
      description: "Sunrise, Sunset, and Twilight Times",
      url: "https://api.sunrise-sunset.org/",
      endpoints: [
        "/json?lat={lat}&lng={lon}&formatted=0"
      ],
      updateFrequency: "Daily calculations",
      icon: "🌅"
    },
    {
      name: "Moon Phase API",
      description: "Moon Phase and Illumination Data",
      url: "https://api.farmsense.net/",
      endpoints: [
        "/v1/moonphases/?d={timestamp}"
      ],
      updateFrequency: "Real-time calculations",
      icon: "🌙"
    },
    {
      name: "OpenStreetMap Nominatim",
      description: "Location Search and Geocoding",
      url: "https://nominatim.openstreetmap.org/",
      endpoints: [
        "/search?q={query}&format=json",
        "/reverse?lat={lat}&lon={lon}&format=json"
      ],
      updateFrequency: "Real-time queries",
      icon: "🗺️"
    },
    {
      name: "OSRM Routing Engine",
      description: "Drive Time and Distance Calculations",
      url: "https://router.project-osrm.org/",
      endpoints: [
        "/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"
      ],
      updateFrequency: "Real-time calculations",
      icon: "🚗"
    },
    {
      name: "Bortle Scale Calculation",
      description: "Light Pollution Classification (Algorithm-based)",
      url: "N/A - Calculated locally",
      endpoints: [
        "Based on population density and distance from urban centers"
      ],
      updateFrequency: "Static calculation",
      icon: "💡"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a] to-[#0f1729] text-white">
      <div className="max-w-screen-lg mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold">Data Sources</h1>
            <p className="text-sm text-gray-400 mt-1">Real-time aurora intelligence powered by trusted sources</p>
          </div>
        </div>

        {/* Last Updated Banner */}
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-4 mb-6 border-2 border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <div className="text-sm text-gray-300">Last Checked</div>
                <div className="text-lg font-bold text-white">
                  {lastChecked.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">Today</div>
              <div className="text-lg font-bold text-white">
                {lastChecked.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources List */}
        <div className="space-y-4">
          {dataSources.map((source, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{source.icon}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{source.name}</h3>
                      <p className="text-sm text-gray-400">{source.description}</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full whitespace-nowrap">
                      {source.updateFrequency}
                    </span>
                  </div>

                  {source.url !== "N/A - Calculated locally" && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 underline mb-2 inline-block"
                    >
                      {source.url}
                    </a>
                  )}

                  <div className="mt-3 bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2 font-semibold">API Endpoints:</div>
                    <div className="space-y-1">
                      {source.endpoints.map((endpoint, idx) => (
                        <div key={idx} className="text-xs font-mono text-gray-300 break-all">
                          {endpoint}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 bg-indigo-900/20 rounded-xl p-4 border border-indigo-500/20">
          <p className="text-sm text-gray-300 text-center">
            <span className="font-semibold">Note:</span> All data sources are free and publicly accessible.
            Aurora Addict does not store or cache data - all information is fetched in real-time to ensure accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}
