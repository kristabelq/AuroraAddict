"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface DataSource {
  name: string;
  description: string;
  url: string;
  updateFrequency: string;
  icon: string;
}

function SourceCard({ source }: { source: DataSource }) {
  return (
    <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-start gap-4">
        <span className="text-4xl">{source.icon}</span>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{source.name}</h3>
              <p className="text-sm text-gray-400">{source.description}</p>
            </div>
            <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full whitespace-nowrap ml-2">
              {source.updateFrequency}
            </span>
          </div>

          {source.url !== "N/A - Calculated locally" && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 underline inline-block"
            >
              {source.url}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const spaceWeatherSources = [
    {
      name: "NOAA Space Weather Prediction Center",
      description: "Kp Index, Solar Wind Data (Bz, Speed, Density), OVATION Aurora Model",
      url: "https://services.swpc.noaa.gov/",
      updateFrequency: "Real-time (1-minute intervals)",
      icon: "🛰️"
    },
    {
      name: "GFZ Potsdam Hp30/Hp60 Index",
      description: "High-resolution geomagnetic indices updated every 30 minutes (vs Kp's 3-hour updates). Catches substorms that Kp misses.",
      url: "https://kp.gfz-potsdam.de/",
      updateFrequency: "Every 30 minutes",
      icon: "⚡"
    },
    {
      name: "SuperMAG Magnetometer Network",
      description: "Ground-based magnetometer readings in nanoTesla (nT) from 300+ stations worldwide. Essential for real substorm detection.",
      url: "https://supermag.jhuapl.edu/",
      updateFrequency: "Real-time (1-minute intervals)",
      icon: "🧲"
    },
    {
      name: "GFZ Helmholtz 3-Day Forecast",
      description: "Machine learning-based aurora forecast for trip planning. Predicts Kp and geomagnetic activity 72 hours ahead.",
      url: "https://spaceweather.gfz.de/",
      updateFrequency: "Every 3 hours",
      icon: "📊"
    }
  ];

  const auroraIntelligenceSources = [
    {
      name: "Energy Transfer Calculator",
      description: "Measures how much solar wind energy is entering Earth's magnetic field.",
      url: "N/A - Calculated locally",
      updateFrequency: "Real-time calculation",
      icon: "🔬"
    },
    {
      name: "Substorm Phase Detection",
      description: "Tracks aurora substorm cycle from quiet through expansion to recovery.",
      url: "N/A - Calculated locally",
      updateFrequency: "Real-time calculation",
      icon: "🌊"
    },
    {
      name: "Aurora Verdict System",
      description: "Combines all data sources to produce hunting recommendations.",
      url: "N/A - Calculated locally",
      updateFrequency: "Real-time calculation",
      icon: "🎯"
    }
  ];

  const supportingSources = [
    {
      name: "Open-Meteo Weather API",
      description: "Cloud Cover, Wind, Humidity, Precipitation Forecasts",
      url: "https://api.open-meteo.com/",
      updateFrequency: "Hourly updates",
      icon: "☁️"
    },
    {
      name: "Sunrise-Sunset.org API",
      description: "Sunrise, Sunset, and Twilight Times",
      url: "https://api.sunrise-sunset.org/",
      updateFrequency: "Daily calculations",
      icon: "🌅"
    },
    {
      name: "Moon Phase API",
      description: "Moon Phase and Illumination Data",
      url: "https://api.farmsense.net/",
      updateFrequency: "Real-time calculations",
      icon: "🌙"
    },
    {
      name: "OpenStreetMap Nominatim",
      description: "Location Search and Geocoding",
      url: "https://nominatim.openstreetmap.org/",
      updateFrequency: "Real-time queries",
      icon: "🗺️"
    },
    {
      name: "OSRM Routing Engine",
      description: "Drive Time and Distance Calculations",
      url: "https://router.project-osrm.org/",
      updateFrequency: "Real-time calculations",
      icon: "🚗"
    },
    {
      name: "Bortle Scale Calculation",
      description: "Light Pollution Classification (Algorithm-based)",
      url: "N/A - Calculated locally",
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

        {/* Space Weather Sources */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-aurora-green mb-4 flex items-center gap-2">
            <span>🛰️</span> Space Weather Data
          </h2>
          <div className="space-y-4">
            {spaceWeatherSources.map((source, index) => (
              <SourceCard key={index} source={source} />
            ))}
          </div>
        </div>

        {/* Aurora Intelligence Sources */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-aurora-purple mb-4 flex items-center gap-2">
            <span>🧠</span> Aurora Intelligence (Proprietary)
          </h2>
          <div className="space-y-4">
            {auroraIntelligenceSources.map((source, index) => (
              <SourceCard key={index} source={source} />
            ))}
          </div>
        </div>

        {/* Supporting Data Sources */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-aurora-blue mb-4 flex items-center gap-2">
            <span>📍</span> Supporting Data
          </h2>
          <div className="space-y-4">
            {supportingSources.map((source, index) => (
              <SourceCard key={index} source={source} />
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 bg-indigo-900/20 rounded-xl p-4 border border-indigo-500/20">
          <div className="text-sm text-gray-300 text-center space-y-2">
            <p>
              <span className="font-semibold">13 Data Sources</span> • <span className="font-semibold">4 External APIs</span> • <span className="font-semibold">3 Proprietary Algorithms</span>
            </p>
            <p>
              Aurora Addict combines real-time space weather data with advanced aurora science including
              Newell Coupling, substorm phase detection, and high-resolution Hp30 indices to deliver
              the most accurate aurora predictions available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
