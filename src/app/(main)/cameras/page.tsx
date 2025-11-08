"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface AuroraCamera {
  id: string;
  name: string;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  updateFrequency: string;
  provider: string;
  timezone: string;
  useProxy?: boolean;
}

// Curated list of free, publicly accessible aurora cameras
const AURORA_CAMERAS: AuroraCamera[] = [
  {
    id: "yellowknife-canada",
    name: "Yellowknife Aurora Cam",
    location: "Yellowknife, Northwest Territories",
    country: "Canada",
    latitude: 62.4540,
    longitude: -114.3718,
    imageUrl: "https://auroramax.com/images/latest-images/latest_1024_n.jpg",
    updateFrequency: "Every 6 seconds",
    provider: "AuroraMAX",
    timezone: "MST",
    useProxy: false
  },
  {
    id: "poker-flat-alaska",
    name: "Poker Flat All-Sky Camera",
    location: "Fairbanks, Alaska",
    country: "USA",
    latitude: 65.1264,
    longitude: -147.4769,
    imageUrl: "https://www.gi.alaska.edu/monitors/poker-flat/images/DASC_PSFC_20120101_000000_0000_all.jpg",
    updateFrequency: "Every minute",
    provider: "University of Alaska Geophysical Institute",
    timezone: "AKST",
    useProxy: false
  },
  {
    id: "skibotn-norway",
    name: "Skibotn Aurora Observatory",
    location: "Skibotn, Troms",
    country: "Norway",
    latitude: 69.3486,
    longitude: 20.3639,
    imageUrl: "https://site.uit.no/spaceweather/files/2024/01/current.jpg",
    updateFrequency: "Every 10 minutes",
    provider: "UiT The Arctic University of Norway",
    timezone: "CET",
    useProxy: false
  },
  {
    id: "abisko-sweden",
    name: "Abisko Aurora Sky Station",
    location: "Abisko, Lapland",
    country: "Sweden",
    latitude: 68.35,
    longitude: 18.83,
    imageUrl: "https://www.aurora-service.eu/aurora-school/webcam_03.jpg",
    updateFrequency: "Every 5 minutes",
    provider: "Lights Over Lapland",
    timezone: "CET",
    useProxy: false
  },
  {
    id: "churchill-canada",
    name: "Churchill Aurora Cam",
    location: "Churchill, Manitoba",
    country: "Canada",
    latitude: 58.7684,
    longitude: -94.1648,
    imageUrl: "https://explore.org/cams/player/northern-lights-cam/asset/66f0e3b2d0c95503db90f8e7",
    updateFrequency: "Live stream",
    provider: "Explore.org",
    timezone: "CST",
    useProxy: false
  },
  {
    id: "sodankyla-finland",
    name: "Sodankylä All-Sky Camera",
    location: "Sodankylä, Lapland",
    country: "Finland",
    latitude: 67.3671,
    longitude: 26.6290,
    imageUrl: "https://www.sgo.fi/pub/Asky_cameras/Sodankyla/latest.jpg",
    updateFrequency: "Every minute",
    provider: "Sodankylä Geophysical Observatory",
    timezone: "EET",
    useProxy: false
  },
  {
    id: "kiruna-sweden",
    name: "Kiruna All-Sky Camera",
    location: "Kiruna, Lapland",
    country: "Sweden",
    latitude: 67.8558,
    longitude: 20.2253,
    imageUrl: "https://www2.irf.se/Observatory/All-sky/Kiruna/movie/latest.jpg",
    updateFrequency: "Every minute",
    provider: "Swedish Institute of Space Physics",
    timezone: "CET",
    useProxy: false
  },
  {
    id: "longyearbyen-svalbard",
    name: "Longyearbyen Aurora Station",
    location: "Longyearbyen, Svalbard",
    country: "Norway",
    latitude: 78.2232,
    longitude: 15.6267,
    imageUrl: "https://kho.unis.no/Quicklooks/RecentData/allsky/latest.jpg",
    updateFrequency: "Every 2 minutes",
    provider: "UNIS Kjell Henriksen Observatory",
    timezone: "CET",
    useProxy: false
  },
  {
    id: "tromso-norway",
    name: "Tromsø All-Sky Camera",
    location: "Tromsø, Troms",
    country: "Norway",
    latitude: 69.6492,
    longitude: 18.9553,
    imageUrl: "https://site.uit.no/spaceweather/files/2024/01/current_tromso.jpg",
    updateFrequency: "Every 10 minutes",
    provider: "UiT Space Physics",
    timezone: "CET",
    useProxy: false
  }
];

export default function CamerasPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<{ [key: string]: Date }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh images every 60 seconds
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      // Reset error states on refresh
      setImageErrors({});
    }, 60000);

    return () => clearInterval(refreshTimer);
  }, []);

  const handleImageLoad = (cameraId: string) => {
    setLastUpdated(prev => ({
      ...prev,
      [cameraId]: new Date()
    }));
    setImageErrors(prev => ({
      ...prev,
      [cameraId]: false
    }));
  };

  const handleImageError = (cameraId: string) => {
    console.log(`Camera ${cameraId} failed to load`);
    setImageErrors(prev => ({
      ...prev,
      [cameraId]: true
    }));
  };

  const getImageUrl = (camera: AuroraCamera) => {
    // Always use proxy to handle CORS and caching issues
    const timestamp = Date.now();
    return `/api/camera-proxy?url=${encodeURIComponent(camera.imageUrl)}&t=${timestamp}&refresh=${refreshKey}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e17] via-[#1a1f2e] to-[#0a0e17] px-4 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-aurora-green via-aurora-blue to-aurora-purple bg-clip-text text-transparent mb-4">
          Live Aurora Cameras
        </h1>
        <p className="text-gray-400 text-lg mb-2">
          Real-time aurora views from cameras around the Arctic Circle
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live • Auto-refreshing every 60 seconds</span>
          </div>
          <span className="mx-2">|</span>
          <span>Current Time (UTC): {format(currentTime, "PPpp")}</span>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AURORA_CAMERAS.map((camera) => (
          <div
            key={camera.id}
            className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 hover:border-aurora-green/50 transition-all duration-300"
          >
            {/* Camera Image */}
            <div className="relative aspect-video bg-black/50">
              {!imageErrors[camera.id] ? (
                <img
                  src={getImageUrl(camera)}
                  alt={`${camera.name} live view`}
                  className="w-full h-full object-cover"
                  onLoad={() => handleImageLoad(camera.id)}
                  onError={() => handleImageError(camera.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm">Camera offline or daytime</p>
                    <p className="text-xs mt-1 text-gray-600">Check back during nighttime hours</p>
                  </div>
                </div>
              )}

              {/* Live Indicator */}
              {!imageErrors[camera.id] && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-semibold">LIVE</span>
                </div>
              )}

              {/* Update Frequency */}
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-white text-xs">{camera.updateFrequency}</span>
              </div>
            </div>

            {/* Camera Info */}
            <div className="p-4">
              <h3 className="text-xl font-semibold text-white mb-1">
                {camera.name}
              </h3>
              <p className="text-aurora-green text-sm mb-3">
                {camera.location}, {camera.country}
              </p>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{camera.latitude.toFixed(4)}°N, {Math.abs(camera.longitude).toFixed(4)}°{camera.longitude >= 0 ? 'E' : 'W'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {lastUpdated[camera.id]
                      ? `Updated: ${format(lastUpdated[camera.id], "HH:mm:ss")}`
                      : "Loading..."}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs">{camera.provider}</span>
                </div>
              </div>

              {/* Timezone Badge */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <span className="inline-block bg-white/10 px-2 py-1 rounded text-xs text-gray-300">
                  {camera.timezone} Timezone
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="max-w-7xl mx-auto mt-12 p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-3">About These Cameras</h2>
        <div className="text-gray-400 space-y-2">
          <p>
            These aurora cameras are located in prime viewing locations around the Arctic Circle,
            providing real-time views of the northern lights when they appear.
          </p>
          <p>
            <strong className="text-white">Best viewing times:</strong> Cameras are most active
            during local nighttime hours (typically 9 PM - 3 AM local time). Aurora activity
            increases during geomagnetic storms.
          </p>
          <p>
            <strong className="text-white">Note:</strong> Camera availability depends on weather
            conditions, daylight hours, and technical maintenance. Many cameras show "offline" during
            summer months when there isn't sufficient darkness for aurora viewing (May-August in the Arctic).
          </p>
          <p>
            <strong className="text-white">Current Season:</strong> October is excellent for aurora viewing
            as the nights are getting longer in the Arctic regions!
          </p>
        </div>
      </div>
    </div>
  );
}
