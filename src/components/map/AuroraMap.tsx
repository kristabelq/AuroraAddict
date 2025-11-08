"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Rectangle, Circle, Polygon } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { differenceInHours, format, parseISO } from "date-fns";
import { formatInTimeZone, getTimezoneOffset } from "date-fns-tz";
import toast from "react-hot-toast";
import SunCalc from "suncalc";
import { formatLocationWithFlag } from "@/utils/location";
import { getGMTOffsetString, formatHuntDate } from "@/utils/timezone";

interface Sighting {
  id: string;
  latitude: number;
  longitude: number;
  location: string;
  sightingDate: string;
  createdAt: string;
  user: {
    name: string;
    image: string;
  };
  images: string[];
}

interface Hunt {
  id: string;
  name: string;
  userId: string;
  latitude: number;
  longitude: number;
  location: string;
  startDate: string;
  timezone?: string | null;
  coverImage?: string | null;
  participants: number;
  isUserParticipant?: boolean;
  user: {
    name: string;
    image: string;
  };
}

// Component to handle initial map centering to user's location
function InitialLocation({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    // Check if map is ready
    if (!map) {
      return;
    }

    // Only try geolocation if available
    if (navigator.geolocation) {
      // Add a delay to ensure map is fully initialized
      const timer = setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (latitude && longitude) {
              try {
                // Use flyTo instead of setView for smoother transition
                map.flyTo([latitude, longitude], 10, {
                  duration: 1.5,
                  animate: true
                });
                onLocationFound(latitude, longitude);
              } catch (error) {
                console.error("Error setting map view:", error);
              }
            }
          },
          (error) => {
            console.log("Geolocation denied or unavailable, using default location");
          },
          {
            timeout: 5000,
            maximumAge: 0
          }
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [map, onLocationFound]);

  return null;
}

// Component to handle map centering
function LocationButton() {
  const map = useMap();

  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        map.setView([position.coords.latitude, position.coords.longitude], 10);
      });
    }
  };

  return (
    <button
      onClick={centerOnUserLocation}
      className="absolute bottom-4 right-4 z-[1000] bg-white/10 backdrop-blur-lg p-3 rounded-full hover:bg-white/20 transition-colors"
    >
      <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
      </svg>
    </button>
  );
}

interface AuroraData {
  coordinates: [number, number, number][]; // [lon, lat, intensity]
  observation_time: string;
  forecast_time: string;
}

// Comprehensive light pollution data based on population density and urban areas
// This creates a grid of light pollution zones across the globe
const generateLightPollutionGrid = () => {
  const grid: Array<{ lat: number; lng: number; intensity: number }> = [];

  // Comprehensive global light pollution sources (intensity 0-10 scale)
  const pollutionSources = [
    // === NORTH AMERICA ===
    // USA - Major metros
    { lat: 40.7, lng: -74.0, intensity: 10, radius: 4 }, // NYC
    { lat: 34.0, lng: -118.2, intensity: 10, radius: 4 }, // LA
    { lat: 41.9, lng: -87.6, intensity: 9, radius: 3.5 }, // Chicago
    { lat: 29.8, lng: -95.4, intensity: 8, radius: 3 }, // Houston
    { lat: 33.4, lng: -112.1, intensity: 8, radius: 3 }, // Phoenix
    { lat: 40.0, lng: -75.2, intensity: 9, radius: 3 }, // Philadelphia
    { lat: 32.8, lng: -96.8, intensity: 8, radius: 2.5 }, // Dallas
    { lat: 37.8, lng: -122.4, intensity: 9, radius: 3 }, // San Francisco
    { lat: 42.4, lng: -71.1, intensity: 8, radius: 2.5 }, // Boston
    { lat: 33.5, lng: -112.1, intensity: 8, radius: 2.5 }, // Phoenix
    { lat: 47.6, lng: -122.3, intensity: 8, radius: 2.5 }, // Seattle
    { lat: 38.9, lng: -77.0, intensity: 8, radius: 2.5 }, // Washington DC
    { lat: 42.3, lng: -83.0, intensity: 7, radius: 2 }, // Detroit
    { lat: 39.3, lng: -76.6, intensity: 7, radius: 2 }, // Baltimore
    { lat: 38.6, lng: -90.2, intensity: 6, radius: 1.5 }, // St Louis
    { lat: 39.7, lng: -104.9, intensity: 7, radius: 2 }, // Denver
    { lat: 36.2, lng: -115.1, intensity: 8, radius: 2 }, // Las Vegas
    { lat: 33.4, lng: -111.9, intensity: 7, radius: 2 }, // Scottsdale
    { lat: 25.8, lng: -80.2, intensity: 8, radius: 2.5 }, // Miami
    { lat: 28.5, lng: -81.4, intensity: 7, radius: 2 }, // Orlando
    { lat: 35.2, lng: -80.8, intensity: 6, radius: 1.5 }, // Charlotte
    { lat: 33.7, lng: -84.4, intensity: 8, radius: 2.5 }, // Atlanta
    { lat: 30.3, lng: -81.7, intensity: 6, radius: 1.5 }, // Jacksonville
    { lat: 35.1, lng: -90.0, intensity: 6, radius: 1.5 }, // Memphis
    { lat: 36.2, lng: -86.8, intensity: 6, radius: 1.5 }, // Nashville
    { lat: 39.1, lng: -84.5, intensity: 6, radius: 1.5 }, // Cincinnati
    { lat: 39.8, lng: -86.1, intensity: 6, radius: 1.5 }, // Indianapolis
    { lat: 43.0, lng: -88.0, intensity: 6, radius: 1.5 }, // Milwaukee
    { lat: 44.9, lng: -93.3, intensity: 7, radius: 2 }, // Minneapolis
    { lat: 39.0, lng: -94.6, intensity: 6, radius: 1.5 }, // Kansas City
    { lat: 35.5, lng: -97.5, intensity: 6, radius: 1.5 }, // Oklahoma City
    { lat: 29.4, lng: -98.5, intensity: 7, radius: 2 }, // San Antonio
    { lat: 30.3, lng: -97.7, intensity: 7, radius: 2 }, // Austin
    { lat: 32.7, lng: -117.2, intensity: 8, radius: 2.5 }, // San Diego
    { lat: 37.3, lng: -121.9, intensity: 8, radius: 2.5 }, // San Jose
    { lat: 38.6, lng: -121.5, intensity: 6, radius: 1.5 }, // Sacramento
    { lat: 45.5, lng: -122.7, intensity: 7, radius: 2 }, // Portland
    { lat: 40.8, lng: -111.9, intensity: 6, radius: 1.5 }, // Salt Lake City
    { lat: 35.1, lng: -106.6, intensity: 5, radius: 1 }, // Albuquerque
    { lat: 33.4, lng: -112.1, intensity: 7, radius: 2 }, // Phoenix
    { lat: 61.2, lng: -149.9, intensity: 5, radius: 1.2 }, // Anchorage
    { lat: 64.8, lng: -147.7, intensity: 4, radius: 0.8 }, // Fairbanks

    // Canada
    { lat: 43.7, lng: -79.4, intensity: 9, radius: 3 }, // Toronto
    { lat: 45.5, lng: -73.6, intensity: 8, radius: 2.5 }, // Montreal
    { lat: 49.3, lng: -123.1, intensity: 7, radius: 2 }, // Vancouver
    { lat: 51.0, lng: -114.1, intensity: 7, radius: 2 }, // Calgary
    { lat: 53.5, lng: -113.5, intensity: 6, radius: 1.5 }, // Edmonton
    { lat: 45.4, lng: -75.7, intensity: 6, radius: 1.5 }, // Ottawa
    { lat: 43.3, lng: -79.8, intensity: 6, radius: 1.5 }, // Hamilton
    { lat: 46.8, lng: -71.2, intensity: 5, radius: 1 }, // Quebec City
    { lat: 49.9, lng: -97.1, intensity: 6, radius: 1.5 }, // Winnipeg
    { lat: 62.5, lng: -114.4, intensity: 3, radius: 0.6 }, // Yellowknife

    // Mexico
    { lat: 19.4, lng: -99.1, intensity: 10, radius: 4 }, // Mexico City
    { lat: 20.7, lng: -103.4, intensity: 8, radius: 2.5 }, // Guadalajara
    { lat: 25.7, lng: -100.3, intensity: 7, radius: 2 }, // Monterrey

    // === EUROPE ===
    // UK
    { lat: 51.5, lng: -0.1, intensity: 10, radius: 4 }, // London
    { lat: 53.5, lng: -2.2, intensity: 8, radius: 2.5 }, // Manchester
    { lat: 53.8, lng: -1.5, intensity: 7, radius: 2 }, // Leeds
    { lat: 52.5, lng: -1.9, intensity: 8, radius: 2.5 }, // Birmingham
    { lat: 53.4, lng: -3.0, intensity: 7, radius: 2 }, // Liverpool
    { lat: 55.9, lng: -3.2, intensity: 7, radius: 2 }, // Edinburgh
    { lat: 55.9, lng: -4.3, intensity: 7, radius: 2 }, // Glasgow

    // France
    { lat: 48.9, lng: 2.4, intensity: 10, radius: 4 }, // Paris
    { lat: 45.8, lng: 4.8, intensity: 7, radius: 2 }, // Lyon
    { lat: 43.3, lng: 5.4, intensity: 7, radius: 2 }, // Marseille
    { lat: 43.6, lng: 1.4, intensity: 6, radius: 1.5 }, // Toulouse
    { lat: 44.8, lng: -0.6, intensity: 6, radius: 1.5 }, // Bordeaux

    // Germany
    { lat: 52.5, lng: 13.4, intensity: 9, radius: 3 }, // Berlin
    { lat: 48.1, lng: 11.6, intensity: 8, radius: 2.5 }, // Munich
    { lat: 50.1, lng: 8.7, intensity: 8, radius: 2.5 }, // Frankfurt
    { lat: 53.6, lng: 10.0, intensity: 7, radius: 2 }, // Hamburg
    { lat: 51.2, lng: 6.8, intensity: 7, radius: 2 }, // Düsseldorf
    { lat: 50.9, lng: 6.9, intensity: 7, radius: 2 }, // Cologne

    // Spain
    { lat: 40.4, lng: -3.7, intensity: 9, radius: 3 }, // Madrid
    { lat: 41.4, lng: 2.2, intensity: 8, radius: 2.5 }, // Barcelona
    { lat: 37.4, lng: -5.9, intensity: 6, radius: 1.5 }, // Seville
    { lat: 39.5, lng: -0.4, intensity: 6, radius: 1.5 }, // Valencia

    // Italy
    { lat: 41.9, lng: 12.5, intensity: 9, radius: 3 }, // Rome
    { lat: 45.5, lng: 9.2, intensity: 9, radius: 3 }, // Milan
    { lat: 40.9, lng: 14.3, intensity: 7, radius: 2 }, // Naples
    { lat: 45.4, lng: 12.3, intensity: 6, radius: 1.5 }, // Venice
    { lat: 43.8, lng: 11.2, intensity: 6, radius: 1.5 }, // Florence

    // Netherlands
    { lat: 52.4, lng: 4.9, intensity: 9, radius: 2.5 }, // Amsterdam
    { lat: 51.9, lng: 4.5, intensity: 8, radius: 2 }, // Rotterdam
    { lat: 52.1, lng: 5.1, intensity: 6, radius: 1.5 }, // Utrecht

    // Belgium
    { lat: 50.8, lng: 4.4, intensity: 8, radius: 2 }, // Brussels
    { lat: 51.2, lng: 4.4, intensity: 7, radius: 1.5 }, // Antwerp

    // Scandinavia
    { lat: 59.3, lng: 18.1, intensity: 7, radius: 2 }, // Stockholm
    { lat: 60.2, lng: 24.9, intensity: 7, radius: 2 }, // Helsinki
    { lat: 59.9, lng: 10.8, intensity: 7, radius: 2 }, // Oslo
    { lat: 55.7, lng: 12.6, intensity: 7, radius: 2 }, // Copenhagen
    { lat: 64.1, lng: -21.9, intensity: 4, radius: 0.8 }, // Reykjavik
    { lat: 69.6, lng: 18.9, intensity: 4, radius: 0.7 }, // Tromsø
    { lat: 63.4, lng: 10.4, intensity: 5, radius: 1 }, // Trondheim
    { lat: 60.4, lng: 5.3, intensity: 5, radius: 1 }, // Bergen

    // Eastern Europe
    { lat: 52.2, lng: 21.0, intensity: 8, radius: 2.5 }, // Warsaw
    { lat: 50.1, lng: 14.4, intensity: 7, radius: 2 }, // Prague
    { lat: 47.5, lng: 19.0, intensity: 7, radius: 2 }, // Budapest
    { lat: 48.2, lng: 16.4, intensity: 7, radius: 2 }, // Vienna
    { lat: 50.1, lng: 19.9, intensity: 6, radius: 1.5 }, // Krakow
    { lat: 44.4, lng: 26.1, intensity: 7, radius: 2 }, // Bucharest

    // Switzerland & Austria
    { lat: 47.4, lng: 8.5, intensity: 7, radius: 1.5 }, // Zurich
    { lat: 46.9, lng: 7.4, intensity: 5, radius: 1 }, // Bern
    { lat: 46.2, lng: 6.1, intensity: 6, radius: 1.2 }, // Geneva

    // Portugal
    { lat: 38.7, lng: -9.1, intensity: 7, radius: 2 }, // Lisbon
    { lat: 41.2, lng: -8.6, intensity: 6, radius: 1.5 }, // Porto

    // Greece
    { lat: 38.0, lng: 23.7, intensity: 8, radius: 2.5 }, // Athens

    // === RUSSIA & EASTERN ASIA ===
    { lat: 55.8, lng: 37.6, intensity: 10, radius: 4 }, // Moscow
    { lat: 59.9, lng: 30.3, intensity: 9, radius: 3 }, // St Petersburg
    { lat: 56.8, lng: 60.6, intensity: 7, radius: 2 }, // Yekaterinburg
    { lat: 55.0, lng: 82.9, intensity: 7, radius: 2 }, // Novosibirsk
    { lat: 68.97, lng: 33.1, intensity: 5, radius: 1 }, // Murmansk
    { lat: 64.5, lng: 40.5, intensity: 4, radius: 0.8 }, // Arkhangelsk

    // === ASIA ===
    // Japan
    { lat: 35.7, lng: 139.7, intensity: 10, radius: 5 }, // Tokyo
    { lat: 34.7, lng: 135.5, intensity: 9, radius: 3.5 }, // Osaka
    { lat: 35.0, lng: 135.8, intensity: 7, radius: 2 }, // Kyoto
    { lat: 35.2, lng: 136.9, intensity: 7, radius: 2 }, // Nagoya
    { lat: 43.1, lng: 141.4, intensity: 7, radius: 2 }, // Sapporo
    { lat: 34.4, lng: 132.5, intensity: 6, radius: 1.5 }, // Hiroshima

    // China
    { lat: 39.9, lng: 116.4, intensity: 10, radius: 5 }, // Beijing
    { lat: 31.2, lng: 121.5, intensity: 10, radius: 5 }, // Shanghai
    { lat: 22.3, lng: 114.2, intensity: 9, radius: 3 }, // Hong Kong
    { lat: 23.1, lng: 113.3, intensity: 9, radius: 3.5 }, // Guangzhou
    { lat: 22.5, lng: 114.1, intensity: 9, radius: 3 }, // Shenzhen
    { lat: 30.6, lng: 114.3, intensity: 8, radius: 2.5 }, // Wuhan
    { lat: 29.6, lng: 106.5, intensity: 8, radius: 2.5 }, // Chongqing
    { lat: 30.3, lng: 120.2, intensity: 8, radius: 2.5 }, // Hangzhou
    { lat: 23.1, lng: 113.2, intensity: 8, radius: 2.5 }, // Guangzhou
    { lat: 36.7, lng: 117.0, intensity: 7, radius: 2 }, // Jinan
    { lat: 34.3, lng: 108.9, intensity: 7, radius: 2 }, // Xi'an
    { lat: 39.1, lng: 117.2, intensity: 7, radius: 2 }, // Tianjin

    // South Korea
    { lat: 37.6, lng: 127.0, intensity: 10, radius: 4 }, // Seoul
    { lat: 35.2, lng: 129.1, intensity: 8, radius: 2.5 }, // Busan

    // India
    { lat: 28.6, lng: 77.2, intensity: 10, radius: 4 }, // Delhi
    { lat: 19.1, lng: 72.9, intensity: 10, radius: 4 }, // Mumbai
    { lat: 12.9, lng: 77.6, intensity: 9, radius: 3 }, // Bangalore
    { lat: 22.6, lng: 88.4, intensity: 9, radius: 3 }, // Kolkata
    { lat: 13.1, lng: 80.3, intensity: 8, radius: 2.5 }, // Chennai
    { lat: 17.4, lng: 78.5, intensity: 8, radius: 2.5 }, // Hyderabad
    { lat: 23.0, lng: 72.6, intensity: 7, radius: 2 }, // Ahmedabad
    { lat: 19.0, lng: 73.0, intensity: 7, radius: 2 }, // Pune

    // Southeast Asia
    { lat: 1.3, lng: 103.8, intensity: 9, radius: 2.5 }, // Singapore
    { lat: 13.7, lng: 100.5, intensity: 9, radius: 3 }, // Bangkok
    { lat: -6.2, lng: 106.8, intensity: 9, radius: 3 }, // Jakarta
    { lat: 3.1, lng: 101.7, intensity: 8, radius: 2.5 }, // Kuala Lumpur
    { lat: 14.6, lng: 121.0, intensity: 8, radius: 2.5 }, // Manila
    { lat: 10.8, lng: 106.7, intensity: 7, radius: 2 }, // Ho Chi Minh City
    { lat: 21.0, lng: 105.8, intensity: 7, radius: 2 }, // Hanoi

    // Middle East
    { lat: 25.3, lng: 55.3, intensity: 9, radius: 3 }, // Dubai
    { lat: 24.5, lng: 54.4, intensity: 8, radius: 2 }, // Abu Dhabi
    { lat: 33.9, lng: 35.5, intensity: 7, radius: 2 }, // Beirut
    { lat: 31.8, lng: 35.2, intensity: 7, radius: 1.5 }, // Jerusalem
    { lat: 32.1, lng: 34.8, intensity: 8, radius: 2 }, // Tel Aviv
    { lat: 33.3, lng: 44.4, intensity: 7, radius: 2 }, // Baghdad
    { lat: 35.7, lng: 51.4, intensity: 9, radius: 3 }, // Tehran
    { lat: 29.4, lng: 47.7, intensity: 7, radius: 2 }, // Kuwait City
    { lat: 26.2, lng: 50.6, intensity: 6, radius: 1.5 }, // Manama
    { lat: 24.7, lng: 46.7, intensity: 8, radius: 2.5 }, // Riyadh
    { lat: 21.5, lng: 39.2, intensity: 7, radius: 2 }, // Jeddah

    // === AUSTRALIA & OCEANIA ===
    { lat: -33.9, lng: 151.2, intensity: 9, radius: 3 }, // Sydney
    { lat: -37.8, lng: 144.9, intensity: 9, radius: 3 }, // Melbourne
    { lat: -27.5, lng: 153.0, intensity: 7, radius: 2 }, // Brisbane
    { lat: -31.9, lng: 115.9, intensity: 7, radius: 2 }, // Perth
    { lat: -34.9, lng: 138.6, intensity: 6, radius: 1.5 }, // Adelaide
    { lat: -41.3, lng: 174.8, intensity: 5, radius: 1 }, // Wellington
    { lat: -36.8, lng: 174.7, intensity: 6, radius: 1.5 }, // Auckland

    // === AFRICA ===
    { lat: 30.0, lng: 31.2, intensity: 9, radius: 3 }, // Cairo
    { lat: -26.2, lng: 28.0, intensity: 8, radius: 2.5 }, // Johannesburg
    { lat: -33.9, lng: 18.4, intensity: 7, radius: 2 }, // Cape Town
    { lat: 6.5, lng: 3.4, intensity: 8, radius: 2 }, // Lagos
    { lat: -1.3, lng: 36.8, intensity: 7, radius: 1.5 }, // Nairobi
    { lat: 33.6, lng: -7.6, intensity: 7, radius: 2 }, // Casablanca
    { lat: 36.8, lng: 10.2, intensity: 6, radius: 1.5 }, // Tunis
    { lat: 36.7, lng: 3.1, intensity: 7, radius: 2 }, // Algiers
    { lat: 15.6, lng: 32.5, intensity: 5, radius: 1 }, // Khartoum
    { lat: 9.0, lng: 38.7, intensity: 6, radius: 1.2 }, // Addis Ababa

    // === SOUTH AMERICA ===
    { lat: -23.5, lng: -46.6, intensity: 10, radius: 4 }, // São Paulo
    { lat: -22.9, lng: -43.2, intensity: 9, radius: 3 }, // Rio de Janeiro
    { lat: -34.6, lng: -58.4, intensity: 9, radius: 3 }, // Buenos Aires
    { lat: -12.0, lng: -77.0, intensity: 8, radius: 2.5 }, // Lima
    { lat: 4.7, lng: -74.1, intensity: 8, radius: 2.5 }, // Bogotá
    { lat: -33.4, lng: -70.7, intensity: 8, radius: 2.5 }, // Santiago
    { lat: 10.5, lng: -66.9, intensity: 7, radius: 2 }, // Caracas
    { lat: -3.1, lng: -60.0, intensity: 6, radius: 1.5 }, // Manaus
    { lat: -15.8, lng: -47.9, intensity: 7, radius: 2 }, // Brasília
  ];

  // Generate grid cells around each pollution source
  pollutionSources.forEach(source => {
    const steps = Math.ceil(source.radius * 4); // More granular grid
    for (let latOffset = -steps; latOffset <= steps; latOffset++) {
      for (let lngOffset = -steps; lngOffset <= steps; lngOffset++) {
        const lat = source.lat + (latOffset * 0.5);
        const lng = source.lng + (lngOffset * 0.5);

        // Calculate distance from source
        const distance = Math.sqrt(latOffset ** 2 + lngOffset ** 2) / 4;

        if (distance <= source.radius) {
          // Intensity decreases with distance from source
          const falloff = 1 - (distance / source.radius);
          const intensity = source.intensity * falloff;

          if (intensity > 0.5) { // Only add if significant intensity
            grid.push({ lat, lng, intensity });
          }
        }
      }
    }
  });

  return grid;
};

// Lazy initialization - only generate when needed
let lightPollutionGrid: Array<{ lat: number; lng: number; intensity: number }> | null = null;
const getLightPollutionGrid = () => {
  if (!lightPollutionGrid) {
    lightPollutionGrid = generateLightPollutionGrid();
  }
  return lightPollutionGrid;
};

interface AuroraMapProps {
  showAuroraProbability: boolean;
  showLightPollution: boolean;
  showCloudCover: boolean;
  showHunts: boolean;
  showSightings: boolean;
  showTwilightZones: boolean;
}

export default function AuroraMap({
  showAuroraProbability,
  showLightPollution,
  showCloudCover,
  showHunts,
  showSightings,
  showTwilightZones,
}: AuroraMapProps) {
  const { data: session } = useSession();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [joiningHunt, setJoiningHunt] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [auroraData, setAuroraData] = useState<AuroraData | null>(null);
  const [twilightZones, setTwilightZones] = useState<Array<{ lat: number; lng: number; zone: string }>>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true on client side
    setIsMounted(true);

    // Fetch sightings from last 12 hours
    fetch("/api/sightings/recent")
      .then((res) => res.json())
      .then((data) => setSightings(Array.isArray(data) ? data : []))
      .catch(() => setSightings([]));

    // Fetch planned hunts
    fetch("/api/hunts/upcoming")
      .then((res) => res.json())
      .then((data) => setHunts(Array.isArray(data) ? data : []))
      .catch(() => setHunts([]));

    // Fetch aurora probability data
    fetchAuroraData();

    // Calculate twilight zones once on mount
    setTwilightZones(calculateTwilightZones());
  }, []);

  const fetchAuroraData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(
        "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json",
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the response text first
      const text = await response.text();

      // Try to parse it as JSON
      try {
        const data = JSON.parse(text);
        setAuroraData(data);
      } catch (parseError) {
        console.error("Error parsing aurora JSON data:", parseError);
        // Don't set aurora data if parsing fails - silently fail
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log("Aurora data fetch timed out");
        } else {
          console.error("Error fetching aurora data:", error.message);
        }
      }
      // Silently fail - aurora overlay just won't appear
    }
  };

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng });
  }, []);

  const handleJoinHunt = async (huntId: string) => {
    setJoiningHunt(huntId);

    try {
      const response = await fetch(`/api/hunts/${huntId}/join`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Successfully joined hunt!");
        // Refresh hunts to update participant count
        const huntsResponse = await fetch("/api/hunts/upcoming");
        const huntsData = await huntsResponse.json();
        setHunts(huntsData);
      } else {
        toast.error(data.error || "Failed to join hunt");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setJoiningHunt(null);
    }
  };

  const handleLeaveHunt = async (huntId: string) => {
    setJoiningHunt(huntId);

    try {
      const response = await fetch(`/api/hunts/${huntId}/leave`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Successfully left hunt");
        // Refresh hunts to update participant count
        const huntsResponse = await fetch("/api/hunts/upcoming");
        const huntsData = await huntsResponse.json();
        setHunts(huntsData);
      } else {
        toast.error(data.error || "Failed to leave hunt");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setJoiningHunt(null);
    }
  };

  const getMarkerColor = (sightingDate: string) => {
    const hours = differenceInHours(new Date(), new Date(sightingDate));
    if (hours <= 4) return "#00ff87"; // green
    if (hours <= 8) return "#ff9500"; // orange
    return "#ff3b30"; // red
  };

  // Create custom marker icons
  const createSightingIcon = (color: string) => {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const huntIcon = L.divIcon({
    className: "custom-marker",
    html: `<svg width="40" height="40" viewBox="0 0 24 24" fill="#00d9ff">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  // Get color for aurora intensity (converted to percentage)
  // NOAA OVATION intensity scale roughly: 0-20, where higher = more likely
  // Converting to percentage: intensity * 5 = approximate percentage
  const getAuroraColor = (intensity: number) => {
    const percentage = intensity * 5; // Rough conversion to percentage

    // Smooth gradient colors with more intermediate steps
    if (percentage >= 60) return "rgba(255, 0, 0, 0.75)"; // Bright red - 60%+
    if (percentage >= 50) return "rgba(255, 50, 0, 0.7)"; // Red-orange - 50-59%
    if (percentage >= 40) return "rgba(255, 100, 0, 0.7)"; // Orange - 40-49%
    if (percentage >= 30) return "rgba(255, 165, 0, 0.65)"; // Light orange - 30-39%
    if (percentage >= 20) return "rgba(200, 255, 0, 0.65)"; // Yellow-green - 20-29%
    if (percentage >= 10) return "rgba(100, 255, 100, 0.6)"; // Light green - 10-19%
    if (percentage >= 5) return "rgba(0, 200, 0, 0.55)"; // Green - 5-9%
    if (percentage >= 1) return "rgba(100, 150, 100, 0.4)"; // Dark green - 1-4%
    return null; // Don't show anything below 1%
  };

  // Calculate twilight zones using solar position
  const calculateTwilightZones = () => {
    const now = new Date();
    const zones: Array<{ lat: number; lng: number; zone: string }> = [];

    // Sample points across the globe
    for (let lat = -90; lat <= 90; lat += 5) {
      for (let lng = -180; lng <= 180; lng += 5) {
        const sunPos = SunCalc.getPosition(now, lat, lng);
        const altitude = sunPos.altitude * (180 / Math.PI); // Convert to degrees

        let zone = 'night';
        if (altitude > -0.833) zone = 'day'; // Above horizon (accounting for refraction)
        else if (altitude > -6) zone = 'civil'; // Civil twilight
        else if (altitude > -12) zone = 'nautical'; // Nautical twilight
        else if (altitude > -18) zone = 'astronomical'; // Astronomical twilight
        // else remains 'night'

        zones.push({ lat, lng, zone });
      }
    }

    return zones;
  };

  const getTwilightColor = (zone: string) => {
    switch(zone) {
      case 'day': return 'rgba(255, 255, 200, 0.22)'; // Light yellow for daylight
      case 'civil': return 'rgba(255, 200, 100, 0.22)'; // Orange for civil twilight
      case 'nautical': return 'rgba(100, 100, 200, 0.22)'; // Blue for nautical twilight
      case 'astronomical': return 'rgba(50, 50, 150, 0.22)'; // Dark blue for astronomical twilight
      case 'night': return 'rgba(0, 0, 50, 0.22)'; // Very dark for night
      default: return 'rgba(0, 0, 0, 0.22)';
    }
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        key="aurora-map"
        center={[68.35, 18.83]}
        zoom={5}
        minZoom={3}
        maxZoom={18}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Base Map - Custom dark theme with dark land */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          zIndex={1}
          className="map-base-layer"
        />

        {/* Cloud Cover Overlay - Using NASA GIBS Satellite Imagery */}
        {showCloudCover && (
          <TileLayer
            key="cloud-cover-layer"
            attribution='NASA EOSDIS'
            url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${new Date().toISOString().split('T')[0]}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
            opacity={0.22}
            zIndex={5}
            maxZoom={9}
          />
        )}

        {/* Light Pollution Overlay - Using multiple tile server attempts */}
        {showLightPollution && (
          <>
            <TileLayer
              key="light-pollution-layer-1"
              attribution='&copy; <a href="https://www.lightpollutionmap.info">Light Pollution Map</a>'
              url="https://tiles.lightpollutionmap.info/VIIRS_2022/{z}/{x}/{y}.png"
              opacity={0.22}
              zIndex={10}
              maxZoom={8}
              pane="overlayPane"
              eventHandlers={{
                tileerror: () => {
                  console.log("Light pollution tile failed to load");
                }
              }}
            />
            {/* Fallback: Display heat map if tiles fail */}
            {getLightPollutionGrid().map((cell, index) => {
              const getLightPollutionColor = (intensity: number) => {
                if (intensity >= 8) return "rgba(255, 0, 0, 0.5)";
                if (intensity >= 6) return "rgba(255, 100, 0, 0.45)";
                if (intensity >= 4) return "rgba(255, 200, 0, 0.4)";
                if (intensity >= 2) return "rgba(255, 255, 100, 0.35)";
                return "rgba(200, 200, 200, 0.2)";
              };

              const color = getLightPollutionColor(cell.intensity);
              const bounds: [[number, number], [number, number]] = [
                [cell.lat, cell.lng],
                [cell.lat + 0.5, cell.lng + 0.5],
              ];

              return (
                <Rectangle
                  key={`light-pollution-${index}`}
                  bounds={bounds}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.22,
                    stroke: false,
                    fill: true,
                  }}
                  interactive={false}
                  pane="overlayPane"
                />
              );
            })}
          </>
        )}

        {/* Aurora Probability Overlay - High resolution with subdivided cells */}
        {showAuroraProbability &&
          auroraData &&
          auroraData.coordinates.flatMap((coord, index) => {
            const [lon, lat, intensity] = coord;

            // Filter out equatorial regions - Aurora is primarily visible at high latitudes
            if (Math.abs(lat) < 50) return [];

            const color = getAuroraColor(intensity);
            if (!color) return [];

            // Use single cell instead of subdivisions for better performance
            const bounds: [[number, number], [number, number]] = [
              [lat, lon],
              [lat + 1, lon + 1],
            ];

            return (
              <Rectangle
                key={`aurora-${index}`}
                bounds={bounds}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.3,
                  stroke: false,
                  fill: true,
                  className: 'aurora-cell'
                }}
                interactive={false}
                pane="tooltipPane"
              />
            );
          })}

        {/* Twilight Zones Overlay - Day/Night/Twilight visualization */}
        {showTwilightZones && twilightZones.map((zone, index) => {
          // Non-overlapping tiles - each tile is exactly 5x5 degrees
          const bounds: [[number, number], [number, number]] = [
            [zone.lat, zone.lng],
            [zone.lat + 5, zone.lng + 5],
          ];

          return (
            <Rectangle
              key={`twilight-${index}`}
              bounds={bounds}
              pathOptions={{
                fillColor: getTwilightColor(zone.zone),
                fillOpacity: 1,
                stroke: false,
                fill: true,
              }}
              interactive={false}
              pane="tilePane"
            />
          );
        })}

        {/* Sighting Markers with Clustering */}
        {showSightings && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {sightings
              .filter((sighting) =>
                sighting.latitude != null &&
                sighting.longitude != null &&
                !isNaN(sighting.latitude) &&
                !isNaN(sighting.longitude)
              )
              .map((sighting) => (
                <Marker
                  key={sighting.id}
                  position={[sighting.latitude, sighting.longitude]}
                  icon={createSightingIcon(getMarkerColor(sighting.sightingDate))}
                >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[200px]">
                    {sighting.images[0] && (
                      <img
                        src={sighting.images[0]}
                        alt="Aurora sighting"
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    <p className="font-semibold">{sighting.location}</p>
                    <p className="text-sm text-gray-600">
                      by {sighting.user.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Seen: {new Date(sighting.sightingDate).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}

        {/* Hunt Markers */}
        {showHunts && hunts
          .filter((hunt) =>
            hunt.latitude != null &&
            hunt.longitude != null &&
            !isNaN(hunt.latitude) &&
            !isNaN(hunt.longitude)
          )
          .map((hunt) => (
            <Marker
              key={hunt.id}
              position={[hunt.latitude, hunt.longitude]}
              icon={huntIcon}
            >
            <Popup className="custom-hunt-popup">
              <div className="min-w-[280px] -m-3">
                {/* Cover Image */}
                {hunt.coverImage && (
                  <div className="w-full h-32 overflow-hidden">
                    <img
                      src={hunt.coverImage}
                      alt={hunt.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-3">
                  {/* Hunt Name */}
                  <h3 className="font-bold text-base mb-2">{hunt.name}</h3>

                  {/* Location - Flag and City only */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{formatLocationWithFlag(hunt.location)}</span>
                  </div>

                  {/* Date and Time in hunt's local timezone */}
                  <div className="text-sm text-gray-600 mb-2">
                    {!isMounted ? (
                      // Show placeholder during SSR to avoid hydration mismatch
                      "Loading..."
                    ) : (
                      formatHuntDate(hunt.startDate, hunt.timezone, "dd MMM yyyy, hh:mm a", true)
                    )}
                  </div>

                  {/* Participants with profile pictures */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      <img
                        src={hunt.user.image || "/default-avatar.png"}
                        alt={hunt.user.name}
                        className="w-6 h-6 rounded-full border-2 border-white"
                      />
                      {hunt.participants > 1 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-semibold">
                          +{hunt.participants - 1}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      {hunt.participants} participant{hunt.participants !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <a
                      href={`/hunts/${hunt.id}`}
                      className="flex-1 bg-gray-600 text-white text-sm py-2 px-3 rounded hover:bg-gray-700 text-center font-medium"
                      style={{ color: 'white' }}
                    >
                      View Details
                    </a>
                    {/* Show Edit button for hunt owner, Join/Leave for others */}
                    {session?.user?.id === hunt.userId ? (
                      <a
                        href={`/hunts/${hunt.id}/edit`}
                        className="flex-1 bg-green-500 text-white text-sm py-2 px-3 rounded hover:bg-green-600 text-center font-medium"
                        style={{ color: 'white' }}
                      >
                        Edit
                      </a>
                    ) : hunt.isUserParticipant ? (
                      <button
                        onClick={() => handleLeaveHunt(hunt.id)}
                        disabled={joiningHunt === hunt.id}
                        className="flex-1 bg-red-500 text-white text-sm py-2 px-3 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {joiningHunt === hunt.id ? "Leaving..." : "Leave"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinHunt(hunt.id)}
                        disabled={joiningHunt === hunt.id}
                        className="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {joiningHunt === hunt.id ? "Joining..." : "Join"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Labels Layer - On top of everything for maximum visibility */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          zIndex={1000}
          pane="shadowPane"
          className="map-labels-layer"
        />

        {/* Temporarily disabled to fix errors */}
        {/* <InitialLocation onLocationFound={handleLocationFound} /> */}
        <LocationButton />
      </MapContainer>
    </div>
  );
}
