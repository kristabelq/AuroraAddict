"use client";

import { useMemo, useState, useEffect } from "react";
import {
  findNearestDarkSites,
  formatDriveTime,
  getBortleColor,
  getBortleDescription,
  getCountryFlag,
  type DarkSkySiteWithDistance,
} from "@/lib/darkSkySites";

interface DarkSkySiteFinderProps {
  latitude?: number;
  longitude?: number;
  className?: string;
  maxDistance?: number; // km
  maxSites?: number;
  onSiteSelect?: (site: DarkSkySiteWithDistance) => void;
}

interface CloudCoverData {
  cloudCover: number;
  description: string;
}

export function DarkSkySiteFinder({
  latitude,
  longitude,
  className = "",
  maxDistance = 300,
  maxSites = 5,
  onSiteSelect,
}: DarkSkySiteFinderProps) {
  const [cloudCover, setCloudCover] = useState<Map<string, CloudCoverData>>(new Map());
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Find nearest dark sky sites
  const nearestSites = useMemo(() => {
    if (!latitude || !longitude) return [];
    return findNearestDarkSites(latitude, longitude, maxSites, maxDistance, 5);
  }, [latitude, longitude, maxSites, maxDistance]);

  // Fetch cloud cover
  useEffect(() => {
    if (nearestSites.length === 0) return;

    const fetchCloudCover = async () => {
      setIsLoadingCloud(true);
      try {
        const response = await fetch("/api/weather/cloud-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locations: nearestSites.map(site => ({
              lat: site.latitude,
              lon: site.longitude,
              name: site.name,
            })),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newCloudCover = new Map<string, CloudCoverData>();
          data.results.forEach((result: { name: string; cloudCover?: number; description?: string }) => {
            if (result.cloudCover !== undefined) {
              newCloudCover.set(result.name, {
                cloudCover: result.cloudCover,
                description: result.description || "",
              });
            }
          });
          setCloudCover(newCloudCover);
        }
      } catch (error) {
        console.error("Error fetching cloud cover:", error);
      }
      setIsLoadingCloud(false);
    };

    fetchCloudCover();
  }, [nearestSites]);

  const getCloudCoverColor = (cloudPercent: number) => {
    if (cloudPercent < 20) return "text-green-400";
    if (cloudPercent < 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getCloudCoverBg = (cloudPercent: number) => {
    if (cloudPercent < 20) return "bg-green-500/10";
    if (cloudPercent < 50) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  // Sort sites by cloud cover if available (prefer clearer skies)
  const sortedSites = useMemo(() => {
    return [...nearestSites].sort((a, b) => {
      const cloudA = cloudCover.get(a.name)?.cloudCover ?? 100;
      const cloudB = cloudCover.get(b.name)?.cloudCover ?? 100;
      // Primary sort by cloud cover, secondary by distance
      if (Math.abs(cloudA - cloudB) > 20) {
        return cloudA - cloudB;
      }
      return a.distanceKm - b.distanceKm;
    });
  }, [nearestSites, cloudCover]);

  const displayedSites = showAll ? sortedSites : sortedSites.slice(0, 3);

  if (!latitude || !longitude) {
    return (
      <div className={`bg-white/5 rounded-xl p-4 border border-white/10 ${className}`}>
        <div className="text-center text-gray-400">
          <p>Enable location to find nearby dark sky sites</p>
        </div>
      </div>
    );
  }

  if (nearestSites.length === 0) {
    return (
      <div className={`bg-white/5 rounded-xl p-4 border border-white/10 ${className}`}>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>🌌</span>
          <span>Dark Sky Sites</span>
        </h3>
        <div className="text-center text-gray-400 py-4">
          <p>No dark sky sites found within {maxDistance}km</p>
          <p className="text-xs mt-1">Try the Trip tab for destinations further away</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 rounded-xl p-4 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>🌌</span>
          <span>Nearby Dark Sky Sites</span>
        </h3>
        {isLoadingCloud && (
          <span className="text-xs text-gray-500">Loading weather...</span>
        )}
      </div>

      <div className="space-y-2">
        {displayedSites.map((site, index) => {
          const siteCloud = cloudCover.get(site.name);
          const isBestChoice = index === 0 && siteCloud && siteCloud.cloudCover < 30;

          return (
            <div
              key={site.name}
              onClick={() => onSiteSelect?.(site)}
              className={`rounded-lg p-3 border transition-all cursor-pointer hover:bg-white/5 ${
                isBestChoice
                  ? "bg-green-900/20 border-green-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCountryFlag(site.countryCode)}</span>
                  <div>
                    <div className="font-medium text-white text-sm flex items-center gap-2">
                      {site.name}
                      {isBestChoice && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                          Best Choice
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{site.region}, {site.country}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Distance</div>
                  <div className="text-white font-medium">{site.distanceKm} km</div>
                </div>
                <div>
                  <div className="text-gray-500">Drive</div>
                  <div className="text-white font-medium">{formatDriveTime(site.driveTimeMinutes)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Darkness</div>
                  <div className="font-medium" style={{ color: getBortleColor(site.bortleClass) }}>
                    Bortle {site.bortleClass}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Clouds</div>
                  {siteCloud ? (
                    <div className={`font-medium ${getCloudCoverColor(siteCloud.cloudCover)}`}>
                      {siteCloud.cloudCover}%
                    </div>
                  ) : (
                    <div className="text-gray-500">--</div>
                  )}
                </div>
              </div>

              {site.notes && (
                <div className="mt-2 text-[10px] text-gray-500 italic">
                  {site.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sortedSites.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 text-sm text-aurora-green hover:underline"
        >
          {showAll ? "Show less" : `Show ${sortedSites.length - 3} more sites`}
        </button>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="text-[10px] text-gray-500 mb-2">Bortle Scale (Sky Darkness)</div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map(b => (
            <div key={b} className="flex items-center gap-1 text-[10px]">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getBortleColor(b) }}
              />
              <span className="text-gray-400">{b}: {getBortleDescription(b).split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
