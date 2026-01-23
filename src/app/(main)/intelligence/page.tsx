"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import TimeHeader from "@/components/TimeHeader";
import { auroraLocations, calculateDistance } from "@/lib/auroraLocations";
import { calculateAuroraVerdict, getVerdictColor, type AuroraVerdict } from "@/lib/auroraVerdictSystem";

const AuroraMap = dynamic(() => import("@/components/map/AuroraMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

type TabType = "map" | "cosmic" | "expert" | "cloud" | "aurora-intel";

export default function IntelligencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || "expert");

  // Map states
  const [showAuroraProbability, setShowAuroraProbability] = useState(true);
  const [showLightPollution, setShowLightPollution] = useState(false);
  const [showCloudCover, setShowCloudCover] = useState(false);
  const [showHunts, setShowHunts] = useState(true);
  const [showSightings, setShowSightings] = useState(true);
  const [showTwilightZones, setShowTwilightZones] = useState(false);

  // Cosmic Intel states
  const [currentKp, setCurrentKp] = useState<string>("0.00");
  const [loadingKp, setLoadingKp] = useState(true);
  const [moonPhase, setMoonPhase] = useState<{
    phase: string;
    illumination: number;
  } | null>(null);
  const [loadingMoon, setLoadingMoon] = useState(true);
  const [currentBz, setCurrentBz] = useState<number | null>(null);
  const [loadingBz, setLoadingBz] = useState(true);
  const [bzLastUpdated, setBzLastUpdated] = useState<string | null>(null);
  const [currentBt, setCurrentBt] = useState<number | null>(null);
  const [solarWindSpeed, setSolarWindSpeed] = useState<number | null>(null);
  const [solarWindDensity, setSolarWindDensity] = useState<number | null>(null);
  const [solarWindLastUpdated, setSolarWindLastUpdated] = useState<string | null>(null);
  const [loadingSolarWind, setLoadingSolarWind] = useState(true);
  const [cmeData, setCmeData] = useState<{
    isActive: boolean;
    speed: number | null;
    arrivalTime: string | null;
    type: string;
  } | null>(null);
  const [loadingCme, setLoadingCme] = useState(true);
  const [cmeAlertsList, setCmeAlertsList] = useState<Array<{
    type: string;
    speed: number;
    detectedAt: string;
    arrivalDate: string;
    expectedKp: string;
  }>>([]);
  const [hssPrediction, setHssPrediction] = useState<{
    dateRange: string;
    peakDate: string;
    expectedKp: string;
    previousHssDate: string;
  } | null>(null);
  const [loadingHss, setLoadingHss] = useState(true);
  const [solarFlare, setSolarFlare] = useState<{
    class: string;
    intensity: number;
    time: string;
  } | null>(null);
  const [loadingFlare, setLoadingFlare] = useState(true);
  const [coronalHole, setCoronalHole] = useState<{
    isActive: boolean;
    size: string;
    arrivalEstimate: string;
  } | null>(null);
  const [loadingCoronalHole, setLoadingCoronalHole] = useState(true);
  const [sunspotNumber, setSunspotNumber] = useState<number | null>(null);
  const [sunspotLastUpdated, setSunspotLastUpdated] = useState<string | null>(null);
  const [loadingSunspot, setLoadingSunspot] = useState(true);
  const [hemispherePower, setHemispherePower] = useState<{
    north: number;
    south: number;
    timestamp: string;
  } | null>(null);
  const [loadingHemispherePower, setLoadingHemispherePower] = useState(true);

  // Enhanced Bz history and substorm detection states
  const [bzHistory, setBzHistory] = useState<{
    minutesSouth: number;
    avgBz: number;
    minBz: number;
    maxBz: number;
    isSustained15: boolean;  // 15+ min
    isSustained45: boolean;  // 45+ min
    isSustained90: boolean;  // 90+ min
    bzTrend: 'strengthening' | 'weakening' | 'stable';
    readings: number[];  // Last 90 min of Bz readings (oldest to newest)
  } | null>(null);
  const [goesData, setGoesData] = useState<{
    currentKp: number;
    substormActive: boolean;
    kpIncreased: boolean;
  } | null>(null);
  const [loadingGoesData, setLoadingGoesData] = useState(true);

  // Energy loading and substorm prediction states
  const [energyState, setEnergyState] = useState<{
    loadingLevel: number; // 0-100%
    loadingRate: number;  // % per minute
    timeToOnset: number | null; // minutes until substorm onset
    substormPhase: 'quiet' | 'growth' | 'expansion' | 'recovery';
    phaseStartTime: Date | null;
    confidence: 'high' | 'medium' | 'low';
  }>({
    loadingLevel: 0,
    loadingRate: 0,
    timeToOnset: null,
    substormPhase: 'quiet',
    phaseStartTime: null,
    confidence: 'low'
  });

  // Kp lag warning state
  const [kpLagWarning, setKpLagWarning] = useState<{
    isLagging: boolean;
    actualCondition: 'better' | 'worse' | 'same';
    message: string;
  } | null>(null);

  // Location-based data states
  const [huntLocation, setHuntLocation] = useState<string>("");
  const [huntLocationCoords, setHuntLocationCoords] = useState<{lat: number; lon: number} | null>(null);
  const [cloudCover, setCloudCover] = useState<number | null>(null);
  const [cloudForecast, setCloudForecast] = useState<{
    time: string[];
    cloudCover: number[];
    windSpeed: number[];
    windDirection: number[];
    humidity: number[];
    precipitation: number[];
  } | null>(null);
  const [daylightStatus, setDaylightStatus] = useState<"Day" | "Twilight" | "Night" | null>(null);
  const [sunsetTime, setSunsetTime] = useState<Date | null>(null);
  const [bortleClass, setBortleClass] = useState<number | null>(null);
  const [huntLocationTimezone, setHuntLocationTimezone] = useState<string>("");
  const [huntLocationPeakWindow, setHuntLocationPeakWindow] = useState<{start: number; end: number}>({start: 22, end: 2});
  const [huntLocationWeatherData, setHuntLocationWeatherData] = useState<any>(null);
  const [loadingHuntLocationData, setLoadingHuntLocationData] = useState(false);

  const [yourLocation, setYourLocation] = useState<string>("");
  const [yourLocationCoords, setYourLocationCoords] = useState<{lat: number; lon: number} | null>(null);
  const [travelDistance, setTravelDistance] = useState<number | null>(null);
  const [travelTime, setTravelTime] = useState<number | null>(null);
  const [localTime, setLocalTime] = useState<string>("");
  const [loadingYourLocationData, setLoadingYourLocationData] = useState(false);
  const [gettingGPSLocation, setGettingGPSLocation] = useState(false);

  // Location recommendations state
  const [locationRecommendations, setLocationRecommendations] = useState<Array<{
    direction: string;
    distance: number;
    driveTime: number; // minutes
    coords: {lat: number; lon: number};
    cloudCoverNow: number;
    cloudCoverAtArrival: number;
    clearSkiesStartHour?: number;
    clearSkiesStartTime?: Date;
    departureTime?: Date; // For daytime scenario: when to leave to arrive at sunset
    trend: string;
    score: number;
    locationName?: string;
  }>>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsSearched, setRecommendationsSearched] = useState(false);
  const [searchRadiusHours, setSearchRadiusHours] = useState<number>(2); // Track the search radius used (2 or 4 hours)

  // Prepare Now alert state
  const [upcomingClearWindow, setUpcomingClearWindow] = useState<{
    hoursUntilClear: number;
    clearTime: Date;
    message: string;
  } | null>(null);

  // Cloud Intel tab states
  const [cloudIntelLocation, setCloudIntelLocation] = useState("");
  const [cloudIntelCoords, setCloudIntelCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingCloudIntel, setLoadingCloudIntel] = useState(false);
  const [cloudIntelData, setCloudIntelData] = useState<any>(null);
  const [cloudIntelSuggestions, setCloudIntelSuggestions] = useState<any[]>([]);
  const [showCloudIntelSuggestions, setShowCloudIntelSuggestions] = useState(false);
  const [loadingCloudIntelSuggestions, setLoadingCloudIntelSuggestions] = useState(false);
  const [cloudIntelSelectedIndex, setCloudIntelSelectedIndex] = useState(-1);
  const [autoDetectingLocation, setAutoDetectingLocation] = useState(false);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);
  const [hasAutoDetectedYourLocation, setHasAutoDetectedYourLocation] = useState(false);
  const [hasAutoDetectedHuntLocation, setHasAutoDetectedHuntLocation] = useState(false);
  const cloudIntelInputRef = useRef<HTMLInputElement>(null);
  const cloudIntelSuggestionsRef = useRef<HTMLDivElement>(null);
  const cloudIntelDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Celestial events state
  const [nextCelestialEvent, setNextCelestialEvent] = useState<{
    name: string;
    date: string;
    type: string;
    description: string;
    daysUntil: number;
  } | null>(null);

  // Light pollution state
  const [lightPollution, setLightPollution] = useState<{
    bortle: number;
    description: string;
    color: string;
  } | null>(null);

  // Twilight/Sun data state
  const [twilightData, setTwilightData] = useState<{
    currentPeriod: 'night' | 'astronomical' | 'nautical' | 'civil' | 'daylight';
    sunrise: string;
    sunset: string;
    isDay: boolean;
    nextEvent: string; // sunrise or sunset time
    nextEventType: 'sunrise' | 'sunset';
  } | null>(null);

  // Autocomplete states
  const [huntLocationSuggestions, setHuntLocationSuggestions] = useState<any[]>([]);
  const [showHuntLocationSuggestions, setShowHuntLocationSuggestions] = useState(false);
  const [loadingHuntLocationSuggestions, setLoadingHuntLocationSuggestions] = useState(false);
  const [huntLocationSelectedIndex, setHuntLocationSelectedIndex] = useState(-1);
  const [yourLocationSuggestions, setYourLocationSuggestions] = useState<any[]>([]);
  const [showYourLocationSuggestions, setShowYourLocationSuggestions] = useState(false);
  const [loadingYourLocationSuggestions, setLoadingYourLocationSuggestions] = useState(false);
  const [yourLocationSelectedIndex, setYourLocationSelectedIndex] = useState(-1);
  const huntLocationDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const yourLocationDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update active tab when URL parameter changes
    if (tabFromUrl && (tabFromUrl === "map" || tabFromUrl === "cosmic" || tabFromUrl === "expert")) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    // Fetch cosmic intel data
    fetchCurrentKp();
    fetchMoonPhase();
    fetchCurrentBz();
    fetchSolarWindData();
    fetchCmeData();
    fetchHssData();
    fetchSolarFlareData();
    fetchNextCelestialEvent();
    fetchCoronalHoleData();
    fetchSunspotData();
    fetchHemispherePower();

    // Auto-refresh real-time data every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchCurrentKp();
      fetchCurrentBz();
      fetchSolarWindData();
      fetchHemispherePower();
    }, 60000); // 60 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Fetch substorm data after Kp and Bz history are available
  useEffect(() => {
    if (!loadingKp && !loadingBz && bzHistory) {
      fetchGoesData();
    }
  }, [loadingKp, loadingBz, bzHistory, currentKp, currentBz]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.hunt-location-autocomplete') && !target.closest('input[value]')) {
        setShowHuntLocationSuggestions(false);
        setHuntLocationSelectedIndex(-1);
      }
      if (!target.closest('.your-location-autocomplete') && !target.closest('input[value]')) {
        setShowYourLocationSuggestions(false);
        setYourLocationSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-detect location for Cloud Intel tab
  useEffect(() => {
    if (activeTab === "cloud" && !hasAutoDetected && !cloudIntelData && !loadingCloudIntel) {
      autoDetectCloudIntelLocation();
    }
  }, [activeTab, hasAutoDetected, cloudIntelData, loadingCloudIntel]);

  // Auto-detect "Your Location" (Gate 2) for AIvisor tab
  useEffect(() => {
    if (activeTab === "aurora-intel" && !hasAutoDetectedHuntLocation && !huntLocationCoords && !gettingGPSLocation) {
      setHasAutoDetectedHuntLocation(true);
      handleGetHuntLocationGPS();
    }
  }, [activeTab, hasAutoDetectedHuntLocation, huntLocationCoords, gettingGPSLocation]);

  // Estimate light pollution based on location type
  const estimateLightPollution = (addressData: any) => {
    // Bortle scale: 1 (darkest) to 9 (brightest city center)
    // We estimate based on settlement type from reverse geocoding
    let bortle = 5; // Default to suburban

    const city = addressData?.city?.toLowerCase() || "";
    const town = addressData?.town?.toLowerCase() || "";
    const village = addressData?.village?.toLowerCase() || "";
    const hamlet = addressData?.hamlet?.toLowerCase() || "";
    const county = addressData?.county?.toLowerCase() || "";
    const country = addressData?.country?.toLowerCase() || "";
    const state = addressData?.state?.toLowerCase() || "";

    // List of major metropolitan areas / city-states (Bortle 9)
    const majorMetros = [
      "singapore", "hong kong", "tokyo", "new york", "london", "paris",
      "shanghai", "beijing", "seoul", "mumbai", "delhi", "los angeles",
      "chicago", "houston", "phoenix", "philadelphia", "san antonio",
      "san diego", "dallas", "san jose", "bangkok", "jakarta", "manila",
      "kuala lumpur", "taipei", "osaka", "guangzhou", "shenzhen", "dubai",
      "abu dhabi", "doha", "riyadh", "moscow", "istanbul", "cairo",
      "lagos", "johannesburg", "sydney", "melbourne", "toronto", "montreal",
      "vancouver", "mexico city", "são paulo", "rio de janeiro", "buenos aires"
    ];

    // City-states where country name matches city (Bortle 9)
    const cityStates = ["singapore", "hong kong", "macau", "monaco", "vatican"];

    // Check if it's a city-state or major metro
    const isCityState = cityStates.some(cs =>
      country.includes(cs) || city.includes(cs) || state.includes(cs)
    );
    const isMajorMetro = majorMetros.some(metro =>
      city.includes(metro) || town.includes(metro)
    );

    if (isCityState || isMajorMetro) {
      bortle = 9; // Inner city - highest light pollution
    } else if (hamlet) {
      bortle = 3; // Rural sky
    } else if (village) {
      bortle = 4; // Rural/suburban transition
    } else if (town) {
      bortle = 6; // Bright suburban
    } else if (city) {
      bortle = 8; // City sky (default for any city)
    } else if (county && !city && !town) {
      bortle = 3; // Rural area (county only, no city/town)
    }

    const bortleDescriptions: { [key: number]: { description: string; color: string } } = {
      1: { description: "Excellent Dark Sky", color: "#000000" },
      2: { description: "Typical Dark Site", color: "#1a1a2e" },
      3: { description: "Rural Sky", color: "#16213e" },
      4: { description: "Rural/Suburban", color: "#1f4068" },
      5: { description: "Suburban Sky", color: "#5d5d8b" },
      6: { description: "Bright Suburban", color: "#8a8ab0" },
      7: { description: "Suburban/Urban", color: "#c4a35a" },
      8: { description: "City Sky", color: "#e09f3e" },
      9: { description: "Inner City", color: "#ff6b6b" },
    };

    setLightPollution({
      bortle,
      description: bortleDescriptions[bortle]?.description || "Unknown",
      color: bortleDescriptions[bortle]?.color || "#5d5d8b",
    });
  };

  // Auto-detect user's location for Cloud Intel
  const autoDetectCloudIntelLocation = async () => {
    if (!navigator.geolocation) {
      return; // Silently fail if geolocation not supported
    }

    setAutoDetectingLocation(true);
    setHasAutoDetected(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Reverse geocode to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          const data = await response.json();
          const locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Current Location";
          const country = data.address?.country || "";

          setCloudIntelLocation(`${locationName}${country ? `, ${country}` : ""}`);
          setCloudIntelCoords({ lat, lon });
          setAutoDetectingLocation(false);

          // Estimate light pollution based on location type
          estimateLightPollution(data.address);

          // Automatically fetch cloud data and twilight data
          fetchCloudIntelData(lat, lon);
          fetchTwilightData(lat, lon);
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          setCloudIntelLocation("Current Location");
          setCloudIntelCoords({ lat, lon });
          setAutoDetectingLocation(false);
          // Default to suburban light pollution if reverse geocoding fails
          setLightPollution({ bortle: 5, description: "Suburban Sky", color: "#5d5d8b" });
          fetchCloudIntelData(lat, lon);
          fetchTwilightData(lat, lon);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setAutoDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const fetchMoonPhase = async () => {
    try {
      const now = new Date();
      const knownNewMoon = new Date(2000, 0, 6, 18, 14);
      const daysSinceKnownNew = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
      const currentPhase = (daysSinceKnownNew % 29.53059) / 29.53059;

      let phaseName = "";
      let illumination = 0;

      if (currentPhase < 0.033) {
        phaseName = "New Moon";
        illumination = 0;
      } else if (currentPhase < 0.216) {
        phaseName = "Waxing Crescent";
        illumination = currentPhase * 100;
      } else if (currentPhase < 0.283) {
        phaseName = "First Quarter";
        illumination = 50;
      } else if (currentPhase < 0.466) {
        phaseName = "Waxing Gibbous";
        illumination = 50 + (currentPhase - 0.25) * 200;
      } else if (currentPhase < 0.533) {
        phaseName = "Full Moon";
        illumination = 100;
      } else if (currentPhase < 0.716) {
        phaseName = "Waning Gibbous";
        illumination = 100 - (currentPhase - 0.5) * 200;
      } else if (currentPhase < 0.783) {
        phaseName = "Last Quarter";
        illumination = 50;
      } else {
        phaseName = "Waning Crescent";
        illumination = (1 - currentPhase) * 100;
      }

      setMoonPhase({
        phase: phaseName,
        illumination: Math.round(illumination),
      });
      setLoadingMoon(false);
    } catch (error) {
      console.error("Error calculating moon phase:", error);
      setLoadingMoon(false);
    }
  };

  const fetchNextCelestialEvent = () => {
    // Known annual celestial events (approximate peak dates)
    const currentYear = new Date().getFullYear();
    const celestialEvents = [
      { name: "Quadrantids", date: `${currentYear}-01-03`, type: "meteor", description: "Up to 120 meteors/hour at peak", emoji: "☄️" },
      { name: "Lyrids", date: `${currentYear}-04-22`, type: "meteor", description: "Up to 20 meteors/hour, bright fireballs", emoji: "☄️" },
      { name: "Eta Aquariids", date: `${currentYear}-05-06`, type: "meteor", description: "Up to 50 meteors/hour, Halley's Comet debris", emoji: "☄️" },
      { name: "Delta Aquariids", date: `${currentYear}-07-30`, type: "meteor", description: "Up to 20 meteors/hour", emoji: "☄️" },
      { name: "Perseids", date: `${currentYear}-08-12`, type: "meteor", description: "Up to 100 meteors/hour, most popular shower", emoji: "☄️" },
      { name: "Draconids", date: `${currentYear}-10-08`, type: "meteor", description: "Up to 10 meteors/hour, occasional outbursts", emoji: "☄️" },
      { name: "Orionids", date: `${currentYear}-10-21`, type: "meteor", description: "Up to 20 meteors/hour, Halley's Comet debris", emoji: "☄️" },
      { name: "Taurids", date: `${currentYear}-11-05`, type: "meteor", description: "Slow, bright fireballs", emoji: "☄️" },
      { name: "Leonids", date: `${currentYear}-11-17`, type: "meteor", description: "Up to 15 meteors/hour, fast meteors", emoji: "☄️" },
      { name: "Geminids", date: `${currentYear}-12-14`, type: "meteor", description: "Up to 150 meteors/hour, best annual shower", emoji: "☄️" },
      { name: "Ursids", date: `${currentYear}-12-22`, type: "meteor", description: "Up to 10 meteors/hour", emoji: "☄️" },
      // Next year events for continuity
      { name: "Quadrantids", date: `${currentYear + 1}-01-03`, type: "meteor", description: "Up to 120 meteors/hour at peak", emoji: "☄️" },
      { name: "Lyrids", date: `${currentYear + 1}-04-22`, type: "meteor", description: "Up to 20 meteors/hour, bright fireballs", emoji: "☄️" },
    ];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find the next upcoming event
    const upcomingEvents = celestialEvents
      .map(event => {
        const eventDate = new Date(event.date);
        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...event, daysUntil };
      })
      .filter(event => event.daysUntil >= -3) // Include events up to 3 days past (still visible)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    if (upcomingEvents.length > 0) {
      const next = upcomingEvents[0];
      const eventDate = new Date(next.date);
      setNextCelestialEvent({
        name: next.name,
        date: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        type: next.type,
        description: next.description,
        daysUntil: next.daysUntil,
      });
    }
  };

  const fetchCurrentKp = async () => {
    try {
      const response = await fetch("/api/space-weather/kp-index");
      const data = await response.json();

      const formattedData = data.slice(1);
      const latestObserved = formattedData
        .filter((row: string[]) => row[2] === "observed")
        .pop();

      if (latestObserved) {
        setCurrentKp(latestObserved[1]);
      }
      setLoadingKp(false);
    } catch (error) {
      console.error("Error fetching KP data:", error);
      setLoadingKp(false);
    }
  };

  const fetchCurrentBz = async () => {
    try {
      const response = await fetch("/api/space-weather/solar-wind");
      const data = await response.json();

      if (data.length > 1) {
        const latestReading = data[data.length - 1];
        const bzValue = parseFloat(latestReading[3]);
        const btValue = parseFloat(latestReading[6]); // Bt is in column 6
        const timestamp = latestReading[0]; // Timestamp from API

        if (!isNaN(bzValue)) {
          setCurrentBz(bzValue);
        }
        if (!isNaN(btValue)) {
          setCurrentBt(btValue);
        }
        if (timestamp) {
          setBzLastUpdated(timestamp);
        }

        // Enhanced Bz history calculation (last 90 minutes)
        // Parse NOAA timestamp format "2024-01-23 12:34:00.000" -> ISO format
        const parseNoaaTimestamp = (ts: string) => {
          // Replace space with 'T' and add 'Z' for UTC
          return new Date(ts.replace(' ', 'T') + 'Z');
        };

        const now = new Date();
        const ninetyMinutesAgo = new Date(now.getTime() - 90 * 60 * 1000);
        const fortyFiveMinutesAgo = new Date(now.getTime() - 45 * 60 * 1000);
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

        let southwardMinutes90 = 0;
        let southwardMinutes45 = 0;
        let southwardMinutes15 = 0;
        let totalBz = 0;
        let count = 0;
        let minBz = 0;
        let maxBz = 0;
        const bzValues: number[] = [];

        // Iterate backwards through data to check last 90 min
        for (let i = data.length - 1; i >= 1; i--) {
          const reading = data[i];
          const timestamp = parseNoaaTimestamp(reading[0]);

          if (timestamp < ninetyMinutesAgo) break;

          const bz = parseFloat(reading[3]);
          if (!isNaN(bz)) {
            bzValues.push(bz);
            if (bz < 0) {
              southwardMinutes90++;
              if (timestamp >= fortyFiveMinutesAgo) southwardMinutes45++;
              if (timestamp >= fifteenMinutesAgo) southwardMinutes15++;
            }
            totalBz += bz;
            count++;
            if (bz < minBz) minBz = bz;
            if (bz > maxBz) maxBz = bz;
          }
        }

        const avgBz = count > 0 ? totalBz / count : 0;

        // Determine Bz trend (last 15 min vs previous 30 min)
        const recent15 = bzValues.slice(0, 15);
        const previous30 = bzValues.slice(15, 45);
        const avgRecent = recent15.length > 0 ? recent15.reduce((a, b) => a + b, 0) / recent15.length : 0;
        const avgPrevious = previous30.length > 0 ? previous30.reduce((a, b) => a + b, 0) / previous30.length : 0;

        let bzTrend: 'strengthening' | 'weakening' | 'stable' = 'stable';
        if (avgRecent < avgPrevious - 1) bzTrend = 'strengthening'; // More southward
        else if (avgRecent > avgPrevious + 1) bzTrend = 'weakening'; // Less southward

        setBzHistory({
          minutesSouth: southwardMinutes90,
          avgBz: avgBz,
          minBz: minBz,
          maxBz: maxBz,
          isSustained15: southwardMinutes15 >= 15,
          isSustained45: southwardMinutes45 >= 30, // 30+ min in last 45
          isSustained90: southwardMinutes90 >= 45, // 45+ min in last 90
          bzTrend: bzTrend,
          readings: bzValues.reverse() // Reverse to get oldest to newest
        });
      }
      setLoadingBz(false);
    } catch (error) {
      console.error("Error fetching Bz data:", error);
      setLoadingBz(false);
    }
  };

  const fetchSolarWindData = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json"
      );
      const data = await response.json();

      if (data.length > 1) {
        const latestReading = data[data.length - 1];
        const density = parseFloat(latestReading[1]);
        const speed = parseFloat(latestReading[2]);
        const timestamp = latestReading[0]; // Timestamp from API

        if (!isNaN(density)) {
          setSolarWindDensity(density);
        }
        if (!isNaN(speed)) {
          setSolarWindSpeed(speed);
        }
        if (timestamp) {
          setSolarWindLastUpdated(timestamp);
        }
      }
      setLoadingSolarWind(false);
    } catch (error) {
      console.error("Error fetching solar wind data:", error);
      setLoadingSolarWind(false);
    }
  };

  const fetchCmeData = async () => {
    try {
      // Fetch CME data from NASA DONKI API
      // Get CME data from the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      const response = await fetch(
        `https://api.nasa.gov/DONKI/CME?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=NIXvIqoTvk1qIplmptffaH4sQYgTnlDD6bH4kIYM`
      );

      if (!response.ok) {
        console.warn('CME API returned error:', response.status);
        // Set default "no active CME" state
        setCmeData({
          isActive: false,
          speed: null,
          arrivalTime: null,
          type: "None Active",
        });
        setLoadingCme(false);
        return;
      }

      const data = await response.json();

      // Find the most recent Earth-directed CME
      if (data && data.length > 0) {
        // Filter for Earth-directed CMEs
        const earthDirectedCmes = data.filter((cme: any) => {
          if (cme.cmeAnalyses && cme.cmeAnalyses.length > 0) {
            const latestAnalysis = cme.cmeAnalyses[cme.cmeAnalyses.length - 1];
            return latestAnalysis.isMostAccurate &&
                   (latestAnalysis.latitude === 0 || latestAnalysis.enlilList?.length > 0);
          }
          return false;
        });

        // Process all Earth-directed CMEs for alerts list
        const alertsList: Array<{
          type: string;
          speed: number;
          detectedAt: string;
          arrivalDate: string;
          expectedKp: string;
        }> = [];

        const now = new Date();

        for (const cme of earthDirectedCmes) {
          const analysis = cme.cmeAnalyses[cme.cmeAnalyses.length - 1];
          const speed = analysis.speed ? parseFloat(analysis.speed) : 0;

          if (speed === 0) continue;

          // Determine CME type
          let cmeType = "Narrow CME";
          const halfAngle = analysis.halfAngle || 0;
          if (analysis.type?.toLowerCase().includes("s") || halfAngle >= 120) {
            cmeType = "Full Halo";
          } else if (halfAngle >= 60) {
            cmeType = "Partial Halo";
          }

          // Calculate travel time based on speed
          const travelTimeHours = (150000000 / speed) / 3600; // Distance to Earth / speed
          const detectionTime = new Date(analysis.time21_5 || cme.startTime);
          const arrivalTime = new Date(detectionTime.getTime() + travelTimeHours * 3600 * 1000);

          // Only include future CMEs
          if (arrivalTime > now) {
            // Calculate expected Kp based on speed
            let expectedKp = "3-5";
            if (speed >= 1000) expectedKp = "7-9";
            else if (speed >= 700) expectedKp = "5-7";
            else if (speed >= 500) expectedKp = "4-6";

            alertsList.push({
              type: cmeType,
              speed: Math.round(speed),
              detectedAt: detectionTime.toISOString(),
              arrivalDate: `${arrivalTime.getDate()} ${arrivalTime.toLocaleDateString('en-US', { month: 'short' })} ${arrivalTime.getFullYear()}`,
              expectedKp
            });
          }
        }

        // Sort by arrival date (earliest first)
        alertsList.sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());

        setCmeAlertsList(alertsList);

        if (earthDirectedCmes.length > 0) {
          const latestCme = earthDirectedCmes[0];
          const analysis = latestCme.cmeAnalyses[latestCme.cmeAnalyses.length - 1];

          let cmeType = "Partial Earth-directed";
          if (analysis.type?.toLowerCase().includes("s")) {
            cmeType = "Full Halo CME";
          }

          // Parse speed from analysis
          const speed = analysis.speed ? parseFloat(analysis.speed) : null;

          // Get arrival time from ENLIL model if available
          let arrivalTime = null;
          if (analysis.enlilList && analysis.enlilList.length > 0) {
            const enlil = analysis.enlilList[0];
            if (enlil.estimatedShockArrivalTime) {
              const arrival = new Date(enlil.estimatedShockArrivalTime);
              arrivalTime = arrival.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          }

          setCmeData({
            isActive: true,
            speed: speed,
            arrivalTime: arrivalTime,
            type: cmeType,
          });
        } else {
          // No Earth-directed CME found
          setCmeData({
            isActive: false,
            speed: null,
            arrivalTime: null,
            type: "None Active",
          });
          setCmeAlertsList([]);
        }
      } else {
        // No CME data in the last 7 days
        setCmeData({
          isActive: false,
          speed: null,
          arrivalTime: null,
          type: "None Active",
        });
        setCmeAlertsList([]);
      }

      setLoadingCme(false);
    } catch (error) {
      console.error("Error fetching CME data:", error);
      // Fallback to no active CME
      setCmeData({
        isActive: false,
        speed: null,
        arrivalTime: null,
        type: "None Active",
      });
      setLoadingCme(false);
    }
  };

  const fetchHssData = async () => {
    try {
      // Fetch HSS data from NASA DONKI API
      // Get last 30 days to find pattern
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      const response = await fetch(
        `https://api.nasa.gov/DONKI/HSS?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=NIXvIqoTvk1qIplmptffaH4sQYgTnlDD6bH4kIYM`
      );

      if (response.ok) {
        const data = await response.json();

        if (data && data.length > 0) {
          // Sort by date (most recent first)
          const sortedEvents = [...data].sort((a: any, b: any) =>
            new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
          );

          const mostRecentEvent = sortedEvents[0];
          const mostRecentDate = new Date(mostRecentEvent.eventTime);

          // Calculate predicted next HSS (27-day solar rotation)
          const predictedDate = new Date(mostRecentDate);
          predictedDate.setDate(predictedDate.getDate() + 27);

          // Only show if prediction is in the future
          if (predictedDate.getTime() > new Date().getTime()) {
            // Calculate date range (±2 days)
            const rangeStart = new Date(predictedDate);
            rangeStart.setDate(rangeStart.getDate() - 2);
            const rangeEnd = new Date(predictedDate);
            rangeEnd.setDate(rangeEnd.getDate() + 2);

            const formatPredictionDate = (date: Date) => {
              return date.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });
            };

            // Smart date range formatter
            const formatDateRange = (start: Date, end: Date) => {
              const startDay = start.getDate();
              const endDay = end.getDate();
              const startMonth = start.toLocaleDateString("en-US", { month: "short" });
              const endMonth = end.toLocaleDateString("en-US", { month: "short" });
              const startYear = start.getFullYear();
              const endYear = end.getFullYear();

              if (startYear !== endYear) {
                // Different years: "21 Dec 2025 - 2 Jan 2026"
                return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
              } else if (startMonth !== endMonth) {
                // Different months, same year: "31 Oct - 2 Nov 2025"
                return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
              } else {
                // Same month and year: "22-26 Nov 2025"
                return `${startDay}-${endDay} ${startMonth} ${startYear}`;
              }
            };

            setHssPrediction({
              dateRange: formatDateRange(rangeStart, rangeEnd),
              peakDate: formatPredictionDate(predictedDate),
              expectedKp: "4-6",
              previousHssDate: formatPredictionDate(mostRecentDate)
            });
          } else {
            setHssPrediction(null);
          }
        } else {
          setHssPrediction(null);
        }
      }

      setLoadingHss(false);
    } catch (error) {
      console.error("Error fetching HSS data:", error);
      setHssPrediction(null);
      setLoadingHss(false);
    }
  };

  const fetchSolarFlareData = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json"
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const latestReading = data[data.length - 1];
        const flux = parseFloat(latestReading.flux);

        let flareClass = "A";
        let intensity = 0;

        if (flux >= 1e-4) {
          flareClass = "X";
          intensity = flux / 1e-4;
        } else if (flux >= 1e-5) {
          flareClass = "M";
          intensity = flux / 1e-5;
        } else if (flux >= 1e-6) {
          flareClass = "C";
          intensity = flux / 1e-6;
        } else if (flux >= 1e-7) {
          flareClass = "B";
          intensity = flux / 1e-7;
        } else {
          flareClass = "A";
          intensity = flux / 1e-8;
        }

        setSolarFlare({
          class: flareClass,
          intensity: parseFloat(intensity.toFixed(1)),
          time: latestReading.time_tag,
        });
      }
      setLoadingFlare(false);
    } catch (error) {
      console.error("Error fetching solar flare data:", error);
      setLoadingFlare(false);
    }
  };

  const fetchCoronalHoleData = async () => {
    try {
      // Fetch High Speed Stream (HSS) data from NASA DONKI API
      // HSS events are directly related to coronal holes
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      const response = await fetch(
        `/api/space-weather/coronal-holes?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`
      );

      if (!response.ok) {
        console.warn('HSS API returned error:', response.status);
        // Set default "no active coronal hole" state
        setCoronalHole({
          isActive: false,
          size: "None",
          arrivalEstimate: "None Expected",
        });
        setLoadingCoronalHole(false);
        return;
      }

      const data = await response.json();

      // Check if there are any active or upcoming HSS events
      if (data && data.length > 0) {
        const latestHss = data[data.length - 1];

        // Determine arrival time
        const eventTime = new Date(latestHss.eventTime);
        const now = new Date();
        const daysUntil = Math.ceil((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let arrivalEstimate = "Active Now";
        if (daysUntil > 0) {
          arrivalEstimate = `${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
        } else if (daysUntil < -3) {
          arrivalEstimate = "None Expected";
        }

        // Estimate size based on instruments (more instruments = larger/more significant)
        const instrumentCount = latestHss.instruments?.length || 0;
        let size = "Small";
        if (instrumentCount >= 3) {
          size = "Large";
        } else if (instrumentCount >= 2) {
          size = "Moderate";
        }

        setCoronalHole({
          isActive: daysUntil >= -3,
          size: size,
          arrivalEstimate: arrivalEstimate,
        });
      } else {
        // No HSS events in the last 7 days
        setCoronalHole({
          isActive: false,
          size: "None",
          arrivalEstimate: "None Expected",
        });
      }

      setLoadingCoronalHole(false);
    } catch (error) {
      console.error("Error fetching coronal hole/HSS data:", error);
      // Fallback to no active coronal hole
      setCoronalHole({
        isActive: false,
        size: "None",
        arrivalEstimate: "None Expected",
      });
      setLoadingCoronalHole(false);
    }
  };

  const fetchSunspotData = async () => {
    try {
      // Fetch solar indices data from NOAA which includes sunspot number
      const response = await fetch(
        "https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json"
      );

      if (!response.ok) {
        console.warn('Sunspot API returned error:', response.status);
        setLoadingSunspot(false);
        return;
      }

      const data = await response.json();

      // Get the most recent entry (last in array)
      if (data && data.length > 0) {
        const latestData = data[data.length - 1];
        setSunspotNumber(latestData.ssn || 0);
        setSunspotLastUpdated(latestData["time-tag"] || null);
      }

      setLoadingSunspot(false);
    } catch (error) {
      console.error("Error fetching sunspot data:", error);
      setLoadingSunspot(false);
    }
  };

  const fetchHemispherePower = async () => {
    try {
      const response = await fetch(
        "https://services.swpc.noaa.gov/text/aurora-nowcast-hemi-power.txt"
      );

      if (!response.ok) {
        console.warn('Hemisphere power API returned error:', response.status);
        setLoadingHemispherePower(false);
        return;
      }

      const text = await response.text();
      const lines = text.split('\n').filter(line =>
        line.trim() && !line.startsWith('#') && !line.startsWith(':')
      );

      // Get the most recent data line (last non-empty, non-comment line)
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        const parts = lastLine.trim().split(/\s+/);

        // Format: Observation_Time  Forecast_Time  North_GW  South_GW
        if (parts.length >= 4) {
          const north = parseInt(parts[2], 10);
          const south = parseInt(parts[3], 10);
          const timestamp = parts[0].replace('_', ' ');

          if (!isNaN(north) && !isNaN(south)) {
            setHemispherePower({ north, south, timestamp });
          }
        }
      }

      setLoadingHemispherePower(false);
    } catch (error) {
      console.error("Error fetching hemisphere power:", error);
      setLoadingHemispherePower(false);
    }
  };

  const fetchGoesData = async () => {
    // Comprehensive substorm analysis using energy loading model
    try {
      const kp = parseFloat(currentKp);
      const bz = currentBz || 0;
      const speed = solarWindSpeed || 0;
      const density = solarWindDensity || 0;

      if (!bzHistory) {
        setLoadingGoesData(false);
        return;
      }

      // === ENERGY LOADING CALCULATION ===
      // Energy input rate depends on: Bz (most critical), speed, density
      // Reconnection rate = V * Bz * sin^2(θ/2) where θ is IMF clock angle
      // Simplified: Energy loading ∝ |Bz| * V * sqrt(density)

      let energyLoadingRate = 0;
      if (bz < 0) {
        // Only southward Bz loads energy
        energyLoadingRate = Math.abs(bz) * (speed / 400) * Math.sqrt(density / 5);
      }

      // Calculate cumulative energy loading based on sustained Bz
      let loadingLevel = 0;
      if (bzHistory.isSustained15) loadingLevel += 20;
      if (bzHistory.isSustained45) loadingLevel += 30;
      if (bzHistory.isSustained90) loadingLevel += 30;
      if (bzHistory.avgBz < -5) loadingLevel += 20; // Strong southward

      // === SUBSTORM PHASE DETECTION ===
      let substormPhase: 'quiet' | 'growth' | 'expansion' | 'recovery' = 'quiet';
      let timeToOnset: number | null = null;
      let confidence: 'high' | 'medium' | 'low' = 'low';

      // Phase 1: QUIET - No activity
      if (!bzHistory.isSustained15 && bz >= 0) {
        substormPhase = 'quiet';
        loadingLevel = 0;
      }
      // Phase 2: GROWTH - Energy loading, 30-60 min before expansion
      else if (bzHistory.isSustained15 && !bzHistory.isSustained45 && bz < -2) {
        substormPhase = 'growth';
        loadingLevel = Math.min(loadingLevel, 60);
        // Predict onset in 30-90 minutes
        if (bzHistory.bzTrend === 'strengthening') {
          timeToOnset = 30; // Faster onset if Bz strengthening
          confidence = 'high';
        } else {
          timeToOnset = 60; // Standard growth phase
          confidence = 'medium';
        }
      }
      // Phase 3: EXPANSION - Active substorm (10-30 min duration)
      else if ((bzHistory.isSustained45 && bz < -5) || (kp >= 5 && bz < -3)) {
        substormPhase = 'expansion';
        loadingLevel = 100;
        timeToOnset = 0; // Happening NOW
        confidence = 'high';
      }
      // Phase 4: RECOVERY - Fading activity (30-120 min)
      else if (bzHistory.isSustained90 && bzHistory.bzTrend === 'weakening') {
        substormPhase = 'recovery';
        loadingLevel = Math.max(40, loadingLevel - 30);
        confidence = 'medium';
      }
      // Borderline: Late growth or early expansion
      else if (bzHistory.isSustained45 && bz < -3) {
        substormPhase = 'growth';
        loadingLevel = Math.min(loadingLevel, 85);
        timeToOnset = 15; // Imminent onset
        confidence = 'high';
      }

      // === KP LAG WARNING ===
      // Kp is a 3-hour average, so it lags real-time conditions
      let kpWarning: {
        isLagging: boolean;
        actualCondition: 'better' | 'worse' | 'same';
        message: string;
      } | null = null;

      // Scenario 1: Bz turned south recently but Kp still low (conditions BETTER than Kp suggests)
      if (bzHistory.isSustained15 && bz < -5 && kp < 4) {
        kpWarning = {
          isLagging: true,
          actualCondition: 'better',
          message: `⚠️ Kp ${kp.toFixed(1)} is lagging! Strong southward Bz for ${bzHistory.minutesSouth}min means aurora building NOW, but Kp hasn't caught up yet.`
        };
      }
      // Scenario 2: Bz turned north but Kp still high (conditions WORSE than Kp suggests)
      else if (bz > 0 && kp >= 5) {
        kpWarning = {
          isLagging: true,
          actualCondition: 'worse',
          message: `⚠️ Kp ${kp.toFixed(1)} is lagging! Bz turned northward - aurora fading despite high Kp. Kp reflects past 3 hours, not current conditions.`
        };
      }
      // Scenario 3: Substorm in recovery but Kp still elevated
      else if (substormPhase === 'recovery' && kp >= 4) {
        kpWarning = {
          isLagging: true,
          actualCondition: 'worse',
          message: `⚠️ Kp ${kp.toFixed(1)} still elevated from earlier activity. Substorm now in recovery phase - activity fading.`
        };
      }

      // Update states
      setGoesData({
        currentKp: kp,
        substormActive: substormPhase === 'expansion',
        kpIncreased: kp >= 4
      });

      setEnergyState({
        loadingLevel: Math.min(100, loadingLevel),
        loadingRate: energyLoadingRate,
        timeToOnset: timeToOnset,
        substormPhase: substormPhase,
        phaseStartTime: new Date(), // Simplified - would track actual phase transitions
        confidence: confidence
      });

      setKpLagWarning(kpWarning);
      setLoadingGoesData(false);

    } catch (error) {
      console.error("Error calculating substorm data:", error);
      setGoesData({
        currentKp: 0,
        substormActive: false,
        kpIncreased: false
      });
      setLoadingGoesData(false);
    }
  };

  const getKpColor = (kp: number) => {
    // Traffic light system: Green = Good aurora, Yellow = Moderate, Red = Low
    if (kp >= 6) return "#22c55e"; // Green (excellent aurora - major storm)
    if (kp >= 4) return "#22c55e"; // Green (good aurora - minor to moderate storm)
    if (kp >= 3) return "#eab308"; // Yellow (moderate aurora - unsettled)
    return "#ef4444"; // Red (low aurora activity)
  };

  const getBzColor = (bz: number) => {
    // Traffic light system: Green = Good aurora (negative Bz), Yellow = Moderate, Red = Poor (positive Bz)
    if (bz <= -5) return "#22c55e"; // Green (very good for aurora)
    if (bz <= 0) return "#eab308"; // Yellow (moderate)
    return "#ef4444"; // Red (poor for aurora - positive Bz blocks)
  };

  const getCloudCoverColor = (cloudCover: number) => {
    // Traffic light system: Green = Low clouds (good viewing), Yellow = Moderate, Red = High clouds (poor viewing)
    if (cloudCover < 30) return "#22c55e"; // Green (clear skies)
    if (cloudCover < 70) return "#eab308"; // Yellow (partly cloudy)
    return "#ef4444"; // Red (cloudy/overcast)
  };

  const getDaylightColor = (daylight: string | null) => {
    // Traffic light system: Green = Night (good), Yellow = Twilight (moderate), Red = Day (bad)
    if (daylight === "Night") return "#22c55e"; // Green (dark - good for aurora)
    if (daylight === "Twilight") return "#eab308"; // Yellow (moderate)
    if (daylight === "Day") return "#ef4444"; // Red (daylight - no aurora visible)
    return "#ffffff"; // White for unknown
  };

  const getDaylightEmoji = (daylight: string | null) => {
    if (daylight === "Night") return "🌙";
    if (daylight === "Twilight") return "🌆";
    if (daylight === "Day") return "☀️";
    return "";
  };

  const getKpEmoji = (kp: number) => {
    if (kp >= 4) return "✅"; // Good for aurora
    if (kp >= 3) return "👌"; // Moderate
    return "❌"; // Poor
  };

  const getBzEmoji = (bz: number) => {
    if (bz <= -5) return "✅"; // Good for aurora (southward)
    if (bz <= 0) return "👌"; // Moderate
    return "❌"; // Poor (northward blocks aurora)
  };

  const getBtColor = (bt: number) => {
    // Traffic light system: Green = Strong IMF (good for aurora), Yellow = Moderate, Red = Weak
    if (bt >= 10) return "#22c55e"; // Green (strong IMF)
    if (bt >= 5) return "#eab308"; // Yellow (moderate)
    return "#ef4444"; // Red (weak IMF)
  };

  const getBtEmoji = (bt: number) => {
    if (bt >= 10) return "✅"; // Strong IMF - good for aurora
    if (bt >= 5) return "👌"; // Moderate
    return "❌"; // Weak IMF
  };

  const getWindSpeedEmoji = (speed: number) => {
    if (speed >= 500) return "✅"; // Good for aurora
    if (speed >= 400) return "👌"; // Moderate
    return "❌"; // Poor
  };

  const getWindSpeedColor = (speed: number) => {
    // Traffic light system: Green = Good, Yellow = Moderate, Red = Poor
    if (speed >= 500) return "#22c55e"; // Green
    if (speed >= 400) return "#eab308"; // Yellow
    return "#ef4444"; // Red
  };

  const getDensityEmoji = (density: number) => {
    if (density >= 10) return "✅"; // Good for aurora
    if (density >= 5) return "👌"; // Moderate
    return "❌"; // Poor
  };

  const getDensityColor = (density: number) => {
    // Traffic light system: Green = Good, Yellow = Moderate, Red = Poor
    if (density >= 10) return "#22c55e"; // Green
    if (density >= 5) return "#eab308"; // Yellow
    return "#ef4444"; // Red
  };

  const getCloudCoverEmoji = (cloudCover: number, daylight: string | null) => {
    // Clear skies (<30%)
    if (cloudCover < 30) {
      if (daylight === "Night") return "🌙";
      if (daylight === "Twilight") return "🌆";
      if (daylight === "Day") return "☀️";
      return "🌙"; // Default to night moon
    }
    // Partly cloudy (30-70%)
    if (cloudCover < 70) {
      if (daylight === "Day") return "⛅";
      return "🌥️"; // Cloudy for night/twilight
    }
    // Cloudy (>70%)
    return "☁️";
  };

  const getBortleEmoji = (bortle: number) => {
    // Even city skies can see aurora during strong events, so not impossible
    if (bortle <= 4) return "✅"; // Excellent dark skies (rural/dark site)
    if (bortle <= 6) return "👌"; // Good (suburban - aurora visible)
    return "🌃"; // City lights (challenging but possible during strong aurora)
  };

  const getBzStatus = (bz: number) => {
    if (bz <= -10) return "Excellent";
    if (bz <= -5) return "Very Good";
    if (bz <= -2) return "Good";
    if (bz <= 0) return "Fair";
    return "Poor";
  };

  const getSpeedColor = (speed: number) => {
    // Traffic light system: Green = Good (fast), Yellow = Moderate, Red = Poor (slow)
    if (speed >= 500) return "#22c55e"; // Green (good for aurora)
    if (speed >= 400) return "#eab308"; // Yellow (moderate)
    return "#ef4444"; // Red (slow - less aurora activity)
  };

  const getSpeedStatus = (speed: number) => {
    if (speed >= 700) return "Excellent";
    if (speed >= 600) return "Very Good";
    if (speed >= 500) return "Good";
    if (speed >= 400) return "Fair";
    return "Poor";
  };

  const getDensityStatus = (density: number) => {
    if (density >= 20) return "Excellent";
    if (density >= 15) return "Very Good";
    if (density >= 10) return "Good";
    if (density >= 5) return "Fair";
    return "Poor";
  };

  const getHemispherePowerColor = (gw: number) => {
    // Traffic light: Green = strong aurora, Yellow = moderate, Red = weak
    if (gw >= 50) return "#22c55e"; // Green (strong aurora activity)
    if (gw >= 20) return "#eab308"; // Yellow (moderate)
    return "#ef4444"; // Red (quiet)
  };

  const getHemispherePowerStatus = (gw: number) => {
    if (gw >= 100) return "Severe";
    if (gw >= 50) return "High";
    if (gw >= 20) return "Active";
    return "Quiet";
  };

  const getMoonPhaseEmoji = (phase: string) => {
    switch (phase) {
      case "New Moon":
        return "🌑";
      case "Waxing Crescent":
        return "🌒";
      case "First Quarter":
        return "🌓";
      case "Waxing Gibbous":
        return "🌔";
      case "Full Moon":
        return "🌕";
      case "Waning Gibbous":
        return "🌖";
      case "Last Quarter":
        return "🌗";
      case "Waning Crescent":
        return "🌘";
      default:
        return "🌙";
    }
  };

  const getFlareColor = (flareClass: string) => {
    if (flareClass === "X") return "#ff0000";
    if (flareClass === "M") return "#ffaa00";
    if (flareClass === "C") return "#ffff00";
    if (flareClass === "B") return "#7fff00";
    return "#00ff00";
  };

  const getFlareStatus = (flareClass: string) => {
    if (flareClass === "X") return "Major - Watch for CME";
    if (flareClass === "M") return "Moderate - Monitor";
    if (flareClass === "C") return "Minor Impact";
    if (flareClass === "B") return "Minimal Impact";
    return "Background Level";
  };

  // Aurora visibility check based on latitude and Kp
  const canSeeAuroraAtLatitude = (latitude: number, kp: number): { canSee: boolean; minKpRequired: number | null } => {
    const absLat = Math.abs(latitude);

    // Kp to latitude visibility mapping (approximate, for northern/southern hemispheres)
    // These are rough guidelines - aurora visibility depends on many factors
    const kpToMinLatitude: { [key: number]: number } = {
      0: 66, 1: 64, 2: 62,  // Very low activity - Arctic regions only
      3: 58,                  // Low activity
      4: 56,                  // Moderate-low
      5: 50,                  // Moderate (Northern UK, Southern Canada)
      6: 46,                  // Strong (Northern USA states)
      7: 42,                  // Very strong
      8: 38,                  // Extreme
      9: 30,                  // Severe (rare events)
    };

    // Check current visibility
    const requiredLatitude = kpToMinLatitude[Math.round(kp)] || 66;
    const canSeeNow = absLat >= requiredLatitude;

    // Calculate minimum Kp required for this latitude
    // Find the LOWEST Kp that allows visibility at this latitude
    let minKpRequired = null;
    for (let testKp = 9; testKp >= 0; testKp--) {
      const minLat = kpToMinLatitude[testKp] || 66;
      if (absLat >= minLat) {
        minKpRequired = testKp;
        // Don't break - keep going to find the lowest Kp
      }
    }

    return { canSee: canSeeNow, minKpRequired };
  };

  // Autocomplete functions
  const fetchHuntLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setHuntLocationSuggestions([]);
      setShowHuntLocationSuggestions(false);
      return;
    }

    setLoadingHuntLocationSuggestions(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
      );
      const data = await response.json();
      setHuntLocationSuggestions(data.results || []);
      setShowHuntLocationSuggestions(true);
      setHuntLocationSelectedIndex(-1);
    } catch (error) {
      console.error("Error fetching hunt location suggestions:", error);
      setHuntLocationSuggestions([]);
    } finally {
      setLoadingHuntLocationSuggestions(false);
    }
  };

  const fetchYourLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setYourLocationSuggestions([]);
      setShowYourLocationSuggestions(false);
      return;
    }

    setLoadingYourLocationSuggestions(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
      );
      const data = await response.json();
      setYourLocationSuggestions(data.results || []);
      setShowYourLocationSuggestions(true);
      setYourLocationSelectedIndex(-1);
    } catch (error) {
      console.error("Error fetching your location suggestions:", error);
      setYourLocationSuggestions([]);
    } finally {
      setLoadingYourLocationSuggestions(false);
    }
  };

  const handleHuntLocationChange = (value: string) => {
    setHuntLocation(value);
    if (huntLocationDebounceTimer.current) {
      clearTimeout(huntLocationDebounceTimer.current);
    }
    if (value.length < 2) {
      setHuntLocationSuggestions([]);
      setShowHuntLocationSuggestions(false);
      return;
    }
    huntLocationDebounceTimer.current = setTimeout(() => {
      fetchHuntLocationSuggestions(value);
    }, 300);
  };

  const handleYourLocationChange = (value: string) => {
    setYourLocation(value);
    if (yourLocationDebounceTimer.current) {
      clearTimeout(yourLocationDebounceTimer.current);
    }
    if (value.length < 2) {
      setYourLocationSuggestions([]);
      setShowYourLocationSuggestions(false);
      return;
    }
    yourLocationDebounceTimer.current = setTimeout(() => {
      fetchYourLocationSuggestions(value);
    }, 300);
  };

  const handleHuntLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showHuntLocationSuggestions || huntLocationSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHuntLocationSelectedIndex((prev) =>
          prev < huntLocationSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHuntLocationSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (huntLocationSelectedIndex >= 0 && huntLocationSelectedIndex < huntLocationSuggestions.length) {
          selectHuntLocationSuggestion(huntLocationSuggestions[huntLocationSelectedIndex]);
        }
        break;
      case "Escape":
        setShowHuntLocationSuggestions(false);
        setHuntLocationSelectedIndex(-1);
        break;
    }
  };

  const handleYourLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showYourLocationSuggestions || yourLocationSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setYourLocationSelectedIndex((prev) =>
          prev < yourLocationSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setYourLocationSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (yourLocationSelectedIndex >= 0 && yourLocationSelectedIndex < yourLocationSuggestions.length) {
          selectYourLocationSuggestion(yourLocationSuggestions[yourLocationSelectedIndex]);
        }
        break;
      case "Escape":
        setShowYourLocationSuggestions(false);
        setYourLocationSelectedIndex(-1);
        break;
    }
  };

  const selectHuntLocationSuggestion = (suggestion: any) => {
    const displayName = `${suggestion.name}${suggestion.admin1 ? `, ${suggestion.admin1}` : ''}${suggestion.country ? `, ${suggestion.country}` : ''}`;
    setHuntLocation(displayName);
    setHuntLocationSuggestions([]);
    setShowHuntLocationSuggestions(false);
    setHuntLocationSelectedIndex(-1);
    // Auto-submit when location is selected
    setHuntLocationCoords({
      lat: suggestion.latitude,
      lon: suggestion.longitude
    });
    // Trigger the data fetch
    handleHuntLocationSubmitWithCoords(suggestion.latitude, suggestion.longitude);
  };

  const selectYourLocationSuggestion = (suggestion: any) => {
    const displayName = `${suggestion.name}${suggestion.admin1 ? `, ${suggestion.admin1}` : ''}${suggestion.country ? `, ${suggestion.country}` : ''}`;
    setYourLocation(displayName);
    setYourLocationSuggestions([]);
    setShowYourLocationSuggestions(false);
    setYourLocationSelectedIndex(-1);
    // Auto-submit when location is selected
    setYourLocationCoords({
      lat: suggestion.latitude,
      lon: suggestion.longitude
    });
    // Trigger the data fetch for your location only
    handleYourLocationSubmitWithCoords(suggestion.latitude, suggestion.longitude);
  };

  // Location Recommendations - Find nearby locations with better cloud conditions
  // huntLat/huntLon = center point for searching (the cloudy hunt location)
  // userLat/userLon = starting point for drive time calculation (user's current location)
  const fetchLocationRecommendations = async (huntLat: number, huntLon: number, userLat: number, userLon: number, currentWeatherData: any, sunsetTime?: Date, maxDriveHours: number = 2) => {
    setLoadingRecommendations(true);
    setRecommendationsSearched(false);

    try {
      // Calculate hours until sunset if sunset time provided (for daytime scenario)
      let hoursUntilSunset = 0;
      let sunsetHourIndex = -1;
      if (sunsetTime) {
        const now = new Date();
        hoursUntilSunset = Math.max(0, (sunsetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        sunsetHourIndex = Math.round(hoursUntilSunset);
      }
      // Generate grid of nearby locations (8 directions, 4 distances) around HUNT location
      const directions = [
        { name: "North", angle: 0 },
        { name: "Northeast", angle: 45 },
        { name: "East", angle: 90 },
        { name: "Southeast", angle: 135 },
        { name: "South", angle: 180 },
        { name: "Southwest", angle: 225 },
        { name: "West", angle: 270 },
        { name: "Northwest", angle: 315 }
      ];

      const distances = [30, 60, 90, 120]; // km
      const locations: Array<{direction: string; distance: number; lat: number; lon: number}> = [];

      // Generate grid points around the HUNT location
      for (const dir of directions) {
        for (const dist of distances) {
          // Calculate new coordinates based on direction and distance from HUNT location
          const angleRad = (dir.angle * Math.PI) / 180;
          const distKm = dist;
          const latOffset = (distKm / 111) * Math.cos(angleRad); // 1 degree lat ≈ 111 km
          const lonOffset = (distKm / (111 * Math.cos((huntLat * Math.PI) / 180))) * Math.sin(angleRad);

          locations.push({
            direction: dir.name,
            distance: dist,
            lat: huntLat + latOffset,
            lon: huntLon + lonOffset
          });
        }
      }

      // Fetch weather data for all locations (bulk request)
      const recommendations: any[] = [];

      for (const loc of locations) {
        try {
          // Fetch cloud forecast for this location with layer data for accurate assessment
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,time&forecast_hours=24&timezone=auto`
          );
          const weatherData = await weatherResponse.json();

          // Fetch drive time from USER location to this potential clear location
          const routeResponse = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${loc.lon},${loc.lat}?overview=false`
          );
          const routeData = await routeResponse.json();

          if (routeData.code !== "Ok" || !routeData.routes || routeData.routes.length === 0) {
            continue; // Skip if no route found
          }

          const driveTimeMinutes = Math.round(routeData.routes[0].duration / 60);
          const driveTimeHours = driveTimeMinutes / 60;

          // Only consider locations within max drive time
          if (driveTimeHours > maxDriveHours) continue;

          // Helper function to get effective cloud cover (max of total, low, mid)
          const getEffectiveCloud = (idx: number) => {
            const total = weatherData.hourly.cloud_cover[idx] || 0;
            const low = weatherData.hourly.cloud_cover_low?.[idx] || 0;
            const mid = weatherData.hourly.cloud_cover_mid?.[idx] || 0;
            return Math.max(total, low, mid);
          };

          // DAYTIME SCENARIO: Calculate conditions at sunset + drive time
          let cloudCoverAtTarget, targetHourIndex, departureTime;
          if (sunsetTime && sunsetHourIndex >= 0) {
            // For daytime: check cloud cover when they ARRIVE at sunset
            targetHourIndex = Math.min(sunsetHourIndex, 23);
            cloudCoverAtTarget = getEffectiveCloud(targetHourIndex);

            // Calculate departure time (sunset - drive time)
            departureTime = new Date(sunsetTime.getTime() - (driveTimeMinutes * 60 * 1000));
          } else {
            // NIGHTTIME SCENARIO: Calculate immediate arrival conditions
            targetHourIndex = Math.min(Math.round(driveTimeHours), 23);
            cloudCoverAtTarget = getEffectiveCloud(targetHourIndex);
          }

          // Find when clear skies start (effective cloud cover < 30%)
          let clearSkiesStartHour = -1;
          let clearSkiesStartTime = null;
          for (let i = 0; i < weatherData.hourly.cloud_cover.length; i++) {
            if (getEffectiveCloud(i) < 30) {
              clearSkiesStartHour = i;
              clearSkiesStartTime = new Date(weatherData.hourly.time[i]);
              break;
            }
          }

          // Analyze cloud trend using effective cloud cover (max of total, low, mid)
          const currentTotal = weatherData.current.cloud_cover || 0;
          const currentLow = weatherData.current.cloud_cover_low || 0;
          const currentMid = weatherData.current.cloud_cover_mid || 0;
          const cloudNow = Math.max(currentTotal, currentLow, currentMid);
          const cloudIn2h = getEffectiveCloud(Math.min(2, weatherData.hourly.cloud_cover.length - 1));

          let trend = "stable";
          if (cloudIn2h < cloudNow - 15) trend = "clearing";
          else if (cloudIn2h > cloudNow + 15) trend = "worsening";

          // Calculate score (lower is better)
          let score = cloudCoverAtTarget * 2; // Cloud cover at target time is most important
          score += driveTimeMinutes * 0.1; // Shorter drive is better
          if (trend === "clearing") score -= 20; // Bonus for clearing
          if (trend === "worsening") score += 20; // Penalty for worsening

          // For daytime scenario: big bonus if clear at sunset
          if (sunsetTime && cloudCoverAtTarget < 30) {
            score -= 40; // Excellent: clear when darkness arrives
          }

          recommendations.push({
            direction: loc.direction,
            distance: loc.distance,
            driveTime: driveTimeMinutes,
            coords: { lat: loc.lat, lon: loc.lon },
            cloudCoverNow: Math.round(cloudNow),
            cloudCoverAtArrival: Math.round(cloudCoverAtTarget),
            clearSkiesStartHour,
            clearSkiesStartTime,
            departureTime, // Only set for daytime scenario
            trend,
            score
          });
        } catch (error) {
          // Skip locations with errors
          continue;
        }
      }

      // Sort by cloud cover at arrival (lower is better), then by drive time
      recommendations.sort((a, b) => {
        // Primary sort: cloud cover at arrival (clearer skies first)
        if (a.cloudCoverAtArrival !== b.cloudCoverAtArrival) {
          return a.cloudCoverAtArrival - b.cloudCoverAtArrival;
        }
        // Secondary sort: shorter drive time
        return a.driveTime - b.driveTime;
      });

      // Take top 4 options - let user decide based on the info provided
      // Add comparison info for each recommendation
      const topRecommendations = recommendations.slice(0, 4).map(rec => {
        const arrivalHourIndex = Math.min(Math.round(rec.driveTime / 60), 7);
        const huntLocationCloudAtArrival = currentWeatherData.hourly?.cloud_cover?.[arrivalHourIndex]
          || currentWeatherData.current.cloud_cover;
        const improvement = huntLocationCloudAtArrival - rec.cloudCoverAtArrival;

        return {
          ...rec,
          huntLocationCloudAtArrival,
          improvement, // positive = better, negative = worse
          isBetter: improvement > 0
        };
      });

      setLocationRecommendations(topRecommendations);
      setRecommendationsSearched(true);
      setLoadingRecommendations(false);
    } catch (error) {
      console.error("Error fetching location recommendations:", error);
      setRecommendationsSearched(true);
      setLoadingRecommendations(false);
    }
  };

  // Hunt Location data fetching with coordinates
  const handleHuntLocationSubmitWithCoords = async (lat: number, lon: number) => {
    setLoadingHuntLocationData(true);

    try {

      // Fetch weather data (current + hourly forecast) from Open-Meteo (free, no API key)
      // Include cloud layer data for accurate aurora visibility assessment
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_direction_10m,relative_humidity_2m,precipitation_probability&forecast_hours=12&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

      // For aurora visibility, use the maximum cloud cover across all layers
      // Low clouds (0-2km) are most impactful as they completely block the view
      const totalCloud = weatherData.current.cloud_cover || 0;
      const lowCloud = weatherData.current.cloud_cover_low || 0;
      const midCloud = weatherData.current.cloud_cover_mid || 0;
      const highCloud = weatherData.current.cloud_cover_high || 0;

      // Use the maximum of total cloud cover or low clouds (most impactful for aurora viewing)
      // Low/mid clouds block aurora completely; high thin clouds have less impact
      const effectiveCloudCover = Math.max(totalCloud, lowCloud, midCloud);
      setCloudCover(effectiveCloudCover);

      // Convert timezone to GMT format
      const utcOffsetSeconds = weatherData.utc_offset_seconds || 0;
      const utcOffsetHours = utcOffsetSeconds / 3600;
      const gmtString = utcOffsetHours >= 0
        ? `GMT+${utcOffsetHours}`
        : `GMT${utcOffsetHours}`;
      setHuntLocationTimezone(gmtString); // Set GMT timezone format

      setHuntLocationWeatherData(weatherData); // Store weather data for later use

      // Store hourly forecast data with effective cloud cover (max of layers)
      if (weatherData.hourly) {
        const effectiveHourlyCloud = weatherData.hourly.cloud_cover.map((total: number, i: number) => {
          const low = weatherData.hourly.cloud_cover_low?.[i] || 0;
          const mid = weatherData.hourly.cloud_cover_mid?.[i] || 0;
          return Math.max(total, low, mid);
        });

        setCloudForecast({
          time: weatherData.hourly.time,
          cloudCover: effectiveHourlyCloud,
          windSpeed: weatherData.hourly.wind_speed_10m,
          windDirection: weatherData.hourly.wind_direction_10m,
          humidity: weatherData.hourly.relative_humidity_2m,
          precipitation: weatherData.hourly.precipitation_probability
        });
      }

      // Calculate daylight status using sunrise/sunset/twilight
      // Using Sunrise-Sunset.org API (free, no API key, accurate twilight calculations)
      const sunResponse = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0&date=today`
      );
      const sunData = await sunResponse.json();

      // Parse times (API returns ISO 8601 UTC times)
      const sunrise = new Date(sunData.results.sunrise);
      const sunset = new Date(sunData.results.sunset);
      const civilTwilightBegin = new Date(sunData.results.civil_twilight_begin);
      const civilTwilightEnd = new Date(sunData.results.civil_twilight_end);

      // Store sunset time for display
      setSunsetTime(sunset);

      // Get current UTC time for comparison (both times in UTC)
      const nowUtc = new Date();

      // Determine daylight status by comparing UTC times
      let status: "Day" | "Twilight" | "Night";
      if (nowUtc >= sunrise && nowUtc <= sunset) {
        status = "Day";
      } else if (
        (nowUtc >= civilTwilightBegin && nowUtc < sunrise) ||
        (nowUtc > sunset && nowUtc <= civilTwilightEnd)
      ) {
        status = "Twilight";
      } else {
        status = "Night";
      }
      setDaylightStatus(status);

      // Estimate Bortle class based on population density (simplified)
      // This is a rough estimate - for accurate light pollution, we'd need specialized APIs
      const populationResponse = await fetch(
        `/api/geocode/reverse?lat=${lat}&lng=${lon}`
      );
      const populationData = await populationResponse.json();

      // Rough Bortle estimation based on location type
      let estimatedBortle = 4; // Default: rural-suburban transition
      const city = populationData.city;

      if (city) {
        // Major cities get highest light pollution
        if (["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"].includes(city)) {
          estimatedBortle = 9; // Inner city
        } else {
          estimatedBortle = 7; // Suburban/urban transition
        }
      } else {
        // No city means rural or remote area
        estimatedBortle = 3; // Rural
      }

      setBortleClass(estimatedBortle);

      // Calculate peak viewing window based on latitude
      // Aurora oval position varies by latitude - higher latitudes have different optimal viewing times
      let peakStart = 22; // Default 10 PM
      let peakEnd = 2;    // Default 2 AM

      const absLat = Math.abs(lat);

      if (absLat >= 65) {
        // Arctic/Antarctic regions (65°+): Aurora can be visible all night, peak is midnight-centered
        peakStart = 23; // 11 PM
        peakEnd = 3;    // 3 AM
      } else if (absLat >= 60) {
        // Sub-Arctic (60-65°): Standard peak viewing window
        peakStart = 22; // 10 PM
        peakEnd = 2;    // 2 AM
      } else if (absLat >= 55) {
        // High mid-latitudes (55-60°): Slightly earlier peak
        peakStart = 21; // 9 PM
        peakEnd = 1;    // 1 AM
      } else if (absLat >= 50) {
        // Mid-latitudes (50-55°): Earlier and shorter window
        peakStart = 20; // 8 PM
        peakEnd = 0;    // Midnight
      } else {
        // Lower latitudes (<50°): Very rare, limited window around midnight
        peakStart = 21; // 9 PM
        peakEnd = 1;    // 1 AM
      }

      setHuntLocationPeakWindow({ start: peakStart, end: peakEnd });

      // Check for upcoming clear window (Feature 5: Prepare Now alert)
      // Only check if currently cloudy and after/near sunset
      if (weatherData.current.cloud_cover > 50 && weatherData.hourly && (status === "Night" || status === "Twilight")) {
        // Look for clear skies in the next 6 hours
        let clearWindowFound = false;
        for (let i = 1; i < Math.min(6, weatherData.hourly.cloud_cover.length); i++) {
          if (weatherData.hourly.cloud_cover[i] < 30) {
            const clearTime = new Date(weatherData.hourly.time[i]);
            const hoursUntil = i;

            if (hoursUntil >= 2 && hoursUntil <= 4) {
              // Perfect window: 2-4 hours away
              setUpcomingClearWindow({
                hoursUntilClear: hoursUntil,
                clearTime: clearTime,
                message: `⚡ Prepare Now! Clear skies predicted in ${hoursUntil} hours. Start getting ready for your aurora hunt!`
              });
              clearWindowFound = true;
            } else if (hoursUntil < 2) {
              // Soon: 0-2 hours away
              setUpcomingClearWindow({
                hoursUntilClear: hoursUntil,
                clearTime: clearTime,
                message: `🚀 Act Fast! Clear skies coming in ${hoursUntil === 0 ? 'less than an hour' : hoursUntil + ' hour' + (hoursUntil > 1 ? 's' : '')}!`
              });
              clearWindowFound = true;
            }
            break;
          }
        }

        if (!clearWindowFound) {
          setUpcomingClearWindow(null);
        }
      } else {
        setUpcomingClearWindow(null);
      }

      // Fetch location recommendations for cloudy hunt locations
      // Search around HUNT location for clear skies, calculate drive time from USER location
      if (yourLocationCoords) {
        if (status === "Day") {
          // Daytime: Find locations near hunt location that will be clear after sunset
          fetchLocationRecommendations(lat, lon, yourLocationCoords.lat, yourLocationCoords.lon, weatherData, sunset);
        } else if (weatherData.current.cloud_cover > 50) {
          // Night/Twilight + cloudy: Find locations near hunt location with better conditions
          fetchLocationRecommendations(lat, lon, yourLocationCoords.lat, yourLocationCoords.lon, weatherData);
        }
      }

      setLoadingHuntLocationData(false);

      // Calculate travel distance if both locations are set
      if (yourLocationCoords) {
        calculateTravelDistance(yourLocationCoords, { lat, lon });
      }
    } catch (error) {
      console.error("Error fetching hunt location data:", error);
      alert("Error fetching hunt location data. Please try again.");
      setLoadingHuntLocationData(false);
    }
  };

  // Hunt Location data fetching (manual submit)
  const handleHuntLocationSubmit = async () => {
    if (!huntLocation.trim()) return;

    setLoadingHuntLocationData(true);

    try {
      // Geocode the location using our API proxy
      const geocodeResponse = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(huntLocation)}`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length === 0) {
        alert("Hunt location not found. Please try again with a different location.");
        setLoadingHuntLocationData(false);
        return;
      }

      const lat = parseFloat(geocodeData[0].lat);
      const lon = parseFloat(geocodeData[0].lon);
      setHuntLocationCoords({ lat, lon });

      // Call the shared function with coordinates
      await handleHuntLocationSubmitWithCoords(lat, lon);
    } catch (error) {
      console.error("Error geocoding hunt location:", error);
      alert("Error geocoding hunt location. Please try again.");
      setLoadingHuntLocationData(false);
    }
  };

  // Your Location data fetching with coordinates
  const handleYourLocationSubmitWithCoords = async (lat: number, lon: number) => {
    setLoadingYourLocationData(true);

    try {

      // Get local time using timezone API
      const timezoneResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=1`
      );
      const timezoneData = await timezoneResponse.json();
      const timezone = timezoneData.timezone;

      // Format current time in user's timezone
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setLocalTime(formatter.format(now));

      setLoadingYourLocationData(false);

      // Calculate travel distance if hunt location is set
      if (huntLocationCoords) {
        calculateTravelDistance({ lat, lon }, huntLocationCoords);
      }
    } catch (error) {
      console.error("Error fetching your location data:", error);
      alert("Error fetching your location data. Please try again.");
      setLoadingYourLocationData(false);
    }
  };

  // Get user's current GPS location
  const handleGetGPSLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingGPSLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Reverse geocode to get location name
        try {
          const geocodeResponse = await fetch(
            `/api/geocode/reverse?lat=${lat}&lng=${lon}`
          );
          const geocodeData = await geocodeResponse.json();

          // Set location name to display
          const locationName = geocodeData.fullAddress || geocodeData.location || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setYourLocation(locationName);
          setYourLocationCoords({ lat, lon });

          // Fetch location data for your location only
          await handleYourLocationSubmitWithCoords(lat, lon);
        } catch (error) {
          console.error("Error reverse geocoding GPS location:", error);
          // Still set coordinates even if reverse geocoding fails
          const coordsString = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setYourLocation(coordsString);
          setYourLocationCoords({ lat, lon });
          // Fetch location data for your location only
          await handleYourLocationSubmitWithCoords(lat, lon);
        } finally {
          setGettingGPSLocation(false);
        }
      },
      (error) => {
        console.error("Error getting GPS location:", error);
        let errorMessage = "Unable to get your location. ";

        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
        }

        alert(errorMessage);
        setGettingGPSLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Hunt Location GPS function
  const handleGetHuntLocationGPS = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingGPSLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Reverse geocode to get location name
        try {
          const geocodeResponse = await fetch(
            `/api/geocode/reverse?lat=${lat}&lng=${lon}`
          );
          const geocodeData = await geocodeResponse.json();

          // Set hunt location name to display
          const locationName = geocodeData.fullAddress || geocodeData.location || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setHuntLocation(locationName);
          setHuntLocationCoords({ lat, lon });

          // Fetch hunt location data
          await handleHuntLocationSubmitWithCoords(lat, lon);
        } catch (error) {
          console.error("Error reverse geocoding GPS location:", error);
          // Still set coordinates even if reverse geocoding fails
          setHuntLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          setHuntLocationCoords({ lat, lon });
          await handleHuntLocationSubmitWithCoords(lat, lon);
        } finally {
          setGettingGPSLocation(false);
        }
      },
      (error) => {
        console.error("Error getting GPS location:", error);
        let errorMessage = "Unable to get your location. ";

        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
        }

        alert(errorMessage);
        setGettingGPSLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Your Location data fetching (manual submit)
  const handleYourLocationSubmit = async () => {
    if (!yourLocation.trim()) return;

    setLoadingYourLocationData(true);

    try {
      // Geocode the location using our API proxy
      const geocodeResponse = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(yourLocation)}`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length === 0) {
        alert("Your location not found. Please try again with a different location.");
        setLoadingYourLocationData(false);
        return;
      }

      const lat = parseFloat(geocodeData[0].lat);
      const lon = parseFloat(geocodeData[0].lon);
      setYourLocationCoords({ lat, lon });

      // Call the shared function with coordinates
      await handleYourLocationSubmitWithCoords(lat, lon);
    } catch (error) {
      console.error("Error geocoding your location:", error);
      alert("Error geocoding your location. Please try again.");
      setLoadingYourLocationData(false);
    }
  };

  // Calculate travel distance and time between two locations
  const calculateTravelDistance = (from: {lat: number; lon: number}, to: {lat: number; lon: number}) => {
    // Haversine formula to calculate distance between two coordinates
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lon - from.lon) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km

    setTravelDistance(distance);

    // Estimate travel time
    const drivingTime = distance / 80; // hours at 80 km/h

    // If driving would take >= 12 hours, calculate flight time instead
    let estimatedTime;
    if (drivingTime >= 12) {
      // Use commercial flight speed (~800 km/h average including takeoff/landing)
      estimatedTime = distance / 800;
    } else {
      estimatedTime = drivingTime;
    }

    setTravelTime(estimatedTime);
  };

  // Cloud Intel functions
  const fetchCloudIntelSuggestions = async (query: string) => {
    if (query.length < 2) {
      setCloudIntelSuggestions([]);
      setShowCloudIntelSuggestions(false);
      return;
    }

    setLoadingCloudIntelSuggestions(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
      );
      const data = await response.json();
      setCloudIntelSuggestions(data.results || []);
      setShowCloudIntelSuggestions(true);
      setCloudIntelSelectedIndex(-1);
    } catch (error) {
      console.error("Error fetching cloud intel suggestions:", error);
      setCloudIntelSuggestions([]);
    } finally {
      setLoadingCloudIntelSuggestions(false);
    }
  };

  const handleCloudIntelLocationChange = (value: string) => {
    setCloudIntelLocation(value);

    if (cloudIntelDebounceTimer.current) {
      clearTimeout(cloudIntelDebounceTimer.current);
    }

    cloudIntelDebounceTimer.current = setTimeout(() => {
      fetchCloudIntelSuggestions(value);
    }, 300);
  };

  const fetchCloudIntelData = async (lat: number, lon: number) => {
    setLoadingCloudIntel(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation,weather_code&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation_probability,visibility&forecast_hours=12&timezone=auto`
      );
      const data = await response.json();
      setCloudIntelData(data);
    } catch (error) {
      console.error("Error fetching cloud intel data:", error);
    } finally {
      setLoadingCloudIntel(false);
    }
  };

  const fetchTwilightData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const now = new Date();
        const sunrise = new Date(data.results.sunrise);
        const sunset = new Date(data.results.sunset);
        const civilTwilightBegin = new Date(data.results.civil_twilight_begin);
        const civilTwilightEnd = new Date(data.results.civil_twilight_end);
        const nauticalTwilightBegin = new Date(data.results.nautical_twilight_begin);
        const nauticalTwilightEnd = new Date(data.results.nautical_twilight_end);
        const astronomicalTwilightBegin = new Date(data.results.astronomical_twilight_begin);
        const astronomicalTwilightEnd = new Date(data.results.astronomical_twilight_end);

        // Determine current period
        let currentPeriod: 'night' | 'astronomical' | 'nautical' | 'civil' | 'daylight' = 'night';

        if (now >= sunrise && now <= sunset) {
          currentPeriod = 'daylight';
        } else if ((now >= civilTwilightBegin && now < sunrise) || (now > sunset && now <= civilTwilightEnd)) {
          currentPeriod = 'civil';
        } else if ((now >= nauticalTwilightBegin && now < civilTwilightBegin) || (now > civilTwilightEnd && now <= nauticalTwilightEnd)) {
          currentPeriod = 'nautical';
        } else if ((now >= astronomicalTwilightBegin && now < nauticalTwilightBegin) || (now > nauticalTwilightEnd && now <= astronomicalTwilightEnd)) {
          currentPeriod = 'astronomical';
        } else {
          currentPeriod = 'night';
        }

        const isDay = now >= sunrise && now <= sunset;

        // Format time
        const formatTime = (date: Date) => {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        };

        setTwilightData({
          currentPeriod,
          sunrise: formatTime(sunrise),
          sunset: formatTime(sunset),
          isDay,
          nextEvent: isDay ? formatTime(sunset) : formatTime(sunrise),
          nextEventType: isDay ? 'sunset' : 'sunrise'
        });
      }
    } catch (error) {
      console.error("Error fetching twilight data:", error);
    }
  };

  const handleCloudIntelLocationSelect = async (suggestion: any) => {
    setCloudIntelLocation(`${suggestion.name}, ${suggestion.admin1 || suggestion.country}`);
    setCloudIntelCoords({ lat: suggestion.latitude, lon: suggestion.longitude });
    setCloudIntelSuggestions([]);
    setShowCloudIntelSuggestions(false);
    setCloudIntelSelectedIndex(-1);
    fetchCloudIntelData(suggestion.latitude, suggestion.longitude);
    fetchTwilightData(suggestion.latitude, suggestion.longitude);

    // Fetch light pollution estimate via reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${suggestion.latitude}&lon=${suggestion.longitude}&format=json`
      );
      const data = await response.json();
      estimateLightPollution(data.address);
    } catch (error) {
      // Default to suburban if reverse geocoding fails
      setLightPollution({ bortle: 5, description: "Suburban Sky", color: "#5d5d8b" });
    }
  };

  const handleCloudIntelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCloudIntelSuggestions || cloudIntelSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setCloudIntelSelectedIndex((prev) =>
          prev < cloudIntelSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setCloudIntelSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (cloudIntelSelectedIndex >= 0 && cloudIntelSelectedIndex < cloudIntelSuggestions.length) {
          handleCloudIntelLocationSelect(cloudIntelSuggestions[cloudIntelSelectedIndex]);
        }
        break;
      case "Escape":
        setShowCloudIntelSuggestions(false);
        setCloudIntelSelectedIndex(-1);
        break;
    }
  };

  const calculateCloudVisibilityScore = (low: number, mid: number, high: number) => {
    const score = 100 - (low * 1.0 + mid * 0.5 + high * 0.2);
    return Math.max(0, Math.min(100, score));
  };

  const getCloudVisibilityVerdict = (score: number, low: number) => {
    if (low > 70) return { verdict: "BLOCKED", emoji: "🚫", color: "text-red-400" };
    if (score >= 70) return { verdict: "EXCELLENT", emoji: "✨", color: "text-green-400" };
    if (score >= 50) return { verdict: "GOOD", emoji: "👌", color: "text-green-300" };
    if (score >= 30) return { verdict: "FAIR", emoji: "🌥️", color: "text-yellow-300" };
    if (score >= 10) return { verdict: "POOR", emoji: "☁️", color: "text-orange-300" };
    return { verdict: "BLOCKED", emoji: "❌", color: "text-red-400" };
  };

  const getCloudLayerImpact = (coverage: number, layer: string) => {
    if (layer === "low") {
      if (coverage > 70) return { impact: "Severe", emoji: "❌", color: "text-red-400" };
      if (coverage > 40) return { impact: "Major", emoji: "⚠️", color: "text-orange-400" };
      if (coverage > 20) return { impact: "Moderate", emoji: "🟡", color: "text-yellow-400" };
      return { impact: "Minimal", emoji: "✅", color: "text-green-400" };
    } else if (layer === "mid") {
      if (coverage > 80) return { impact: "Major", emoji: "⚠️", color: "text-orange-400" };
      if (coverage > 50) return { impact: "Moderate", emoji: "🟡", color: "text-yellow-400" };
      if (coverage > 20) return { impact: "Minor", emoji: "👌", color: "text-green-400" };
      return { impact: "Minimal", emoji: "✅", color: "text-green-400" };
    } else {
      if (coverage > 80) return { impact: "Minor", emoji: "👌", color: "text-green-400" };
      if (coverage > 50) return { impact: "Slight", emoji: "✅", color: "text-green-400" };
      return { impact: "None", emoji: "✅", color: "text-green-400" };
    }
  };

  // Click outside to close Cloud Intel suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cloudIntelSuggestionsRef.current &&
        !cloudIntelSuggestionsRef.current.contains(event.target as Node) &&
        cloudIntelInputRef.current &&
        !cloudIntelInputRef.current.contains(event.target as Node)
      ) {
        setShowCloudIntelSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCmeColor = (speed: number | null) => {
    if (!speed) return "#666666";
    if (speed >= 1000) return "#ff0000";
    if (speed >= 700) return "#ffaa00";
    if (speed >= 500) return "#ffff00";
    return "#00ff00";
  };

  const getCmeStatus = (type: string, speed: number | null) => {
    if (type === "None Active") return "No CME Detected";
    if (!speed) return "Monitoring";
    if (speed >= 1000) return "Major Storm Likely";
    if (speed >= 700) return "Plan Hunt!";
    return "Minor Impact Expected";
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      {/* Tab Navigation - Outside of max-width container for proper sticky behavior */}
      <div className="sticky top-[45px] bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-[9998]">
        <div className="max-w-screen-lg mx-auto">
          <div className="px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("expert")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "expert"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">🚀</span>
                  <span className="text-xs">AIvisor</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("cosmic")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "cosmic"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">🔆</span>
                  <span className="text-xs">Forecast</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("aurora-intel")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "aurora-intel"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">🌌</span>
                  <span className="text-xs">Analysis</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("cloud")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "cloud"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">⛅</span>
                  <span className="text-xs">Intel</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Intel Tab */}
      {activeTab === "cloud" && (
        <div className="max-w-screen-lg mx-auto p-4">
          <div className="space-y-4">
            {/* Title */}
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white">⛅ Visibility Intel</h2>
            </div>

            {/* Sky Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Moon Phase Card */}
              <div
                onClick={() => router.push("/moon-phase")}
                className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-lg rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    {loadingMoon ? (
                      <div className="text-5xl animate-pulse">🌙</div>
                    ) : moonPhase ? (
                      <div className="text-5xl">
                        {getMoonPhaseEmoji(moonPhase.phase)}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-400 text-xs mb-1">Moon Phase</div>
                    {loadingMoon ? (
                      <div className="text-lg font-bold text-gray-400">...</div>
                    ) : moonPhase ? (
                      <>
                        <div className="text-lg font-bold text-white truncate">
                          {moonPhase.phase}
                        </div>
                        <div className="text-xs text-gray-400">
                          {moonPhase.illumination}% Illuminated
                        </div>
                      </>
                    ) : null}
                  </div>
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Celestial Events Card */}
              <div
                onClick={() => router.push("/celestial-events")}
                className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-5xl">☄️</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-400 text-xs mb-1">Next Event</div>
                    {nextCelestialEvent ? (
                      <>
                        <div className="text-lg font-bold text-white truncate">
                          {nextCelestialEvent.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {nextCelestialEvent.daysUntil <= 0
                            ? "Active now!"
                            : nextCelestialEvent.daysUntil === 1
                              ? "Tomorrow"
                              : `In ${nextCelestialEvent.daysUntil} days`}
                        </div>
                      </>
                    ) : (
                      <div className="text-lg font-bold text-gray-400">Loading...</div>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Time of Day & Sunrise/Sunset Cards */}
            {twilightData && (
              <div className="grid grid-cols-2 gap-4">
                {/* Time of Day Card */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">
                      {twilightData.currentPeriod === 'night' && '🌙'}
                      {twilightData.currentPeriod === 'astronomical' && '🌌'}
                      {twilightData.currentPeriod === 'nautical' && '🌊'}
                      {twilightData.currentPeriod === 'civil' && '🌆'}
                      {twilightData.currentPeriod === 'daylight' && '☀️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-400 text-xs mb-1">Time of Day</div>
                      <div className="text-lg font-bold text-white capitalize">
                        {twilightData.currentPeriod === 'astronomical' && 'Astronomical Twilight'}
                        {twilightData.currentPeriod === 'nautical' && 'Nautical Twilight'}
                        {twilightData.currentPeriod === 'civil' && 'Civil Twilight'}
                        {twilightData.currentPeriod === 'daylight' && 'Daylight'}
                        {twilightData.currentPeriod === 'night' && 'Night'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {twilightData.currentPeriod === 'night' && 'Deep darkness - best for aurora'}
                        {twilightData.currentPeriod === 'astronomical' && 'Sky is dark enough for faint stars'}
                        {twilightData.currentPeriod === 'nautical' && 'Horizon barely visible'}
                        {twilightData.currentPeriod === 'civil' && 'Enough light for outdoor activities'}
                        {twilightData.currentPeriod === 'daylight' && 'Sun is above the horizon'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sunrise/Sunset Card */}
                <a
                  href="https://www.timeanddate.com/sun/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block bg-gradient-to-br ${twilightData.isDay ? 'from-orange-900/40 to-red-900/40' : 'from-blue-900/40 to-indigo-900/40'} backdrop-blur-lg rounded-2xl p-4 border border-white/10 cursor-pointer hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">
                      {twilightData.nextEventType === 'sunrise' ? '🌅' : '🌇'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-400 text-xs mb-1">
                        {twilightData.nextEventType === 'sunrise' ? 'Next Sunrise' : 'Next Sunset'}
                      </div>
                      <div className="text-lg font-bold text-white">
                        {twilightData.nextEvent}
                      </div>
                      <div className="text-xs text-gray-400">
                        {twilightData.nextEventType === 'sunrise'
                          ? 'Aurora viewing ends soon'
                          : 'Aurora viewing begins soon'}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              </div>
            )}

            {/* Location Input */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-indigo-500/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Location</h3>
                  <p className="text-xs text-gray-400">
                    {autoDetectingLocation ? "Detecting your location..." : "Auto-detected or enter manually"}
                  </p>
                </div>
                <button
                  onClick={autoDetectCloudIntelLocation}
                  disabled={autoDetectingLocation}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  {autoDetectingLocation ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  <span>Detect</span>
                </button>
              </div>

              <div className="relative flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={cloudIntelInputRef}
                    type="text"
                    value={cloudIntelLocation}
                    onChange={(e) => handleCloudIntelLocationChange(e.target.value)}
                    onKeyDown={handleCloudIntelKeyDown}
                    onFocus={() => {
                      if (cloudIntelSuggestions.length > 0) setShowCloudIntelSuggestions(true);
                    }}
                    placeholder="e.g., Oslo, Norway"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoComplete="off"
                  />

                {loadingCloudIntelSuggestions && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Autocomplete Dropdown */}
                {showCloudIntelSuggestions && cloudIntelSuggestions.length > 0 && (
                  <div
                    ref={cloudIntelSuggestionsRef}
                    className="absolute z-[9999] w-full mt-1 bg-[#1a1f2e] border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                  >
                    {cloudIntelSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCloudIntelLocationSelect(suggestion)}
                        className={`px-3 py-2 cursor-pointer text-sm text-white border-b border-white/10 last:border-b-0 ${
                          idx === cloudIntelSelectedIndex
                            ? "bg-white/20"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <div className="font-semibold">{suggestion.name}</div>
                        <div className="text-xs text-gray-400">
                          {suggestion.admin1 && `${suggestion.admin1}, `}
                          {suggestion.country}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showCloudIntelSuggestions && !loadingCloudIntelSuggestions && cloudIntelSuggestions.length === 0 && cloudIntelLocation.length >= 2 && (
                  <div
                    ref={cloudIntelSuggestionsRef}
                    className="absolute z-[9999] w-full mt-1 bg-[#1a1f2e] border border-white/20 rounded-lg shadow-xl p-3"
                  >
                    <p className="text-gray-400 text-sm text-center">
                      No locations found. Try a different search.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (cloudIntelCoords) {
                    fetchCloudIntelData(cloudIntelCoords.lat, cloudIntelCoords.lon);
                  }
                }}
                disabled={loadingCloudIntel || !cloudIntelLocation.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loadingCloudIntel ? "..." : "Get"}
              </button>
            </div>
          </div>

          {/* Light Pollution Card */}
          {lightPollution && (
            <a
              href="https://lightpollutionmap.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative overflow-hidden rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform border border-white/10 mt-4"
              style={{
                backgroundImage: "url('/images/light-pollution-levels.png')",
                backgroundSize: "cover",
                backgroundPosition: `center ${
                  lightPollution.bortle <= 2 ? "0%" :
                  lightPollution.bortle <= 4 ? "25%" :
                  lightPollution.bortle <= 5 ? "50%" :
                  lightPollution.bortle <= 7 ? "75%" : "100%"
                }`,
              }}
            >
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black/40"></div>

              <div className="relative z-10 p-4 flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/20">
                    <span className="text-2xl">
                      {lightPollution.bortle <= 2 ? "🌌" : lightPollution.bortle <= 4 ? "✨" : lightPollution.bortle <= 5 ? "🌃" : lightPollution.bortle <= 7 ? "🏘️" : "🏙️"}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-300 text-xs mb-1">Light Pollution (Bortle Scale)</div>
                  <div className="text-lg font-bold text-white drop-shadow-lg">
                    Class {lightPollution.bortle}
                  </div>
                  <div className="text-xs text-gray-200">
                    {lightPollution.description}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {/* Bortle Scale Visual */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-4 rounded-sm ${
                          level <= lightPollution.bortle ? "opacity-100" : "opacity-30"
                        }`}
                        style={{
                          backgroundColor:
                            level <= 2 ? "#1a1a2e" :
                            level <= 4 ? "#1f4068" :
                            level <= 6 ? "#8a8ab0" :
                            level <= 8 ? "#e09f3e" : "#ff6b6b"
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-200">
                    {lightPollution.bortle <= 3 ? "Great for aurora" : lightPollution.bortle <= 5 ? "Fair visibility" : "Light polluted"}
                  </div>
                  <svg className="w-4 h-4 text-white/70 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </a>
          )}

          {loadingCloudIntel && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="text-gray-300 mt-4">Loading cloud data...</p>
            </div>
          )}

          {cloudIntelData && !loadingCloudIntel && (
            <>
              {/* Current Conditions */}
              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-blue-500/30 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🌤️</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Current Cloud Layers</h2>
                    <p className="text-sm text-gray-300">Real-time altitude analysis</p>
                  </div>
                </div>

                {/* Visibility Score */}
                {(() => {
                  const low = cloudIntelData.current.cloud_cover_low || 0;
                  const mid = cloudIntelData.current.cloud_cover_mid || 0;
                  const high = cloudIntelData.current.cloud_cover_high || 0;
                  const score = calculateCloudVisibilityScore(low, mid, high);
                  const result = getCloudVisibilityVerdict(score, low);

                  return (
                    <div className={`bg-white/10 rounded-xl p-6 mb-6 border-2 ${result.verdict === "BLOCKED" ? "border-red-500/50" : result.verdict === "EXCELLENT" || result.verdict === "GOOD" ? "border-green-500/50" : result.verdict === "FAIR" ? "border-yellow-500/50" : "border-orange-500/50"}`}>
                      <div className="text-center mb-4">
                        <div className={`text-5xl font-black ${result.color} mb-2`}>
                          {result.emoji} {result.verdict}
                        </div>
                        <div className="text-2xl font-bold text-white">
                          Aurora Visibility: {score.toFixed(0)}%
                        </div>
                      </div>

                      <div className="text-sm text-gray-200 text-center">
                        {low > 70 ? "Dense low clouds completely blocking aurora" :
                         score >= 70 ? "Excellent viewing through thin/high clouds!" :
                         score >= 50 ? "Aurora visible but dimmed by cloud layers" :
                         score >= 30 ? "Only strong aurora visible through clouds" :
                         score >= 10 ? "Heavy clouds severely limiting visibility" :
                         "Aurora completely blocked by thick clouds"}
                      </div>
                    </div>
                  );
                })()}

                {/* Cloud Layers Breakdown */}
                <div className="space-y-4">
                  {/* Low Clouds */}
                  {(() => {
                    const coverage = cloudIntelData.current.cloud_cover_low || 0;
                    const impact = getCloudLayerImpact(coverage, "low");
                    return (
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">☁️</span>
                            <div>
                              <div className="text-lg font-bold text-white">Low Clouds (0-2 km)</div>
                              <div className="text-xs text-gray-400">Stratus, Fog, Cumulus</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">{coverage}%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{impact.emoji}</span>
                          <span className={`text-sm font-semibold ${impact.color}`}>
                            {impact.impact} Impact
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${coverage > 70 ? "bg-red-500" : coverage > 40 ? "bg-orange-500" : coverage > 20 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${coverage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {coverage > 70 ? "Dense low clouds completely block aurora - like a ceiling" :
                           coverage > 40 ? "Significant low cloud coverage blocking aurora" :
                           coverage > 20 ? "Some low clouds present but gaps exist" :
                           "Minimal low clouds - aurora should shine through"}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Mid Clouds */}
                  {(() => {
                    const coverage = cloudIntelData.current.cloud_cover_mid || 0;
                    const impact = getCloudLayerImpact(coverage, "mid");
                    return (
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🌥️</span>
                            <div>
                              <div className="text-lg font-bold text-white">Mid Clouds (2-6 km)</div>
                              <div className="text-xs text-gray-400">Altostratus, Altocumulus</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">{coverage}%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{impact.emoji}</span>
                          <span className={`text-sm font-semibold ${impact.color}`}>
                            {impact.impact} Impact
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${coverage > 80 ? "bg-orange-500" : coverage > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${coverage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {coverage > 80 ? "Heavy mid-level clouds will dim aurora significantly" :
                           coverage > 50 ? "Moderate mid clouds reducing aurora brightness" :
                           coverage > 20 ? "Some mid clouds present but aurora still visible" :
                           "Minimal mid clouds - good conditions"}
                        </p>
                      </div>
                    );
                  })()}

                  {/* High Clouds */}
                  {(() => {
                    const coverage = cloudIntelData.current.cloud_cover_high || 0;
                    const impact = getCloudLayerImpact(coverage, "high");
                    return (
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">✨</span>
                            <div>
                              <div className="text-lg font-bold text-white">High Clouds (6-13 km)</div>
                              <div className="text-xs text-gray-400">Cirrus, Cirrostratus</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">{coverage}%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{impact.emoji}</span>
                          <span className={`text-sm font-semibold ${impact.color}`}>
                            {impact.impact} Impact
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="h-3 rounded-full bg-green-500"
                            style={{ width: `${coverage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {coverage > 80 ? "High thin clouds - aurora easily shines through!" :
                           coverage > 50 ? "Some high clouds but minimal impact on viewing" :
                           "Clear at high altitudes - perfect for aurora"}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Total Cloud Cover Comparison */}
                <div className="mt-6 bg-white/5 rounded-xl p-5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Total Cloud Cover</div>
                      <div className="text-2xl font-bold text-white">{cloudIntelData.current.cloud_cover}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">Aurora Visibility</div>
                      <div className="text-2xl font-bold text-green-400">
                        {calculateCloudVisibilityScore(
                          cloudIntelData.current.cloud_cover_low || 0,
                          cloudIntelData.current.cloud_cover_mid || 0,
                          cloudIntelData.current.cloud_cover_high || 0
                        ).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 italic">
                    💡 Total cloud cover can be misleading! High thin clouds (cirrus) allow aurora viewing,
                    while low thick clouds (stratus) block it completely. Auroras occur at 80-250 km altitude,
                    far above all clouds (max ~13 km), so visibility depends on cloud opacity, not height.
                  </p>
                </div>
              </div>

              {/* 12-Hour Forecast */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">📊</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">12-Hour Forecast</h2>
                    <p className="text-sm text-gray-300">Cloud layer trends</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="inline-flex gap-3 pb-4">
                    {cloudIntelData.hourly.cloud_cover.slice(0, 12).map((_: any, idx: number) => {
                      const low = cloudIntelData.hourly.cloud_cover_low[idx] || 0;
                      const mid = cloudIntelData.hourly.cloud_cover_mid[idx] || 0;
                      const high = cloudIntelData.hourly.cloud_cover_high[idx] || 0;
                      const score = calculateCloudVisibilityScore(low, mid, high);
                      const time = new Date(cloudIntelData.hourly.time[idx]);

                      return (
                        <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10 min-w-[140px]">
                          <div className="text-center mb-3">
                            <div className="text-sm font-semibold text-white">
                              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-400">
                              +{idx}h
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Low</span>
                              <span className={`font-bold ${low > 70 ? 'text-red-400' : low > 40 ? 'text-orange-400' : 'text-green-400'}`}>
                                {low}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Mid</span>
                              <span className={`font-bold ${mid > 80 ? 'text-orange-400' : mid > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {mid}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">High</span>
                              <span className="font-bold text-green-400">{high}%</span>
                            </div>
                          </div>

                          <div className="text-center pt-3 border-t border-white/10">
                            <div className={`text-lg font-bold ${score >= 70 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : score >= 30 ? 'text-orange-400' : 'text-red-400'}`}>
                              {score.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-400">Visibility</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {!cloudIntelData && !loadingCloudIntel && !autoDetectingLocation && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">⛅</span>
              <p className="text-xl text-gray-300">Waiting for location...</p>
              <p className="text-sm text-gray-500 mt-2">Click "Detect" or enter a location above</p>
            </div>
          )}

          {autoDetectingLocation && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-300 mt-4">Detecting your location...</p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Map Intel Tab */}
      {activeTab === "map" && (
        <div className="w-full" style={{ height: "calc(100vh - 170px)" }}>
          {/* Map Container */}
          <div className="h-[calc(100%-80px)] relative">
            <AuroraMap
              showAuroraProbability={showAuroraProbability}
              showLightPollution={showLightPollution}
              showCloudCover={showCloudCover}
              showHunts={showHunts}
              showSightings={showSightings}
              showTwilightZones={showTwilightZones}
            />
          </div>

          {/* Map Toggle Controls */}
          <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border-t border-white/10 p-4">
            <div className="max-w-screen-lg mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Aurora Probability Toggle */}
                <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-white text-sm font-medium">Aurora Probability</span>
                  <button
                    onClick={() => setShowAuroraProbability(!showAuroraProbability)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showAuroraProbability ? "bg-aurora-green" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showAuroraProbability ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Cloud Cover Toggle */}
                <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-white text-sm font-medium">Cloud Cover</span>
                  <button
                    onClick={() => setShowCloudCover(!showCloudCover)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showCloudCover ? "bg-aurora-green" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showCloudCover ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Day/Night Toggle */}
                <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-white text-sm font-medium">Day/Night</span>
                  <button
                    onClick={() => setShowTwilightZones(!showTwilightZones)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showTwilightZones ? "bg-aurora-green" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showTwilightZones ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Light Pollution Toggle */}
                <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-white text-sm font-medium">Light Pollution</span>
                  <button
                    onClick={() => setShowLightPollution(!showLightPollution)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showLightPollution ? "bg-aurora-green" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showLightPollution ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Hunts Toggle */}
                <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-white text-sm font-medium">Hunts</span>
                  <button
                    onClick={() => setShowHunts(!showHunts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showHunts ? "bg-aurora-green" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showHunts ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Sightings Toggle */}
                <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-white text-sm font-medium">Sightings</span>
                  <button
                    onClick={() => setShowSightings(!showSightings)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showSightings ? "bg-aurora-green" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showSightings ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cosmic Intel Tab */}
      {activeTab === "cosmic" && (
        <div className="max-w-screen-lg mx-auto p-4">
          <div className="space-y-4">
            {/* Aurora Forecast Title */}
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white">🔆 Aurora Forecast</h2>
            </div>

            {/* Navigation Cards - 3 Column Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* CME Alerts Card */}
              <button
                onClick={() => router.push("/cme-alerts")}
                className="bg-gradient-to-br from-orange-900/40 to-red-900/40 rounded-xl p-4 border border-orange-500/30 hover:scale-[1.02] hover:border-orange-400/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-5xl">☄️</span>
                  <h3 className="text-sm font-bold text-white">CME Alerts</h3>
                </div>
              </button>

              {/* Solar Flare Card */}
              <button
                onClick={() => router.push("/solar-flares")}
                className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-xl p-4 border border-yellow-500/30 hover:scale-[1.02] hover:border-yellow-400/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-5xl">⚡</span>
                  <h3 className="text-sm font-bold text-white">Solar Flare</h3>
                </div>
              </button>

              {/* Coronal Holes Card */}
              <button
                onClick={() => router.push("/coronal-holes")}
                className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl p-4 border border-purple-500/30 hover:scale-[1.02] hover:border-purple-400/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-5xl">🕳️</span>
                  <h3 className="text-sm font-bold text-white">Coronal Holes</h3>
                </div>
              </button>
            </div>

            {/* Real-time Solar Data Cards - 3 Column Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* CME Alert Card - Shows CMEs with speed >= 400 */}
              {(() => {
                // Find CMEs with speed >= 400 (priority CMEs)
                const now = new Date();
                const upcomingPriorityCme = cmeAlertsList.find(cme => {
                  const arrivalDate = new Date(cme.arrivalDate);
                  return arrivalDate > now && cme.speed >= 400;
                });
                const pastPriorityCme = cmeAlertsList.find(cme => {
                  const arrivalDate = new Date(cme.arrivalDate);
                  return arrivalDate <= now && cme.speed >= 400;
                });
                const displayCme = upcomingPriorityCme || pastPriorityCme;
                const isPast = !upcomingPriorityCme && pastPriorityCme;

                // Labels and colors based on speed:
                // >= 700: "Storm" 🟢 Green (high priority - excellent for aurora)
                // >= 500: "Active" 🟢 Green (good for aurora)
                // >= 400: "Weak" 🟡 Yellow (moderate)
                const getSpeedLabel = (speed: number) => {
                  if (speed >= 700) return 'Storm';
                  if (speed >= 500) return 'Active';
                  return 'Weak';
                };
                const getSpeedEmoji = (speed: number) => speed >= 500 ? '🟢' : '🟡';
                const getSpeedColor = (speed: number) => speed >= 500 ? '#22c55e' : '#eab308';

                return (
                  <button
                    onClick={() => router.push("/cme-alerts")}
                    className={`bg-white/5 rounded-xl p-4 border border-white/10 hover:border-orange-500/40 transition-all text-left ${isPast ? 'opacity-50' : ''}`}
                  >
                    <div className="text-xs text-gray-400 mb-1">CME "Red" Alert</div>
                    {loadingCme ? (
                      <div className="text-lg font-bold text-gray-500">Loading...</div>
                    ) : displayCme ? (
                      <>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: getSpeedColor(displayCme.speed) }}
                        >
                          {getSpeedEmoji(displayCme.speed)} {getSpeedLabel(displayCme.speed)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {isPast ? 'Arrived: ' : ''}{displayCme.arrivalDate}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-500">None</div>
                        <div className="text-xs text-gray-500 mt-1">No active CME</div>
                      </>
                    )}
                  </button>
                );
              })()}

              {/* Solar Flare Activity Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Solar Flare Activity</div>
                {loadingFlare ? (
                  <div className="text-lg font-bold text-gray-500">Loading...</div>
                ) : solarFlare ? (
                  <>
                    <div
                      className="text-2xl font-bold"
                      style={{
                        color: solarFlare.class === 'X' ? '#ef4444' :
                               solarFlare.class === 'M' ? '#f59e0b' :
                               solarFlare.class === 'C' ? '#eab308' : '#22c55e'
                      }}
                    >
                      {solarFlare.class}{solarFlare.intensity.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(solarFlare.time).toLocaleTimeString()}
                    </div>
                  </>
                ) : (
                  <div className="text-lg font-bold text-green-500">Quiet</div>
                )}
              </div>

              {/* Sunspot Number Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Sunspot Number</div>
                {loadingSunspot ? (
                  <div className="text-lg font-bold text-gray-500">Loading...</div>
                ) : (
                  <>
                    <div
                      className="text-2xl font-bold"
                      style={{
                        color: sunspotNumber !== null ?
                          (sunspotNumber >= 150 ? '#22c55e' :
                           sunspotNumber >= 100 ? '#eab308' : '#ef4444') : '#666'
                      }}
                    >
                      {sunspotNumber !== null ? sunspotNumber : '--'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {sunspotLastUpdated ? sunspotLastUpdated : ''}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CME Alerts Card */}
            {!loadingCme && cmeAlertsList.length > 0 && (
              <div className="bg-gradient-to-br from-[#3d2020] to-[#2a1515] backdrop-blur-lg rounded-2xl p-6 border border-[#5a3030]/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">☄️</span>
                  <span className="text-xl font-bold text-orange-200">CME Alerts</span>
                  <span className="text-xs text-gray-400 ml-2">({cmeAlertsList.length} active)</span>
                </div>

                <div className="space-y-3">
                  {cmeAlertsList.map((cme, index) => {
                    // Use minimum Kp for high priority check (e.g., "5-7" min is 5, "3-5" min is 3)
                    const kpParts = cme.expectedKp.split('-');
                    const minKp = parseInt(kpParts[0]);
                    const isHighPriority = minKp >= 5 || cme.speed >= 700;

                    return (
                      <div
                        key={index}
                        className={`rounded-xl p-4 ${
                          isHighPriority
                            ? 'bg-[#4a2828]/60 border border-orange-500/40'
                            : 'bg-black/20 border border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left side - CME Details */}
                          <div className="flex-1 space-y-2">
                            {/* Type */}
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white">{cme.type}</span>
                            </div>

                            {/* Details - Vertical Layout */}
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="text-gray-500">Detected:</span>
                                <span className="text-gray-300 ml-2">
                                  {(() => {
                                    const date = new Date(cme.detectedAt);
                                    const dateStr = date.toISOString().split('T')[0];
                                    const timeStr = date.toISOString().split('T')[1].substring(0, 5);
                                    return `${dateStr} @ ${timeStr} UT`;
                                  })()}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Speed:</span>
                                <span className="ml-2 font-medium text-gray-200">
                                  {cme.speed} km/s {cme.speed >= 500 ? '🟢' : cme.speed >= 400 ? '🟡' : '🔴'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Expected Kp:</span>
                                <span className="ml-2 font-medium text-gray-200">{cme.expectedKp}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Predicted Arrival + Plan Hunt Button */}
                          <div className="flex flex-col items-end">
                            {isHighPriority && (
                              <span className="text-red-400 text-xs font-bold mb-1">High Priority!</span>
                            )}
                            <div className="text-right mb-2">
                              <div className="text-[10px] text-gray-500 uppercase">Predicted Arrival</div>
                              <div className="text-orange-200 font-semibold">{cme.arrivalDate}</div>
                            </div>
                            {cme.speed >= 400 && (
                              <button
                                onClick={() => {
                                  setActiveTab("aurora-intel");
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                                  isHighPriority
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black'
                                    : 'bg-gradient-to-r from-rose-700 to-orange-700 hover:from-rose-600 hover:to-orange-600 text-white'
                                }`}
                              >
                                Plan Hunt
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500">
                  High Priority: Minimum Kp 5+ expected or speed 700+ km/s
                </div>
              </div>
            )}

            {/* Solar Flare Insights Card */}
            {!loadingFlare && solarFlare && (
              <div className="bg-gradient-to-br from-[#2d2a15] to-[#1f1c10] backdrop-blur-lg rounded-2xl p-6 border border-yellow-900/40">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">⚡</span>
                  <span className="text-xl font-bold text-yellow-200">Solar Flare Activity</span>
                </div>

                {(() => {
                  const flareClass = solarFlare.class;
                  const intensity = solarFlare.intensity;

                  // Determine insight based on flare class
                  let statusColor = "text-gray-400";
                  let statusBg = "bg-gray-500/20 border-gray-500/30";
                  let statusLabel = "Quiet";
                  let insight = "Low solar activity. Aurora unlikely from current conditions.";
                  let action = null;

                  if (flareClass === "X") {
                    statusColor = "text-red-400";
                    statusBg = "bg-red-500/20 border-red-500/30";
                    statusLabel = "High Alert";
                    insight = "X-class flares often produce Earth-directed CMEs. Watch for CME announcement in the next few hours.";
                    action = "Watch CME Alerts";
                  } else if (flareClass === "M") {
                    statusColor = "text-orange-400";
                    statusBg = "bg-orange-500/20 border-orange-500/30";
                    statusLabel = "Elevated";
                    insight = intensity >= 5
                      ? "Strong M-class flare may produce a CME. Monitor for potential CME activity."
                      : "Moderate activity. M-class flares can occasionally produce CMEs.";
                    action = intensity >= 5 ? "Monitor CME Alerts" : null;
                  } else if (flareClass === "C") {
                    statusColor = "text-yellow-400";
                    statusBg = "bg-yellow-500/20 border-yellow-500/30";
                    statusLabel = "Normal";
                    insight = "Background solar activity. C-class flares rarely produce significant CMEs.";
                  } else {
                    statusLabel = "Quiet";
                    insight = "Low solar activity. Aurora depends on existing CMEs or coronal hole streams.";
                  }

                  return (
                    <div className={`rounded-xl p-4 border ${statusBg}`}>
                      <div className="flex items-start justify-between gap-4">
                        {/* Left side - Flare Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`text-4xl font-bold ${
                              flareClass === "X" ? "text-red-400" :
                              flareClass === "M" ? "text-orange-400" :
                              flareClass === "C" ? "text-yellow-400" :
                              "text-gray-400"
                            }`}>
                              {flareClass}{intensity.toFixed(1)}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${statusColor} ${statusBg}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <p className="text-sm text-gray-300 mb-3">{insight}</p>

                          <div className="text-xs text-gray-500">
                            Last updated: {new Date(solarFlare.time).toLocaleString()}
                          </div>
                        </div>

                        {/* Right side - Action hint */}
                        {action && (
                          <div className="flex flex-col items-end">
                            <div className={`text-xs font-semibold ${statusColor} mb-1`}>
                              {action}
                            </div>
                            <span className="text-2xl">👀</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500">
                  Solar flares can trigger CMEs. X-class + Earth-facing = potential aurora in 2-3 days.
                </div>
              </div>
            )}

            {/* High Speed Stream Prediction Card */}
            {!loadingHss && hssPrediction && (
              <div className="bg-gradient-to-br from-[#1a2035] to-[#151a2e] backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🌀</span>
                  <span className="text-xl font-bold text-purple-200">High Speed Stream Prediction</span>
                </div>

                {/* Main Prediction Card */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 mb-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    {/* Left - Date Window */}
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Aurora Window</div>
                      <div className="text-2xl font-bold text-white">{hssPrediction.dateRange}</div>
                      <div className="text-sm text-purple-300 mt-1">Peak: {hssPrediction.peakDate}</div>
                    </div>
                    {/* Right - Expected Kp */}
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Expected</div>
                      <div className="text-2xl font-bold text-green-400">Kp {hssPrediction.expectedKp}</div>
                      <div className="text-xs text-gray-400 mt-1">Moderate Storm</div>
                    </div>
                  </div>

                  {/* Why This is Great */}
                  <div className="bg-black/20 rounded-lg p-3 mb-4">
                    <div className="text-xs font-semibold text-purple-300 mb-2">Why HSS is Perfect for Trip Planning:</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-purple-500/10 rounded-lg p-2">
                        <div className="text-lg">📅</div>
                        <div className="text-[10px] text-gray-300">27-Day Cycle</div>
                        <div className="text-[9px] text-gray-500">Predictable</div>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-2">
                        <div className="text-lg">🕐</div>
                        <div className="text-[10px] text-gray-300">2-5 Day Window</div>
                        <div className="text-[9px] text-gray-500">Flexible</div>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-2">
                        <div className="text-lg">✈️</div>
                        <div className="text-[10px] text-gray-300">Book Ahead</div>
                        <div className="text-[9px] text-gray-500">Plan Now!</div>
                      </div>
                    </div>
                  </div>

                  {/* 27-Day Reference */}
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span>🔄</span>
                    <span>Previous HSS: {hssPrediction.previousHssDate} → Coronal holes recur every ~27 days</span>
                  </div>
                </div>

                {/* Recommended Destinations */}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-white mb-2">🎯 Best Destinations for Kp {hssPrediction.expectedKp}</div>
                  <div className="text-xs text-gray-400 mb-3">
                    Kp 4-6 is visible from 60-65°N latitude. Recommended locations:
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {["Tromsø, Norway", "Reykjavik, Iceland", "Rovaniemi, Finland", "Abisko, Sweden", "Fairbanks, Alaska"].map((dest) => (
                      <span key={dest} className="text-xs bg-purple-500/20 text-purple-200 px-2 py-1 rounded-full">
                        {dest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trip Planning CTAs */}
                <div className="space-y-3">
                  {/* Flights */}
                  <div>
                    <div className="text-sm font-semibold text-white mb-2">✈️ Find Flights</div>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href="https://www.trip.com/t/YzYLsf5i7S2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-lg transition-all text-center"
                      >
                        Trip.com
                      </a>
                      <a
                        href="https://www.skyscanner.com/flights"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white text-xs font-bold rounded-lg transition-all text-center"
                      >
                        Skyscanner
                      </a>
                      <a
                        href="https://www.agoda.com/flights"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold rounded-lg transition-all text-center"
                      >
                        Agoda
                      </a>
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div>
                    <div className="text-sm font-semibold text-white mb-2">🏨 Book Accommodation</div>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href="https://www.trip.com/t/xqQysf5i7S5"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-lg transition-all text-center"
                      >
                        Trip.com
                      </a>
                      <a
                        href="https://www.agoda.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold rounded-lg transition-all text-center"
                      >
                        Agoda
                      </a>
                      <a
                        href="https://www.expedia.com/Hotels"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-black text-xs font-bold rounded-lg transition-all text-center"
                      >
                        Expedia
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500">
                  HSS from coronal holes provide predictable, multi-day aurora windows - perfect for trip planning!
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Addict's Intel Tab - Gate System */}
      {activeTab === "expert" && (
        <div className="max-w-screen-lg mx-auto p-4">
          <div className="space-y-6">
            {/* Aurora Intelligence - Real-time Decision System */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-white">🚀 Aurora Intelligence Advisor</h2>
              </div>

              {/* Tab Navigation Cards - 3 Column Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Aurora Forecast - Links to Cosmic Tab */}
                <button
                  onClick={() => setActiveTab("cosmic")}
                  className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl p-4 border border-purple-500/30 hover:scale-[1.02] hover:border-purple-400/50 transition-all"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-5xl">🌠</span>
                    <h3 className="text-sm font-bold text-white">Aurora Forecast</h3>
                  </div>
                </button>

                {/* Aurora Now - Links to Aurora Tab */}
                <button
                  onClick={() => setActiveTab("aurora-intel")}
                  className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-xl p-4 border border-emerald-500/30 hover:scale-[1.02] hover:border-emerald-400/50 transition-all"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-5xl">🌍</span>
                    <h3 className="text-sm font-bold text-white">Aurora Now</h3>
                  </div>
                </button>

                {/* Cloud Intel - Links to Cloud Tab */}
                <button
                  onClick={() => setActiveTab("cloud")}
                  className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-xl p-4 border border-blue-500/30 hover:scale-[1.02] hover:border-blue-400/50 transition-all"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-5xl">☁️</span>
                    <h3 className="text-sm font-bold text-white">Cloud Intel</h3>
                  </div>
                </button>
              </div>

              {/* External Links - 3 Column Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Solar Data */}
                <a
                  href="https://www.solarham.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-slate-800/40 to-gray-800/40 rounded-xl p-4 border border-slate-600/30 hover:scale-[1.02] transition-transform"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-5xl">☀️</span>
                    <h3 className="text-sm font-bold text-white">Solar Data</h3>
                  </div>
                </a>

                {/* Light Data */}
                <a
                  href="https://lightpollutionmap.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-slate-800/40 to-gray-800/40 rounded-xl p-4 border border-slate-600/30 hover:scale-[1.02] transition-transform"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-5xl">🗺️</span>
                    <h3 className="text-sm font-bold text-white">Light Data</h3>
                  </div>
                </a>

                {/* Cloud Data */}
                <a
                  href="https://zoom.earth/maps/satellite/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-slate-800/40 to-gray-800/40 rounded-xl p-4 border border-slate-600/30 hover:scale-[1.02] transition-transform"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-5xl">🛰️</span>
                    <h3 className="text-sm font-bold text-white">Cloud Data</h3>
                  </div>
                </a>
              </div>

              {/* Three Gates - Vertical Stack */}
              <div className="space-y-4">
                {/* Gate 1: Can Aurora Happen? */}
                <div
                  className="bg-gradient-to-br from-purple-900/60 to-indigo-900/60 rounded-xl p-5 border-2 border-purple-500/40"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🌌</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">Is there Aurora?</h3>
                    </div>
                  </div>

                  {/* Gate 1 Verdict - Energy Loading System */}
                  {(() => {
                    const kp = parseFloat(currentKp);
                    const bz = currentBz || 0;
                    const speed = solarWindSpeed || 0;
                    const density = solarWindDensity || 0;

                    // Calculate comprehensive verdict using physics-based system
                    const verdict: AuroraVerdict = calculateAuroraVerdict(
                      kp,
                      bz,
                      currentBt || 0,
                      speed,
                      density
                    );

                    // Get colors based on verdict category
                    const verdictColors = getVerdictColor(verdict.verdictEmoji);

                    const gate1Color = `${verdictColors.bg} ${verdictColors.border}`;
                    const gate1TextColor = verdictColors.text;

                    return (
                      <>
                        {/* Verdict at the top */}
                        <div className={`${gate1Color} border-2 rounded-lg p-4 text-center mb-3 min-h-[140px] flex flex-col items-center justify-center`}>
                          {/* Main Verdict */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-3xl">{verdict.strengthEmoji}</span>
                            <div className={`text-2xl font-bold ${gate1TextColor} leading-tight`}>
                              {verdict.strengthCategory}
                            </div>
                          </div>

                          {/* Intensity Score */}
                          <div className="text-sm text-white/90 font-medium mb-1">
                            Intensity: {verdict.intensityScore.toFixed(0)}/100 • {verdict.likelihood}
                          </div>

                          {/* Visibility Range */}
                          <div className="text-xs text-white/80 mb-2 max-w-md">
                            {verdict.visibilityRange}
                          </div>

                          {/* Example Cities */}
                          {verdict.exampleCities && verdict.exampleCities.length > 0 && (
                            <div className="text-xs text-green-300/80 mb-1">
                              Visible from: {verdict.exampleCities.map(city => {
                                // Country to flag mapping
                                const countryFlags: Record<string, string> = {
                                  "Norway": "🇳🇴",
                                  "Iceland": "🇮🇸",
                                  "Alaska": "🇺🇸",
                                  "Canada": "🇨🇦",
                                  "Sweden": "🇸🇪",
                                  "Finland": "🇫🇮",
                                  "Russia": "🇷🇺",
                                  "UK": "🇬🇧",
                                  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
                                  "USA": "🇺🇸",
                                  "China": "🇨🇳",
                                };
                                // Parse "City, Country" format
                                const parts = city.split(", ");
                                const cityName = parts[0];
                                const country = parts[1] || "";
                                const flag = countryFlags[country] || "🌍";
                                return `${flag} ${cityName}`;
                              }).join(", ")}
                            </div>
                          )}

                          {/* Alert Level */}
                          <div className={`text-xs ${gate1TextColor} uppercase tracking-wide font-bold`}>
                            {verdict.alertLevel}
                          </div>
                        </div>

                        {/* Viewing Tip */}
                        <div className="bg-black/30 rounded-lg p-3 mb-3 border border-white/10">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">💡</span>
                            <div className="flex-1">
                              <div className="text-xs text-gray-400 uppercase mb-1">Viewing Tip</div>
                              <div className="text-sm text-white font-medium">{verdict.viewingTip}</div>
                            </div>
                          </div>
                        </div>

                        {/* Aurora Characteristics - Only show when there's activity */}
                        {verdict.intensityScore > 10 && verdict.auroraType && (
                          <div className="bg-purple-500/10 rounded-lg p-3 mb-3 border border-purple-500/30">
                            <div>
                              <div className="text-xs text-gray-400 uppercase mb-2">Expected Aurora Characteristics</div>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    <span className="text-gray-400">Type:</span>
                                    <span className="text-white ml-2">{verdict.auroraType}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Duration:</span>
                                    <span className="text-white ml-2">{verdict.durationHours}h</span>
                                  </div>
                                  {verdict.auroraColors && (
                                    <div>
                                      <span className="text-gray-400">Colors:</span>
                                      <span className="text-white ml-2">{verdict.auroraColors}</span>
                                    </div>
                                  )}
                                  {verdict.auroraStructure && (
                                    <div>
                                      <span className="text-gray-400">Structure:</span>
                                      <span className="text-white ml-2">{verdict.auroraStructure}</span>
                                    </div>
                                  )}
                                </div>
                            </div>
                          </div>
                        )}

                        {/* Physics Validation */}
                        {verdict.physicsFlag !== "✅ PHYSICALLY VALID" && (
                          <div className={`rounded-lg p-3 mb-3 border ${
                            verdict.physicsFlag.includes("IMPOSSIBLE") ? "bg-red-500/10 border-red-500/30" :
                            verdict.physicsFlag.includes("UNLIKELY") ? "bg-orange-500/10 border-orange-500/30" :
                            "bg-yellow-500/10 border-yellow-500/30"
                          }`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg">{verdict.physicsFlag.split(" ")[0]}</span>
                              <div className="flex-1">
                                <div className="text-xs font-bold text-white uppercase mb-1">
                                  {verdict.physicsFlag.substring(2)}
                                </div>
                                <div className="text-xs text-white/80">{verdict.physicsNotes}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Encouragement tip - REMOVED FOR NOW, LOGIC KEPT FOR LATER */}
                        {/* {encouragementTip && (
                          <div className="text-xs text-gray-400 italic mb-4 text-center">
                            {encouragementTip}
                          </div>
                        )} */}

                        {/* Data metrics below */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">KP Index</span>
                            <span className="text-sm font-bold" style={{ color: getKpColor(kp) }}>{kp.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Bz Component</span>
                            <span className="text-sm font-bold" style={{ color: getBzColor(bz) }}>{bz.toFixed(1)} nT</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Bt (Total Field)</span>
                            <span className="text-sm font-bold" style={{ color: getBtColor(currentBt || 0) }}>{currentBt?.toFixed(1) || "0.0"} nT</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Wind Speed</span>
                            <span className="text-sm font-bold" style={{ color: getWindSpeedColor(speed) }}>{speed.toFixed(0)} km/s</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Density</span>
                            <span className="text-sm font-bold" style={{ color: getDensityColor(density) }}>{density.toFixed(1)} p/cm³</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Hemisphere Power</span>
                            {hemispherePower ? (
                              <span className="text-sm font-bold" style={{ color: getHemispherePowerColor(hemispherePower.north) }}>
                                {hemispherePower.north} GW
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">Loading...</span>
                            )}
                          </div>

                          {/* Kp Lag Warning */}
                          {kpLagWarning && kpLagWarning.isLagging && (
                            <div className="pt-2 border-t border-white/10">
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                <p className="text-xs text-yellow-200 leading-relaxed">
                                  {kpLagWarning.message}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Bz History Chart */}
                          <div className="pt-2 border-t border-white/10 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400">Bz History (90min)</span>
                              {bzHistory && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span className="text-green-400">{bzHistory.minutesSouth}min south</span>
                                  <span>Min: {bzHistory.minBz.toFixed(1)} nT</span>
                                </div>
                              )}
                            </div>
                            {bzHistory && bzHistory.readings.length > 0 && (
                              <div className="relative h-16 bg-black/30 rounded-lg overflow-hidden">
                                {/* Center line (Bz = 0) */}
                                <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-600" />
                                {/* Labels */}
                                <div className="absolute left-1 top-1 text-[10px] text-red-400/60">+North</div>
                                <div className="absolute left-1 bottom-1 text-[10px] text-green-400/60">−South</div>
                                {/* Dots */}
                                <svg className="w-full h-full" preserveAspectRatio="none">
                                  {bzHistory.readings.map((bz, i) => {
                                    const x = (i / (bzHistory.readings.length - 1)) * 100;
                                    // Scale: -20 to +20 nT range, clamped
                                    const clampedBz = Math.max(-20, Math.min(20, bz));
                                    // y: 50% is center, negative goes down (good), positive goes up (bad)
                                    const y = 50 - (clampedBz / 20) * 45;
                                    const color = bz >= 0 ? '#ef4444' : bz > -4 ? '#eab308' : '#22c55e';
                                    return (
                                      <circle
                                        key={i}
                                        cx={`${x}%`}
                                        cy={`${y}%`}
                                        r="2"
                                        fill={color}
                                        opacity={0.8}
                                      />
                                    );
                                  })}
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Bz Trend */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Bz Trend</span>
                            {bzHistory ? (
                              <span className={`text-sm font-bold capitalize ${
                                // Positive Bz = no aurora, always red
                                bz >= 0 ? 'text-red-400' :
                                // Negative & strengthening (more negative) = great
                                bzHistory.bzTrend === 'strengthening' ? 'text-green-400' :
                                // Negative & stable = still good
                                bzHistory.bzTrend === 'stable' ? 'text-green-400' :
                                // Negative but weakening (toward 0) = fading
                                'text-yellow-400'
                              }`}>
                                {bz >= 0 ? 'positive' : bzHistory.bzTrend}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">Loading...</span>
                            )}
                          </div>

                          {/* Substorm Phase & Energy Loading */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400">Substorm Phase</span>
                              <div className="flex items-center gap-2">
                                {!loadingGoesData ? (
                                  <>
                                    <span className={`text-sm font-bold uppercase ${
                                      energyState.substormPhase === 'expansion' ? 'text-red-400' :
                                      energyState.substormPhase === 'growth' ? 'text-yellow-400' :
                                      energyState.substormPhase === 'recovery' ? 'text-blue-400' :
                                      'text-gray-400'
                                    }`}>
                                      {energyState.substormPhase}
                                    </span>
                                    <span className="text-base">
                                      {energyState.substormPhase === 'expansion' ? '💥' :
                                       energyState.substormPhase === 'growth' ? '🌀' :
                                       energyState.substormPhase === 'recovery' ? '📉' : '😴'}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-500">Loading...</span>
                                )}
                              </div>
                            </div>
                            {!loadingGoesData && energyState.substormPhase !== 'quiet' && (
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between items-center text-gray-400">
                                  <span>Energy Loading</span>
                                  <span className="font-bold text-white">{energyState.loadingLevel.toFixed(0)}%</span>
                                </div>
                                {energyState.timeToOnset !== null && energyState.timeToOnset > 0 && (
                                  <div className="flex justify-between items-center text-gray-400">
                                    <span>Time to Onset</span>
                                    <span className="font-bold text-yellow-300">~{energyState.timeToOnset} min</span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center text-gray-400">
                                  <span>Confidence</span>
                                  <span className={`font-bold ${
                                    energyState.confidence === 'high' ? 'text-green-400' :
                                    energyState.confidence === 'medium' ? 'text-yellow-400' :
                                    'text-gray-300'
                                  }`}>
                                    {energyState.confidence.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* What's Coming - 30-60 min Forecast */}
                          <div className="pt-2 border-t border-white/10 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400">What&apos;s Coming</span>
                              <span className="text-xs text-gray-500">in ~{speed > 0 ? Math.round(1500000 / speed / 60) : '--'} min</span>
                            </div>
                            {(() => {
                              const transitMin = speed > 0 ? Math.round(1500000 / speed / 60) : 45;
                              const arrivalTime = new Date(Date.now() + transitMin * 60 * 1000);
                              const timeStr = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                              // Determine forecast based on current L1 readings
                              if (currentBz !== null && currentBz <= -5 && bzHistory?.bzTrend === 'strengthening') {
                                return (
                                  <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3">
                                    <div className="text-sm font-bold text-green-300 mb-1">🟢 Aurora likely improving</div>
                                    <p className="text-xs text-green-200">
                                      Strong southward Bz ({currentBz?.toFixed(1)} nT) heading to Earth.
                                      <span className="block mt-1 font-semibold">→ Be ready by {timeStr}</span>
                                    </p>
                                  </div>
                                );
                              } else if (currentBz !== null && currentBz <= -3) {
                                return (
                                  <div className="bg-green-500/15 border border-green-500/30 rounded-lg p-3">
                                    <div className="text-sm font-bold text-green-300 mb-1">🟢 Good conditions incoming</div>
                                    <p className="text-xs text-green-200">
                                      Southward Bz ({currentBz?.toFixed(1)} nT) will reach Earth soon.
                                      <span className="block mt-1 font-semibold">→ Check again at {timeStr}</span>
                                    </p>
                                  </div>
                                );
                              } else if (currentBz !== null && currentBz >= 0 && bzHistory?.bzTrend === 'weakening') {
                                return (
                                  <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3">
                                    <div className="text-sm font-bold text-yellow-300 mb-1">🟡 Conditions fading</div>
                                    <p className="text-xs text-yellow-200">
                                      Bz turning north at L1 — aurora may weaken.
                                      <span className="block mt-1 font-semibold">→ Go out NOW if skies are clear</span>
                                    </p>
                                  </div>
                                );
                              } else if (currentBz !== null && currentBz >= 2) {
                                return (
                                  <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3">
                                    <div className="text-sm font-bold text-red-300 mb-1">🔴 Quiet conditions ahead</div>
                                    <p className="text-xs text-red-200">
                                      Northward Bz (+{currentBz?.toFixed(1)} nT) — not favorable for aurora.
                                      <span className="block mt-1 font-semibold">→ Check back later or monitor CME alerts</span>
                                    </p>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="bg-gray-500/15 border border-gray-500/30 rounded-lg p-3">
                                    <div className="text-sm font-bold text-gray-300 mb-1">⚪ Uncertain conditions</div>
                                    <p className="text-xs text-gray-300">
                                      Bz near zero ({currentBz?.toFixed(1)} nT) — could go either way.
                                      <span className="block mt-1 font-semibold">→ Monitor Bz trend for changes</span>
                                    </p>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>

                      </>
                    );
                  })()}
                </div>

                {/* Gate 2: Can I See It? */}
                <div
                  className="bg-gradient-to-br from-blue-900/60 to-cyan-900/60 rounded-xl p-5 border-2 border-blue-500/40"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">👁️</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">Can I See It?</h3>
                    </div>
                  </div>

                  {/* Gate 2 Verdict */}
                  {(() => {
                    const illumination = moonPhase?.illumination || 0;

                    // CLOUD FORECAST ANALYSIS FUNCTION
                    const analyzeCloudTrend = () => {
                      if (!cloudForecast || cloudForecast.cloudCover.length < 6) {
                        return { trend: 'unknown', clearTime: null, message: '' };
                      }

                      const current = cloudForecast.cloudCover[0];
                      const in2hrs = cloudForecast.cloudCover[2];
                      const in4hrs = cloudForecast.cloudCover[4];
                      const in6hrs = cloudForecast.cloudCover[6];
                      const in8hrs = cloudForecast.cloudCover.length > 8 ? cloudForecast.cloudCover[8] : null;

                      // Calculate average change rate (clouds/hour)
                      const changeRate2hrs = (in2hrs - current) / 2;
                      const changeRate4hrs = (in4hrs - current) / 4;

                      // Check for precipitation (blocks aurora even if clouds thin)
                      const hasPrecipitation = cloudForecast.precipitation.slice(0, 8).some(p => p > 50);

                      // Wind analysis - strong winds can help clear clouds
                      const avgWindSpeed = cloudForecast.windSpeed.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
                      const windFactor = avgWindSpeed > 20 ? 1.2 : avgWindSpeed > 15 ? 1.1 : 1.0; // Wind helps clearing

                      // Humidity analysis - high humidity = clouds persist
                      const avgHumidity = cloudForecast.humidity.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
                      const humidityFactor = avgHumidity > 85 ? 0.8 : avgHumidity < 60 ? 1.2 : 1.0;

                      // Combined environmental factor
                      const environmentFactor = windFactor * humidityFactor;

                      // Find when clouds drop below 30% (good viewing threshold)
                      let clearTime = null;
                      for (let i = 0; i < Math.min(cloudForecast.cloudCover.length, 12); i++) {
                        if (cloudForecast.cloudCover[i] < 30) {
                          const clearDate = new Date(cloudForecast.time[i]);
                          clearTime = {
                            hours: i,
                            time: clearDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                          };
                          break;
                        }
                      }

                      // TREND CLASSIFICATION

                      // 1. Clearing Soon (Most Encouraging!)
                      if (current > 70 && in4hrs < 40 && changeRate4hrs < -5 && environmentFactor > 1.0) {
                        return {
                          trend: 'clearing_soon',
                          clearTime,
                          message: `☁️→🌙 Clouds clearing rapidly! ${clearTime ? `Clear skies expected by ${clearTime.time}` : 'Improving trend!'} ${avgWindSpeed > 20 ? 'Strong winds helping!' : ''}`,
                          urgency: 'wait',
                          affectsVerdict: true,
                          verdictBoost: 20 // Boost score because hope is on horizon
                        };
                      }

                      // 2. Gradual Improvement
                      if (changeRate4hrs < -3 && current > 50) {
                        return {
                          trend: 'improving',
                          clearTime,
                          message: `🌤️ Clouds gradually clearing. ${clearTime ? `Better viewing by ${clearTime.time}` : 'Trend improving over next 4-6 hours'}`,
                          urgency: 'monitor',
                          affectsVerdict: true,
                          verdictBoost: 10
                        };
                      }

                      // 3. Worsening (Go NOW!)
                      if (current < 40 && in4hrs > 70 && changeRate4hrs > 5) {
                        return {
                          trend: 'worsening',
                          clearTime: null,
                          message: `⚠️ WINDOW CLOSING! Clouds are moving in rapidly. Current conditions are good but won't last!`,
                          urgency: 'go_now',
                          affectsVerdict: true,
                          verdictBoost: 0
                        };
                      }

                      // 4. Stable Clear (Perfect!)
                      if (current < 30 && in6hrs < 40 && Math.max(...cloudForecast.cloudCover.slice(0, 8)) < 50) {
                        return {
                          trend: 'stable_clear',
                          clearTime: { hours: 0, time: 'NOW' },
                          message: `🌙 Clear skies now and staying clear! Perfect viewing window.`,
                          urgency: 'go',
                          affectsVerdict: false,
                          verdictBoost: 0
                        };
                      }

                      // 5. Stable Cloudy (No Hope)
                      if (current > 80 && Math.min(...cloudForecast.cloudCover.slice(0, 8)) > 70) {
                        return {
                          trend: 'stable_cloudy',
                          clearTime: null,
                          message: `❌ Heavy clouds persistent all night (${Math.round(Math.min(...cloudForecast.cloudCover.slice(0, 8)))}%-${Math.round(Math.max(...cloudForecast.cloudCover.slice(0, 8)))}%). ${hasPrecipitation ? 'Rain/snow likely.' : ''} Try again tomorrow.`,
                          urgency: 'stay_home',
                          affectsVerdict: false,
                          verdictBoost: 0
                        };
                      }

                      // 6. Variable/Unpredictable
                      const variance = Math.max(...cloudForecast.cloudCover.slice(0, 8)) - Math.min(...cloudForecast.cloudCover.slice(0, 8));
                      if (variance > 40) {
                        return {
                          trend: 'variable',
                          clearTime,
                          message: `🌦️ Variable conditions (${Math.round(Math.min(...cloudForecast.cloudCover.slice(0, 8)))}%-${Math.round(Math.max(...cloudForecast.cloudCover.slice(0, 8)))}% clouds). ${clearTime ? `Best window around ${clearTime.time}` : 'Monitor for gaps'}`,
                          urgency: 'monitor',
                          affectsVerdict: false,
                          verdictBoost: 0
                        };
                      }

                      // 7. Minor Changes
                      return {
                        trend: 'stable',
                        clearTime: current < 50 ? { hours: 0, time: 'NOW' } : clearTime,
                        message: '',
                        urgency: 'normal',
                        affectsVerdict: false,
                        verdictBoost: 0
                      };
                    };

                    const cloudTrendAnalysis = analyzeCloudTrend();

                    // Hybrid Scoring System for Gate 2
                    // Step 1: Calculate base score from contributory factors (additive)
                    let gate2BaseScore = 0;

                    // Moon phase scoring (contributory factor)
                    if (illumination <= 25) gate2BaseScore += 30; // New moon - excellent
                    else if (illumination <= 50) gate2BaseScore += 20; // Quarter moon - good
                    else if (illumination <= 75) gate2BaseScore += 10; // Gibbous - fair
                    else gate2BaseScore += 0; // Full moon - poor

                    // Light pollution scoring (contributory factor)
                    if (bortleClass !== null) {
                      if (bortleClass <= 3) gate2BaseScore += 40; // Excellent dark site
                      else if (bortleClass <= 5) gate2BaseScore += 25; // Good site
                      else if (bortleClass <= 7) gate2BaseScore += 10; // Fair site
                      else gate2BaseScore += 0; // Poor site
                    } else {
                      gate2BaseScore += 15; // Assume moderate conditions if no data
                    }

                    // Apply cloud forecast verdict boost (encouragement for clearing trends)
                    gate2BaseScore += cloudTrendAnalysis.verdictBoost || 0;

                    // Step 2: Calculate critical multipliers (blocking factors)
                    let cloudMultiplier = 1.0;
                    let darknessMultiplier = 1.0;
                    let isBlocked = false;
                    let blockReason = "";

                    // Cloud cover multiplier (critical blocking factor)
                    if (cloudCover !== null) {
                      if (cloudCover >= 95) {
                        cloudMultiplier = 0.0; // Complete block - cannot see through clouds
                        isBlocked = true;
                        blockReason = "Cannot see aurora through clouds";
                      } else if (cloudCover >= 85) {
                        cloudMultiplier = 0.2; // Severe penalty
                      } else if (cloudCover >= 70) {
                        cloudMultiplier = 0.5; // Major penalty
                      } else if (cloudCover >= 50) {
                        cloudMultiplier = 0.8; // Moderate penalty
                      } else {
                        cloudMultiplier = 1.0; // No penalty
                      }
                    } else {
                      gate2BaseScore += 15; // Assume moderate cloud conditions if no data
                    }

                    // Daylight multiplier (critical blocking factor)
                    if (daylightStatus !== null) {
                      if (daylightStatus === "Day") {
                        darknessMultiplier = 0.0; // Complete block - aurora invisible in daylight
                        isBlocked = true;
                        blockReason = "Aurora invisible in daylight";
                      } else if (daylightStatus === "Twilight") {
                        darknessMultiplier = 0.5; // Partial penalty - aurora very faint during twilight
                      } else {
                        darknessMultiplier = 1.0; // Night - no penalty
                      }
                    } else {
                      gate2BaseScore += 10; // Assume reasonable timing if no data
                    }

                    // Step 3: Apply multipliers to get final Gate 2 score
                    let gate2Score = gate2BaseScore * cloudMultiplier * darknessMultiplier;

                    // Step 4: Hierarchical Verdict Logic (Priority-based)
                    let gate2Verdict = "POOR";
                    let gate2Message = "";
                    // Check if any nearby location has significantly better conditions (clear or 20%+ improvement)
                    const hasClearSkiesNearby = locationRecommendations.length > 0 &&
                      locationRecommendations.some((rec: any) => rec.cloudCoverAtArrival < 40 || (rec.improvement && rec.improvement >= 20));

                    // Get latitude visibility for priority check
                    const kp = parseFloat(currentKp);
                    const huntLat = huntLocationCoords?.lat || 0;
                    const latitudeCheck = canSeeAuroraAtLatitude(huntLat, kp);

                    // PRIORITY 1: Latitude Check - If aurora is impossible at this latitude, nothing else matters
                    if (huntLocationCoords && latitudeCheck.minKpRequired === null) {
                      gate2Verdict = "YOU'RE TOO FAR FROM THE POLES!";
                      gate2Message = "Aurora impossible at your latitude. Travel to 50°+ latitude (Norway, Iceland, Alaska, Canada).";
                    }
                    // PRIORITY 1B: Latitude too low for current Kp
                    else if (huntLocationCoords && !latitudeCheck.canSee) {
                      const minKp = latitudeCheck.minKpRequired;
                      if (minKp !== null) {
                        // Check if we're in northern or southern hemisphere
                        const isNorthernHemisphere = huntLat >= 0;
                        gate2Verdict = isNorthernHemisphere
                          ? `GO NORTH, OR YOU NEED AT LEAST KP ${minKp}!`
                          : `GO SOUTH, OR YOU NEED AT LEAST KP ${minKp}!`;
                        gate2Message = `Need Kp ${minKp}+ for aurora at your latitude. ${minKp >= 7 ? 'Wait for major geomagnetic storm.' : 'Monitor Kp index for higher activity.'}`;
                      }
                    }
                    // PRIORITY 2: Daylight - If it's daytime, cloud cover doesn't matter
                    else if (daylightStatus === "Day") {
                      gate2Verdict = "IT'S DAYTIME! WAIT FOR THE SUN TO SET!";
                      gate2Message = "Aurora invisible in daylight. Return after sunset.";
                    }
                    // PRIORITY 3: Heavy clouds (95%+) - Complete obstruction
                    else if (cloudCover !== null && cloudCover >= 95) {
                      if (hasClearSkiesNearby) {
                        const nearest = locationRecommendations[0];
                        gate2Verdict = "POSSIBLY, IF YOU DRIVE TO CLEAR SKIES!";
                        gate2Message = `Cannot see through ${cloudCover}% clouds. Drive ${nearest.distance.toFixed(0)}km ${nearest.direction} for clear skies!`;
                      } else if (cloudTrendAnalysis.urgency === 'wait' && cloudTrendAnalysis.clearTime) {
                        gate2Verdict = "POSSIBLY, IF YOU WAIT FOR CLOUDS TO CLEAR!";
                        gate2Message = `Cannot see through ${cloudCover}% clouds now. Clearing by ${cloudTrendAnalysis.clearTime.time} - wait for it!`;
                      } else {
                        gate2Verdict = "IT'S TOO CLOUDY TO SEE THE SKIES!";
                        gate2Message = `Cannot see through ${cloudCover}% clouds. ${cloudTrendAnalysis.message || 'Check forecast for clearing.'}`;
                      }
                    }
                    // PRIORITY 4: Twilight - Partial visibility issue
                    else if (daylightStatus === "Twilight") {
                      gate2Verdict = "POSSIBLY, IF YOU WAIT FOR DARKNESS!";
                      gate2Message = "Aurora very faint in twilight. Best viewing after full darkness.";
                    }
                    // PRIORITY 5: Moderate to heavy clouds (70-94%)
                    else if (cloudCover !== null && cloudCover >= 70) {
                      if (cloudTrendAnalysis.urgency === 'wait' && cloudTrendAnalysis.clearTime) {
                        gate2Verdict = "POSSIBLY, IF YOU WAIT FOR CLOUDS TO CLEAR!";
                        gate2Message = `Heavy clouds (${cloudCover}%) now, clearing by ${cloudTrendAnalysis.clearTime.time}. Wait for the gap!`;
                      } else if (hasClearSkiesNearby) {
                        gate2Verdict = "POSSIBLY, IF YOU DRIVE TO CLEAR SKIES!";
                        gate2Message = `Heavy clouds (${cloudCover}%). Consider driving to clearer area.`;
                      } else {
                        gate2Verdict = "IT'S TOO CLOUDY TO SEE THE SKIES!";
                        gate2Message = `Heavy clouds (${cloudCover}%). ${cloudTrendAnalysis.message || 'Monitor for gaps.'}`;
                      }
                    }
                    // PRIORITY 6: Moderate clouds (50-69%)
                    else if (cloudCover !== null && cloudCover >= 50) {
                      gate2Verdict = "POSSIBLY, IF YOU'RE LUCKY WITH CLOUD GAPS!";
                      gate2Message = `Partly cloudy (${cloudCover}%). Aurora may peek through gaps. Watch for breaks!`;
                    }
                    // PRIORITY 7: Light clouds (30-49%) - Clouds are still the limiting factor
                    else if (cloudCover !== null && cloudCover >= 30) {
                      gate2Verdict = "POSSIBLY, IF YOU'RE LUCKY WITH CLOUD GAPS!";
                      gate2Message = `Light clouds (${cloudCover}%). Aurora may be visible through gaps. Watch the sky!`;
                    }
                    // PRIORITY 8: Clear skies (<30%) - Check Bortle class for optimization
                    else {
                      if (bortleClass !== null && bortleClass >= 7) {
                        gate2Verdict = "POSSIBLY, IF YOU DRIVE TO DARKER AREA!";
                        gate2Message = `Clear skies but high light pollution (Bortle ${bortleClass}). Aurora visible but faint. Drive to Bortle 1-4 area for stunning views!`;
                      } else if (bortleClass !== null && bortleClass >= 5) {
                        gate2Verdict = "DEFINITELY, IF THERE'S AURORA!";
                        gate2Message = `Clear skies, moderate darkness (Bortle ${bortleClass}). Good viewing! For best experience, seek Bortle 1-3 areas.`;
                      } else {
                        gate2Verdict = "DEFINITELY, IF THERE'S AURORA!";
                        gate2Message = `Excellent conditions! Clear skies + dark location (Bortle ${bortleClass || '1-3'}). Perfect for aurora viewing!`;
                      }
                    }

                    const gate2Color = gate2Verdict.startsWith("DEFINITELY") ? "bg-[#1a4d2e] border-green-500" :
                                      gate2Verdict.startsWith("POSSIBLY") ? "bg-[#4d3a1a] border-yellow-500" :
                                      "bg-[#4d1a1a] border-red-700";
                    const gate2TextColor = gate2Verdict.startsWith("DEFINITELY") ? "text-green-300" :
                                          gate2Verdict.startsWith("POSSIBLY") ? "text-yellow-300" :
                                          "text-red-300";

                    return (
                      <>
                        {/* Verdict at the top */}
                        <div className={`${!huntLocationCoords ? 'bg-gray-700/50' : gate2Color} border-2 rounded-lg p-4 text-center mb-3 h-[100px] flex items-center justify-center`}>
                          {!huntLocationCoords ? (
                            <div className="text-sm text-gray-300 italic leading-tight">
                              Enter your current location for viewing conditions
                            </div>
                          ) : (
                            <div className={`text-xl font-bold ${gate2TextColor} leading-tight px-2`}>
                              {gate2Verdict}
                            </div>
                          )}
                        </div>

                        {/* Explanation - REMOVED FOR NOW, LOGIC KEPT FOR LATER */}
                        {/* {huntLocationCoords && (
                          <div className="text-xs text-gray-300 mb-4 text-center">
                            {gate2Message}
                          </div>
                        )} */}

                        {/* Hunt Location Input */}
                        <div
                          className="mb-4 pb-4 border-b border-white/20 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-lg rounded-2xl p-4 border-2 border-blue-500/30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">📍</span>
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-white">Your Location</h3>
                              <p className="text-xs text-gray-400">Your Current Location</p>
                            </div>
                            <button
                              onClick={handleGetHuntLocationGPS}
                              disabled={gettingGPSLocation}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            >
                              {gettingGPSLocation ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              )}
                              <span>Detect</span>
                            </button>
                          </div>

                          <div className="relative flex gap-2">
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={huntLocation}
                                onChange={(e) => handleHuntLocationChange(e.target.value)}
                                onKeyDown={handleHuntLocationKeyDown}
                                onFocus={() => {
                                  if (huntLocationSuggestions.length > 0) setShowHuntLocationSuggestions(true);
                                }}
                                placeholder="e.g., Tromsø, Norway"
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoComplete="off"
                              />

                              {loadingHuntLocationSuggestions && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}

                              {/* Autocomplete Dropdown */}
                              {showHuntLocationSuggestions && huntLocationSuggestions.length > 0 && (
                                <div className="hunt-location-autocomplete absolute z-[9999] w-full mt-1 bg-[#1a1f2e] border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                  {huntLocationSuggestions.map((suggestion: any, idx: number) => (
                                    <div
                                      key={idx}
                                      onClick={() => selectHuntLocationSuggestion(suggestion)}
                                      className={`px-3 py-2 cursor-pointer text-sm text-white border-b border-white/10 last:border-b-0 ${
                                        idx === huntLocationSelectedIndex
                                          ? "bg-blue-600/40"
                                          : "hover:bg-white/10"
                                      }`}
                                    >
                                      <div className="font-medium">{suggestion.name}</div>
                                      <div className="text-xs text-gray-400">
                                        {suggestion.admin1 && `${suggestion.admin1}, `}{suggestion.country}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {showHuntLocationSuggestions && !loadingHuntLocationSuggestions && huntLocationSuggestions.length === 0 && huntLocation.length >= 2 && (
                                <div className="hunt-location-autocomplete absolute z-[9999] w-full mt-1 bg-[#1a1f2e] border border-white/20 rounded-lg shadow-xl p-3">
                                  <p className="text-gray-400 text-sm text-center">
                                    No locations found. Try a different search.
                                  </p>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={handleHuntLocationSubmit}
                              disabled={!huntLocation.trim() || loadingHuntLocationData}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                              {loadingHuntLocationData ? "..." : "Get"}
                            </button>
                          </div>
                        </div>

                        {/* Data metrics below */}
                        <div className="space-y-2">
                          {huntLocationCoords && (
                            <>
                              {/* 1. Latitude Visibility Check */}
                              {(() => {
                                const kp = parseFloat(currentKp);
                                const huntLat = huntLocationCoords?.lat || 0;
                                const visibility = canSeeAuroraAtLatitude(huntLat, kp);
                                const absLat = Math.abs(huntLat).toFixed(1);
                                const isAuroraPossible = visibility.minKpRequired !== null;

                                let visibilityStatus = "";
                                let visibilityColor = "";
                                let visibilityEmoji = "";

                                if (visibility.minKpRequired === null) {
                                  // Impossible at this latitude
                                  visibilityStatus = "Impossible";
                                  visibilityColor = "text-red-400";
                                  visibilityEmoji = "❌";
                                } else if (!visibility.canSee) {
                                  // Not visible at current Kp
                                  visibilityStatus = `Need Kp ${visibility.minKpRequired}+`;
                                  visibilityColor = "text-orange-400";
                                  visibilityEmoji = "⚠️";
                                } else {
                                  // Visible!
                                  visibilityStatus = "Visible";
                                  visibilityColor = "text-green-400";
                                  visibilityEmoji = "✅";
                                }

                                return (
                                  <>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-400">Latitude ({absLat}°)</span>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${visibilityColor}`}>
                                          {visibilityStatus}
                                        </span>
                                        <span className="text-base">{visibilityEmoji}</span>
                                      </div>
                                    </div>

                                    {/* Only show sky condition metrics if aurora is possible at this latitude */}
                                    {isAuroraPossible && (
                                      <>
                                        {/* 2. Daylight */}
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-400">Daylight</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">
                                              {daylightStatus === "Day" && sunsetTime
                                                ? `Sunset at ${sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
                                                : daylightStatus || "Unknown"}
                                            </span>
                                            <span className="text-lg">{getDaylightEmoji(daylightStatus)}</span>
                                          </div>
                                        </div>

                                        {/* 3. Cloud Cover */}
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-400">Cloud Cover</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold" style={{ color: getCloudCoverColor(cloudCover || 0) }}>{cloudCover}%</span>
                                            <span className="text-lg">{getCloudCoverEmoji(cloudCover || 0, daylightStatus)}</span>
                                          </div>
                                        </div>

                                        {/* 4. Bortle Class */}
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-400">Bortle Class</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{bortleClass}</span>
                                            <span className="text-base">{getBortleEmoji(bortleClass || 5)}</span>
                                          </div>
                                        </div>

                                        {/* 5. Moon Phase */}
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-400">Moon Phase</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{illumination}%</span>
                                            {moonPhase && (
                                              <span className="text-2xl">
                                                {(() => {
                                                  const phase = moonPhase.phase.toLowerCase();
                                                  if (phase.includes('new moon')) return "🌑";
                                                  if (phase.includes('waxing crescent')) return "🌒";
                                                  if (phase.includes('first quarter')) return "🌓";
                                                  if (phase.includes('waxing gibbous')) return "🌔";
                                                  if (phase.includes('full moon')) return "🌕";
                                                  if (phase.includes('waning gibbous')) return "🌖";
                                                  if (phase.includes('last quarter') || phase.includes('third quarter')) return "🌗";
                                                  if (phase.includes('waning crescent')) return "🌘";
                                                  return "🌑";
                                                })()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </div>

                        {/* Cloud forecast trend message below metrics - REMOVED FOR NOW, LOGIC KEPT FOR LATER */}
                        {/* {cloudTrendAnalysis.message && (
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <div className="text-xs text-gray-400 italic">
                              {(() => {
                                // Replace "Try again tomorrow." with clear skies message if available
                                if (hasClearSkiesNearby && cloudTrendAnalysis.message.includes('Try again tomorrow.')) {
                                  return cloudTrendAnalysis.message.replace('Try again tomorrow.', 'Check clear skies below!');
                                }
                                return cloudTrendAnalysis.message;
                              })()}
                            </div>
                          </div>
                        )} */}

                        {/* Search Clear Skies Buttons - Show when cloud cover > 50% AND aurora is possible at this latitude */}
                        {huntLocationCoords && cloudCover !== null && cloudCover > 50 && !loadingRecommendations && canSeeAuroraAtLatitude(huntLocationCoords.lat, parseFloat(currentKp)).minKpRequired !== null && (
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="text-sm font-semibold text-gray-300 mb-3">Search for clear skies nearby:</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSearchRadiusHours(2);
                                  setLocationRecommendations([]);
                                  const originCoords = yourLocationCoords || huntLocationCoords;
                                  fetchLocationRecommendations(
                                    huntLocationCoords.lat,
                                    huntLocationCoords.lon,
                                    originCoords.lat,
                                    originCoords.lon,
                                    huntLocationWeatherData,
                                    undefined,
                                    2
                                  );
                                }}
                                disabled={loadingRecommendations}
                                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors"
                              >
                                Within 2 hours
                              </button>
                              <button
                                onClick={() => {
                                  setSearchRadiusHours(4);
                                  setLocationRecommendations([]);
                                  const originCoords = yourLocationCoords || huntLocationCoords;
                                  fetchLocationRecommendations(
                                    huntLocationCoords.lat,
                                    huntLocationCoords.lon,
                                    originCoords.lat,
                                    originCoords.lon,
                                    huntLocationWeatherData,
                                    undefined,
                                    4
                                  );
                                }}
                                disabled={loadingRecommendations}
                                className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors"
                              >
                                Within 4 hours
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Recommendations Section */}
                        {(() => {
                          // Define huntLat and huntLng at the top level for all recommendations
                          const huntLat = huntLocationCoords?.lat || 0;
                          const huntLng = huntLocationCoords?.lon || 0;

                          // 1. Impossible latitude - suggest countries to fly to
                          if (gate2Verdict === "YOU'RE TOO FAR FROM THE POLES!") {
                            const recommendedCountries = [
                              { country: "Norway", cities: "Tromsø, Alta, Svalbard" },
                              { country: "Iceland", cities: "Reykjavik, Akureyri" },
                              { country: "Finland", cities: "Rovaniemi, Ivalo, Saariselkä" },
                              { country: "Sweden", cities: "Kiruna, Abisko, Luleå" },
                              { country: "Canada", cities: "Yellowknife, Whitehorse, Inuvik" },
                              { country: "USA (Alaska)", cities: "Fairbanks, Anchorage" }
                            ];

                            return (
                              <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
                                <div className="text-sm font-bold text-blue-300 mb-2">✈️ Recommended Countries</div>
                                <div className="space-y-2">
                                  {recommendedCountries.map((item, idx) => (
                                    <div key={idx} className="text-xs">
                                      <span className="font-bold text-white">{item.country}:</span>
                                      <span className="text-gray-300 ml-1">{item.cities}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Find flights buttons */}
                                <a
                                  href="https://www.trip.com/t/YzYLsf5i7S2"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                                >
                                  ✈️ Find Flights on Trip.com
                                </a>

                                <a
                                  href="https://www.agoda.com/flights"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                                >
                                  ✈️ Search Flights on Agoda
                                </a>

                                <a
                                  href="https://www.skyscanner.com/flights"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                                >
                                  ✈️ Compare Flights on Skyscanner
                                </a>

                                <a
                                  href="https://www.expedia.com/Flights"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                                >
                                  ✈️ Book Flights on Expedia
                                </a>
                              </div>
                            );
                          }

                          // 2. Too far south/north for current Kp - suggest cities within 4h drive
                          if (gate2Verdict.includes("GO NORTH, OR YOU NEED AT LEAST KP") || gate2Verdict.includes("GO SOUTH, OR YOU NEED AT LEAST KP")) {
                            const isNorthern = huntLat >= 0;
                            const targetKp = latitudeCheck.minKpRequired || 5;

                            // Get cities that would work with current Kp (within reasonable driving distance)
                            const nearbyCities = auroraLocations
                              .filter(loc => {
                                // Filter by hemisphere
                                if (isNorthern && loc.latitude < 0) return false;
                                if (!isNorthern && loc.latitude > 0) return false;

                                // Filter by Kp requirement (cities that work with current Kp)
                                if (loc.minKpRequired > kp) return false;

                                return true; // Calculate distance in map, filter after
                              })
                              .map(loc => {
                                // Calculate actual great-circle distance using Haversine formula
                                const distanceKm = calculateDistance(huntLat, huntLng, loc.latitude, loc.longitude);
                                return {
                                  ...loc,
                                  distanceKm
                                };
                              })
                              .filter(city => {
                                // 4 hours of driving at ~100 km/h = ~400 km max
                                // Start from 0 km (nearer is better)
                                return city.distanceKm >= 0 && city.distanceKm <= 400;
                              })
                              .sort((a, b) => {
                                // Sort by actual distance (closest first)
                                return a.distanceKm - b.distanceKm;
                              })
                              .slice(0, 5);

                            // Define geographic regions for flight recommendations
                            const europeanCountries = ['Norway', 'Iceland', 'Sweden', 'Finland', 'Russia', 'Estonia', 'Latvia', 'UK', 'Ireland', 'Denmark', 'Lithuania', 'Belarus', 'Netherlands', 'Germany', 'Belgium', 'Czech Republic', 'Poland', 'Ukraine', 'France', 'Austria', 'Switzerland', 'Italy', 'Romania', 'Serbia', 'Bulgaria', 'Georgia', 'Spain', 'Portugal', 'Greece', 'Turkey'];
                            const northAmericanCountries = ['USA', 'Canada'];
                            const asianCountries = ['Iran', 'South Korea', 'Japan', 'China', 'India', 'Israel', 'Morocco', 'Egypt'];

                            // Get flight-reachable cities
                            const flightReachableCities = auroraLocations
                              .filter(loc => {
                                // Filter by hemisphere
                                if (isNorthern && loc.latitude < 0) return false;
                                if (!isNorthern && loc.latitude > 0) return false;

                                // Filter by Kp requirement (cities that work with current Kp)
                                if (loc.minKpRequired > kp) return false;

                                return true; // Let map calculate distance and filter after
                              })
                              .map(loc => {
                                // Calculate actual great-circle distance using Haversine formula
                                const distanceKm = calculateDistance(huntLat, huntLng, loc.latitude, loc.longitude);

                                // Calculate flight time: distance / average commercial flight speed (850 km/h)
                                const flightTimeHours = distanceKm / 850;

                                // Determine region priority (prioritize same-continent destinations)
                                let regionPriority = 2; // Default: other regions
                                if (europeanCountries.includes(loc.country)) {
                                  regionPriority = 0; // Europe gets highest priority for European users
                                } else if (northAmericanCountries.includes(loc.country)) {
                                  regionPriority = 1; // North America secondary
                                }

                                return {
                                  ...loc,
                                  distanceKm,
                                  flightTimeHours,
                                  regionPriority
                                };
                              })
                              .filter(city => {
                                // Filter for 2.5 hour flight time: 2.5 hours * 850 km/h = 2125 km max
                                // Minimum distance: roughly 400km to avoid overlap with driving distance
                                return city.distanceKm >= 400 && city.distanceKm <= 2125;
                              })
                              .sort((a, b) => {
                                // First sort by region priority (same continent first)
                                if (a.regionPriority !== b.regionPriority) {
                                  return a.regionPriority - b.regionPriority;
                                }
                                // Then sort by actual distance (closest first)
                                return a.distanceKm - b.distanceKm;
                              })
                              .slice(0, 5);

                            return (
                              <div className="mt-4 pt-4 border-t border-white/20 space-y-4">
                                {/* Driving distance section */}
                                {nearbyCities.length > 0 && (
                                  <div>
                                    <div className="text-sm font-bold text-yellow-300 mb-2">🚗 Cities Within Driving Distance</div>
                                    <div className="space-y-2">
                                      {nearbyCities.map((city, idx) => {
                                        // Calculate driving time: assume average 100 km/h
                                        const drivingTimeHours = city.distanceKm / 100;
                                        const drivingTimeFormatted = drivingTimeHours < 1
                                          ? `${Math.round(drivingTimeHours * 60)}min`
                                          : `${drivingTimeHours.toFixed(1)}h`;

                                        return (
                                          <div key={idx} className="text-xs flex justify-between items-center">
                                            <span className="text-white">{city.city}, {city.country}</span>
                                            <span className="text-gray-400">~{drivingTimeFormatted} drive</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Flight distance section */}
                                {flightReachableCities.length > 0 && (
                                  <div>
                                    <div className="text-sm font-bold text-blue-300 mb-2">✈️ Cities Within Flight Distance</div>
                                    <div className="space-y-2 mb-4">
                                      {flightReachableCities.map((city, idx) => {
                                        // Flight time already calculated
                                        const flightTimeFormatted = city.flightTimeHours < 1
                                          ? `${Math.round(city.flightTimeHours * 60)}min`
                                          : `${city.flightTimeHours.toFixed(1)}h`;

                                        return (
                                          <div key={idx} className="text-xs flex justify-between items-center">
                                            <span className="text-white">{city.city}, {city.country}</span>
                                            <span className="text-gray-400">~{flightTimeFormatted} flight</span>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Flight booking buttons */}
                                    <a
                                      href="https://www.trip.com/t/YzYLsf5i7S2"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                                    >
                                      ✈️ Find Flights on Trip.com
                                    </a>

                                    <a
                                      href="https://www.agoda.com/flights"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                                    >
                                      ✈️ Search Flights on Agoda
                                    </a>

                                    <a
                                      href="https://www.skyscanner.com/flights"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                                    >
                                      ✈️ Compare Flights on Skyscanner
                                    </a>

                                    <a
                                      href="https://www.expedia.com/Flights"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                                    >
                                      ✈️ Book Flights on Expedia
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </>
                    );
                  })()}
                </div>

                {/* Nearby Options - Drive Recommendations */}
                {locationRecommendations.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 rounded-xl p-5 border-2 border-blue-500/40">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🚗</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">Nearby Options</h3>
                        <p className="text-xs text-gray-400">Top 4 locations sorted by cloud cover</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {locationRecommendations.map((rec: any, idx: number) => {
                        const driveTimeFormatted = rec.driveTime < 60
                          ? `${Math.round(rec.driveTime)}min`
                          : `${Math.floor(rec.driveTime / 60)}h ${rec.driveTime % 60}min`;

                        const improvement = rec.improvement || ((cloudCover || 0) - rec.cloudCoverAtArrival);
                        const isBest = idx === 0;
                        const isBetter = improvement > 0;
                        const isClear = rec.cloudCoverAtArrival < 30;

                        return (
                          <div
                            key={idx}
                            className={`bg-black/30 rounded-lg p-3 border ${
                              isBest && isClear ? 'border-green-500/50' :
                              isBest ? 'border-blue-500/50' :
                              'border-white/10'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {isBest && <span className="text-yellow-400">⭐</span>}
                                <span className="text-white font-bold">{rec.direction}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-300">{rec.distance.toFixed(0)} km</span>
                              </div>
                              <span className="text-sm text-gray-400">{driveTimeFormatted} drive</span>
                            </div>

                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Clouds:</span>
                                <span className={`text-sm font-bold ${
                                  rec.cloudCoverAtArrival < 30 ? 'text-green-400' :
                                  rec.cloudCoverAtArrival < 50 ? 'text-yellow-400' :
                                  rec.cloudCoverAtArrival < 70 ? 'text-orange-400' :
                                  'text-red-400'
                                }`}>
                                  {rec.cloudCoverAtArrival}%
                                </span>
                                {isClear && <span className="text-green-400 text-xs">Clear!</span>}
                              </div>
                              <span className={`text-xs ${isBetter ? 'text-green-400' : improvement === 0 ? 'text-gray-400' : 'text-orange-400'}`}>
                                {isBetter ? `↓${improvement.toFixed(0)}% better` :
                                 improvement === 0 ? 'Same' :
                                 `↑${Math.abs(improvement).toFixed(0)}% worse`}
                              </span>
                            </div>

                            {rec.trend && (
                              <div className="text-xs text-gray-400 mb-2">
                                {rec.trend === 'clearing' ? '🌤️ Clearing' :
                                 rec.trend === 'worsening' ? '⚠️ Worsening' :
                                 '➡️ Stable'}
                              </div>
                            )}

                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${rec.coords.lat},${rec.coords.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block w-full px-3 py-2 ${
                                isClear ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                              } text-white text-sm font-bold rounded-lg transition-all text-center`}
                            >
                              Navigate →
                            </a>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 text-xs text-gray-500 text-center">
                      Forecasts account for your drive time • You decide which option works best
                    </div>
                  </div>
                )}

                {/* Loading state for recommendations */}
                {loadingRecommendations && (
                  <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 rounded-xl p-5 border-2 border-blue-500/40">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl animate-pulse">🚗</span>
                      <span className="text-gray-400">Finding clear skies nearby...</span>
                    </div>
                  </div>
                )}

                {/* No options found message */}
                {!loadingRecommendations && recommendationsSearched && locationRecommendations.length === 0 && cloudCover && cloudCover > 50 && (
                  <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-5 border-2 border-gray-600/40">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">☁️</span>
                      <div>
                        <span className="text-gray-300 font-semibold">No driveable routes found within {searchRadiusHours} hours</span>
                        <p className="text-xs text-gray-500 mt-1">
                          {searchRadiusHours < 4 ? "Try searching within 4 hours" : "This area may have limited road access"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gate 3: Can I Get There? */}
                <div className="bg-gradient-to-br from-teal-900/60 to-cyan-900/60 rounded-xl p-5 border-2 border-teal-500/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">Can I Get There?</h3>
                    </div>
                  </div>

                  {/* Gate 3 Verdict */}
                  {(() => {
                    const now = new Date();
                    const hour = now.getHours();

                    // Get timezone offset for display
                    const getTimezoneString = () => {
                      const offset = -now.getTimezoneOffset();
                      const hours = Math.floor(Math.abs(offset) / 60);
                      const minutes = Math.abs(offset) % 60;
                      const sign = offset >= 0 ? '+' : '-';
                      return `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    };

                    // Use dynamic peak window based on hunt location latitude
                    const peakStart = huntLocationCoords ? huntLocationPeakWindow.start : 22;
                    const peakEnd = huntLocationCoords ? huntLocationPeakWindow.end : 2;

                    // Hybrid Scoring System for Gate 3
                    // Step 1: Calculate base score from contributory factors (additive)
                    let gate3BaseScore = 0;

                    // Calculate arrival time if travel time is provided
                    let arrivalHour = hour;
                    let canArriveTonight = true;
                    let isTooFar = false;

                    if (travelTime !== null) {
                      const arrivalTime = new Date(now.getTime() + (travelTime * 60 * 60 * 1000));
                      arrivalHour = arrivalTime.getHours();

                      // Check if travel time is too long (> 6 hours means can't arrive tonight)
                      if (travelTime > 6) {
                        canArriveTonight = false;
                        isTooFar = true;
                      }
                    }

                    // Calculate base score (always calculate for display purposes)
                    // Time of day scoring based on ARRIVAL time and dynamic peak window
                    const isPeakTime = (arrivalHour >= peakStart) || (arrivalHour <= peakEnd);
                    const isGoodTime = (arrivalHour >= peakStart - 2 && arrivalHour < peakStart) ||
                                      (arrivalHour > peakEnd && arrivalHour <= peakEnd + 2);

                    if (isPeakTime) {
                      gate3BaseScore += 40; // Will arrive during peak aurora time
                    } else if (isGoodTime) {
                      gate3BaseScore += 30; // Will arrive during good aurora time
                    } else if (arrivalHour >= 18 || arrivalHour <= 6) {
                      gate3BaseScore += 15; // Will arrive evening/early morning
                    } else {
                      gate3BaseScore += 0; // Will arrive during daytime - not ideal
                    }

                    // Travel time/distance scoring (contributory factor)
                    if (travelTime !== null) {
                      if (travelTime < 0.5) gate3BaseScore += 30; // < 30 min - excellent
                      else if (travelTime < 1) gate3BaseScore += 25; // < 1 hr - very good
                      else if (travelTime < 1.5) gate3BaseScore += 15; // < 1.5 hrs - good
                      else if (travelTime < 2.5) gate3BaseScore += 5; // < 2.5 hrs - marginal
                      else gate3BaseScore += 0; // > 2.5 hrs - poor (not practical)
                    } else {
                      gate3BaseScore += 15; // Assume moderate if no data
                    }

                    // Availability scoring - can you get there in time for peak viewing?
                    if (travelTime !== null) {
                      // Check if you can arrive before peak ends
                      const hoursUntilPeakEnd = peakEnd >= hour ? peakEnd - hour : 24 - hour + peakEnd;

                      if (travelTime < hoursUntilPeakEnd && isPeakTime) {
                        gate3BaseScore += 30; // Can arrive during peak time
                      } else if (travelTime < hoursUntilPeakEnd + 2) {
                        gate3BaseScore += 15; // Can arrive near peak time
                      } else {
                        gate3BaseScore += 5; // Will miss peak viewing window
                      }
                    } else {
                      gate3BaseScore += 10; // Baseline if no travel data
                    }

                    // Step 2: Apply travel feasibility multiplier (critical blocking factor)
                    let travelFeasibilityMultiplier = 1.0;
                    if (isTooFar) {
                      travelFeasibilityMultiplier = 0.0; // Complete block - cannot arrive tonight
                    }

                    // Step 3: Calculate final Gate 3 score
                    let gate3Score = gate3BaseScore * travelFeasibilityMultiplier;

                    // Helper function to format peak window time
                    const formatPeakWindow = () => {
                      const formatHour = (h: number) => {
                        if (h === 0) return "12 AM";
                        if (h < 12) return `${h} AM`;
                        if (h === 12) return "12 PM";
                        return `${h - 12} PM`;
                      };
                      return `${formatHour(peakStart)} - ${formatHour(peakEnd)}`;
                    };

                    // Step 4: Check if both locations can see aurora at all
                    // Check hunt location aurora visibility
                    const huntLat = huntLocationCoords?.lat || 0;
                    const huntLatCheck = canSeeAuroraAtLatitude(huntLat, parseFloat(currentKp));
                    const huntLocationImpossible = huntLatCheck.minKpRequired === null || huntLatCheck.minKpRequired >= 9;

                    // Check your location aurora visibility
                    const yourLat = yourLocationCoords?.lat || 0;
                    const yourLatCheck = canSeeAuroraAtLatitude(yourLat, parseFloat(currentKp));
                    const yourLocationImpossible = yourLatCheck.minKpRequired === null || yourLatCheck.minKpRequired >= 9;

                    // Step 5: Determine verdict
                    let gate3Verdict = "WAIT";

                    // PRIORITY: If both locations are impossible (Armageddon), suggest flying to poles
                    if (huntLocationImpossible && yourLocationImpossible) {
                      gate3Verdict = "START CHECKING FOR FLIGHTS TO THE POLES!";
                    } else if (isTooFar) {
                      // Check if extremely far (would need to fly)
                      const isFlightMode = travelDistance !== null && travelDistance >= 960;
                      const travelWord = isFlightMode ? "FLIGHT" : "DRIVE";
                      if (travelTime !== null && travelTime > 12) {
                        gate3Verdict = "TOO FAR, MAYBE IF YOU FLY NEARER TO THE POLES!";
                      } else if (travelTime !== null) {
                        gate3Verdict = `TOO FAR, YOU'RE ${travelTime.toFixed(1)} HOURS ${travelWord} AWAY!`;
                      } else {
                        gate3Verdict = `TOO FAR, YOU'RE 6+ HOURS ${travelWord} AWAY!`;
                      }
                    } else if (gate3Score >= 70) {
                      gate3Verdict = "GO FOR IT! FIND CLEAR SKIES TO SEE THE LIGHTS!";
                    } else if (gate3Score >= 45) {
                      const isFlightMode = travelDistance !== null && travelDistance >= 960;
                      const travelWord = isFlightMode ? "FLIGHT" : "DRIVE";
                      if (travelTime !== null) {
                        gate3Verdict = `YOU'RE ${travelTime.toFixed(1)} HOURS ${travelWord} FROM SEEING THE LIGHTS!`;
                      } else {
                        gate3Verdict = "YOU'RE WITHIN REACH OF SEEING THE LIGHTS!";
                      }
                    } else {
                      gate3Verdict = "NATURE IS NOT ON YOUR SIDE, WAIT FOR BETTER DAYS!";
                    }

                    const gate3Color = gate3Verdict.startsWith("GO FOR IT") ? "bg-[#1a4d2e] border-green-500" :
                                      gate3Verdict.startsWith("YOU'RE") && (gate3Verdict.includes("HOURS DRIVE FROM") || gate3Verdict.includes("HOURS FLIGHT FROM")) ? "bg-[#4d3a1a] border-yellow-500" :
                                      "bg-[#4d1a1a] border-red-700";
                    const gate3TextColor = gate3Verdict.startsWith("GO FOR IT") ? "text-green-300" :
                                          gate3Verdict.startsWith("YOU'RE") && (gate3Verdict.includes("HOURS DRIVE FROM") || gate3Verdict.includes("HOURS FLIGHT FROM")) ? "text-yellow-300" :
                                          "text-red-300";

                    const formatTime = (date: Date) => {
                      return date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                    };

                    return (
                      <>
                        {/* Verdict at the top */}
                        <div className={`${!yourLocationCoords ? 'bg-gray-700/50' : gate3Color} border-2 rounded-lg p-4 text-center mb-3 h-[100px] flex items-center justify-center`}>
                          {!yourLocationCoords ? (
                            <div className="text-sm text-gray-300 italic leading-tight">
                              Enter hunt location for travel analysis and reality check
                            </div>
                          ) : (
                            <div className={`text-lg font-bold ${gate3TextColor} leading-tight px-2`}>
                              {gate3Verdict}
                            </div>
                          )}
                        </div>

                        {/* Your Location Input */}
                        <div
                          className="mb-4 pb-4 border-b border-white/20 bg-gradient-to-br from-teal-900/40 to-cyan-900/40 backdrop-blur-lg rounded-2xl p-4 border-2 border-teal-500/30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">📍</span>
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-white">Hunt Location</h3>
                              <p className="text-xs text-gray-400">Where you plan to hunt aurora</p>
                            </div>
                            <button
                              onClick={handleGetGPSLocation}
                              disabled={gettingGPSLocation}
                              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            >
                              {gettingGPSLocation ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              )}
                              <span>Detect</span>
                            </button>
                          </div>

                          <div className="relative flex gap-2">
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={yourLocation}
                                onChange={(e) => handleYourLocationChange(e.target.value)}
                                onKeyDown={handleYourLocationKeyDown}
                                onFocus={() => {
                                  if (yourLocationSuggestions.length > 0) setShowYourLocationSuggestions(true);
                                }}
                                placeholder="e.g., Oslo, Norway"
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                autoComplete="off"
                              />

                              {loadingYourLocationSuggestions && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}

                              {/* Autocomplete Dropdown */}
                              {showYourLocationSuggestions && yourLocationSuggestions.length > 0 && (
                                <div className="your-location-autocomplete absolute z-[9999] w-full mt-1 bg-[#1a1f2e] border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                  {yourLocationSuggestions.map((suggestion: any, idx: number) => (
                                    <div
                                      key={idx}
                                      onClick={() => selectYourLocationSuggestion(suggestion)}
                                      className={`px-3 py-2 cursor-pointer text-sm text-white border-b border-white/10 last:border-b-0 ${
                                        idx === yourLocationSelectedIndex
                                          ? "bg-teal-600/40"
                                          : "hover:bg-white/10"
                                      }`}
                                    >
                                      <div className="font-medium">{suggestion.name}</div>
                                      <div className="text-xs text-gray-400">
                                        {suggestion.admin1 && `${suggestion.admin1}, `}{suggestion.country}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {showYourLocationSuggestions && !loadingYourLocationSuggestions && yourLocationSuggestions.length === 0 && yourLocation.length >= 2 && (
                                <div className="your-location-autocomplete absolute z-[9999] w-full mt-1 bg-[#1a1f2e] border border-white/20 rounded-lg shadow-xl p-3">
                                  <p className="text-gray-400 text-sm text-center">
                                    No locations found. Try a different search.
                                  </p>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={handleYourLocationSubmit}
                              disabled={!yourLocation.trim() || loadingYourLocationData}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                              {loadingYourLocationData ? "..." : "Get"}
                            </button>
                          </div>
                        </div>

                        {/* Data metrics below */}
                        <div className="space-y-2">
                          {yourLocationCoords && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Current Time ({getTimezoneString()})</span>
                                <span className="text-sm font-bold text-white" suppressHydrationWarning>
                                  {formatTime(now)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Peak Window {huntLocationCoords && huntLocationTimezone && `(${huntLocationTimezone})`}</span>
                                <span className="text-sm font-bold text-white">
                                  {huntLocationImpossible && yourLocationImpossible ? 'N/A' : formatPeakWindow()}
                                </span>
                              </div>
                            </>
                          )}
                          {travelTime !== null && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Travel Time</span>
                                <span className={`text-sm font-bold ${travelTime > 6 ? 'text-red-400' : 'text-white'}`}>
                                  {travelTime < 1 ? `${Math.round(travelTime * 60)} min` : `${travelTime.toFixed(1)} hrs`} {travelDistance !== null && travelDistance >= 960 ? '✈️' : '🚗'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Arrival Time ({getTimezoneString()})</span>
                                <span className={`text-sm font-bold ${
                                  huntLocationImpossible && yourLocationImpossible
                                    ? 'text-white'
                                    : !canArriveTonight ? 'text-red-400' : isPeakTime ? 'text-green-400' : isGoodTime ? 'text-yellow-400' : 'text-red-400'
                                }`} suppressHydrationWarning>
                                  {!canArriveTonight ? 'Too far!' : formatTime(new Date(now.getTime() + (travelTime * 60 * 60 * 1000)))}
                                </span>
                              </div>
                            </>
                          )}
                          {travelDistance !== null && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400">Distance</span>
                              <span className="text-sm font-bold text-white">{travelDistance.toFixed(0)} km</span>
                            </div>
                          )}
                          {yourLocationCoords && (
                            (() => {
                              const yourLat = yourLocationCoords.lat;
                              const latCheck = canSeeAuroraAtLatitude(yourLat, parseFloat(currentKp));
                              const minKp = latCheck.minKpRequired;

                              // If minKp is null or >= 9, show "Armageddon" (would require civilization-ending CME)
                              const displayValue = minKp === null || minKp >= 9
                                ? "Armageddon"
                                : `Kp ${minKp}`;

                              const textColor = minKp === null || minKp >= 9
                                ? "text-red-400"
                                : "text-yellow-400";

                              return (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">Min Kp</span>
                                  <span className={`text-sm font-bold ${textColor}`}>
                                    {displayValue}
                                  </span>
                                </div>
                              );
                            })()
                          )}
                        </div>

                        {/* Flight Recommendations when travel is by flight */}
                        {((yourLocationCoords && yourLocationImpossible) || (travelDistance !== null && travelDistance >= 960)) && (
                          <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
                            <div className="text-sm font-bold text-blue-300 mb-2">✈️ Recommended Countries</div>
                            <div className="space-y-2">
                              {[
                                { country: "Norway", cities: "Tromsø, Alta, Svalbard" },
                                { country: "Iceland", cities: "Reykjavik, Akureyri" },
                                { country: "Finland", cities: "Rovaniemi, Ivalo, Saariselkä" },
                                { country: "Sweden", cities: "Kiruna, Abisko, Luleå" },
                                { country: "Canada", cities: "Yellowknife, Whitehorse, Inuvik" },
                                { country: "USA (Alaska)", cities: "Fairbanks, Anchorage" }
                              ].map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-bold text-white">{item.country}:</span>
                                  <span className="text-gray-300 ml-1">{item.cities}</span>
                                </div>
                              ))}
                            </div>

                            {/* Find flights buttons */}
                            <a
                              href="https://www.trip.com/t/YzYLsf5i7S2"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                            >
                              ✈️ Find Flights on Trip.com
                            </a>

                            <a
                              href="https://www.agoda.com/flights"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                            >
                              ✈️ Search Flights on Agoda
                            </a>

                            <a
                              href="https://www.skyscanner.com/flights"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                            >
                              ✈️ Compare Flights on Skyscanner
                            </a>

                            <a
                              href="https://www.expedia.com/Flights"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                            >
                              ✈️ Book Flights on Expedia
                            </a>
                          </div>
                        )}

                        {/* Accommodation Recommendations when driving over 4 hours */}
                        {travelDistance !== null && travelDistance < 960 && travelTime !== null && travelTime > 4 && (
                          <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
                            <div className="text-sm font-bold text-white mb-2">🏨 Book Accommodation Near Your Hunt</div>

                            <a
                              href="https://www.trip.com/t/YzYLsf5i7S2"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                            >
                              🏨 Find Accommodation on Trip.com
                            </a>

                            <a
                              href="https://www.agoda.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                            >
                              🏨 Search Accommodation on Agoda
                            </a>

                            <a
                              href="https://www.expedia.com/Hotels"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg transition-all text-center"
                            >
                              🏨 Book Accommodation on Expedia
                            </a>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Accommodations Link Card */}
            <div
              onClick={() => router.push("/accommodations")}
              className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 backdrop-blur-lg rounded-2xl p-5 border-2 border-emerald-500/30 cursor-pointer hover:border-aurora-green/60 hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🏔️</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Aurora Accommodations</h3>
                    <p className="text-sm text-gray-300 mt-1">
                      Find glass igloos & aurora cabins with min Kp requirements & sighting rates
                    </p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-aurora-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Data Sources Button */}
            <button
              onClick={() => router.push('/data-sources')}
              className="w-full bg-gradient-to-br from-slate-800/40 to-gray-800/40 rounded-2xl p-6 border-2 border-slate-600/30 hover:scale-[1.02] transition-transform shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📊</span>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-white">Data Sources</h3>
                    <p className="text-sm text-gray-400 mt-1">View all data sources and real-time update status</p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Aurora Intel Tab - Comprehensive Scientific Analysis */}
      {activeTab === "aurora-intel" && (
        <div className="max-w-screen-lg mx-auto p-4">
          <div className="space-y-4">
            {/* Aurora Intel Title */}
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white">🌌 Aurora Intel</h2>
            </div>

            {/* Navigation Cards - 3 Column Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Kp Index Card */}
              <button
                onClick={() => router.push("/forecast")}
                className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 rounded-xl p-4 border border-indigo-500/30 hover:scale-[1.02] hover:border-indigo-400/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-4xl">📊</span>
                  <h3 className="text-sm font-bold text-white">Kp Index</h3>
                </div>
              </button>

              {/* Solar Wind Card */}
              <button
                onClick={() => router.push("/solar-wind")}
                className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-xl p-4 border border-emerald-500/30 hover:scale-[1.02] hover:border-emerald-400/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-4xl">🌬️</span>
                  <h3 className="text-sm font-bold text-white">Solar Wind</h3>
                </div>
              </button>

              {/* Experts Card */}
              <button
                onClick={() => router.push("/experts")}
                className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-4 border border-purple-500/30 hover:scale-[1.02] hover:border-purple-400/50 transition-all"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-4xl">👨‍🔬</span>
                  <h3 className="text-sm font-bold text-white">Experts</h3>
                </div>
              </button>
            </div>

            {/* Real-time Data Cards - 3 Column Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Bz Reading Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Bz Reading</div>
                {loadingBz ? (
                  <div className="text-lg font-bold text-gray-500">Loading...</div>
                ) : (
                  <>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: getBzColor(currentBz || 0) }}
                    >
                      {currentBz !== null ? `${currentBz >= 0 ? '+' : ''}${currentBz.toFixed(1)} nT` : '--'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {bzLastUpdated ? new Date(bzLastUpdated).toLocaleTimeString() : ''}
                    </div>
                  </>
                )}
              </div>

              {/* Density Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Density</div>
                {loadingSolarWind ? (
                  <div className="text-lg font-bold text-gray-500">Loading...</div>
                ) : (
                  <>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: getDensityColor(solarWindDensity || 0) }}
                    >
                      {solarWindDensity !== null ? `${solarWindDensity.toFixed(1)} p/cm³` : '--'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {solarWindLastUpdated ? new Date(solarWindLastUpdated).toLocaleTimeString() : ''}
                    </div>
                  </>
                )}
              </div>

              {/* Speed Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Speed</div>
                {loadingSolarWind ? (
                  <div className="text-lg font-bold text-gray-500">Loading...</div>
                ) : (
                  <>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: getSpeedColor(solarWindSpeed || 0) }}
                    >
                      {solarWindSpeed !== null ? `${solarWindSpeed.toFixed(0)} km/s` : '--'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {solarWindLastUpdated ? new Date(solarWindLastUpdated).toLocaleTimeString() : ''}
                    </div>
                  </>
                )}
              </div>

              {/* Bz Trend Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Bz Trend</div>
                {loadingBz || !bzHistory ? (
                  <div className="text-lg font-bold text-gray-500">Loading...</div>
                ) : (
                  <>
                    <div
                      className="text-2xl font-bold capitalize"
                      style={{
                        // Positive Bz = no aurora, always red
                        color: (currentBz ?? 0) >= 0 ? '#ef4444' :
                               // Negative & strengthening or stable = good
                               bzHistory.bzTrend === 'strengthening' || bzHistory.bzTrend === 'stable' ? '#22c55e' :
                               // Negative but weakening = fading
                               '#eab308'
                      }}
                    >
                      {(currentBz ?? 0) >= 0 ? 'Positive' : bzHistory.bzTrend}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {bzHistory.minutesSouth}min south
                    </div>
                  </>
                )}
              </div>

              {/* Hemisphere Power Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Hemisphere Power</div>
                {loadingHemispherePower ? (
                  <div className="text-lg font-bold text-gray-500">Loading...</div>
                ) : (
                  <>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: getHemispherePowerColor(hemispherePower?.north || 0) }}
                    >
                      {hemispherePower ? `${hemispherePower.north} GW` : '--'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {hemispherePower ? getHemispherePowerStatus(hemispherePower.north) : ''}
                    </div>
                  </>
                )}
              </div>

              {/* Substorm Phase Card */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Substorm Phase</div>
                {loadingGoesData ? (
                  <div className="text-lg font-bold text-gray-500">Loading...</div>
                ) : (
                  <>
                    <div
                      className="text-2xl font-bold uppercase"
                      style={{
                        color: energyState.substormPhase === 'expansion' ? '#ef4444' :
                               energyState.substormPhase === 'growth' ? '#eab308' :
                               energyState.substormPhase === 'recovery' ? '#22c55e' : '#9ca3af'
                      }}
                    >
                      {energyState.substormPhase}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {energyState.substormPhase === 'expansion' ? 'Active now!' :
                       energyState.substormPhase === 'growth' ? 'Building up' :
                       energyState.substormPhase === 'recovery' ? 'Fading' : 'No activity'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Time Lag Information */}
            <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>⏱️</span>
                <span>Response Time & Timeline</span>
              </h2>

              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-2">IMF to Aurora Response</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-aurora-green">•</span>
                      <span><strong>L1 monitoring point:</strong> 1.5 million km from Earth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-aurora-green">•</span>
                      <span><strong>Transit time to Earth:</strong> 30-60 minutes typically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-aurora-green">•</span>
                      <span><strong>Magnetospheric response:</strong> 20-40 minutes after IMF arrival</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-aurora-green">•</span>
                      <span><strong>Total lag:</strong> ~45-90 minutes from L1 observation to aurora onset</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-2">Substorm Development Timeline</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-sm font-medium text-white">Growth Phase (30-60 min)</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-4">Energy loading, quiet period before onset</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-sm font-medium text-white">Expansion Phase (10-30 min)</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-4">Aurora brightens dramatically and spreads</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <span className="text-sm font-medium text-white">Recovery Phase (30-120 min)</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-4">Aurora fades, pulsating patches remain</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Conditions */}
            <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-orange-500/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🎪</span>
                <span>Special Conditions Detection</span>
              </h2>

              <div className="space-y-3">
                {(() => {
                  const kp = parseFloat(currentKp);
                  const bz = currentBz ?? 0;
                  const bt = currentBt ?? 0;
                  const speed = solarWindSpeed ?? 0;
                  const density = solarWindDensity ?? 0;

                  const conditions = [];

                  // High-Speed Stream with Moderate Bz
                  if (speed >= 600 && speed <= 700 && bz >= -10 && bz <= -7 && kp >= 5 && kp <= 6) {
                    conditions.push({
                      name: "High-Speed Stream",
                      emoji: "💨",
                      description: "Fast-moving, filamentary aurora with rapid pulsations. Green with pink/red lower borders (high energy precipitation).",
                      probability: "60-75%"
                    });
                  }

                  // Dense CME
                  if (density >= 15 && density <= 30 && bz <= -15 && speed >= 450 && speed <= 500) {
                    conditions.push({
                      name: "Dense CME Impact",
                      emoji: "🌪️",
                      description: "Bright, broad arcs with sustained activity over many hours. Deep red coloration more likely.",
                      probability: "80-90%"
                    });
                  }

                  // Strong Bt with Mixed Bz
                  if (bt > 20 && Math.abs(bz) < 5) {
                    conditions.push({
                      name: "Large Bt Magnitude",
                      emoji: "⚠️",
                      description: "Brief southward turnings can create intense but short-lived aurora. Any southward component becomes highly geoeffective.",
                      probability: "Variable"
                    });
                  }

                  // Theta Aurora potential (northward Bz with high speed)
                  if (bz > 5 && speed > 500) {
                    conditions.push({
                      name: "Theta Aurora Potential",
                      emoji: "🎭",
                      description: "Rare transpolar arc formation possible during prolonged northward IMF. Visible only from polar regions.",
                      probability: "<5%"
                    });
                  }

                  return conditions.length > 0 ? (
                    conditions.map((condition, idx) => (
                      <div key={idx} className="bg-black/30 rounded-xl p-4 border border-orange-500/30">
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{condition.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-bold text-white">{condition.name}</h3>
                              <span className="text-xs text-orange-300 font-medium">{condition.probability}</span>
                            </div>
                            <p className="text-sm text-gray-300">{condition.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <p>No special conditions detected at this time.</p>
                      <p className="text-sm mt-1">Standard aurora analysis applies.</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Data Sources Note */}
            <div className="bg-black/20 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 text-center">
                Data sources: NOAA SWPC (Kp, Solar Wind), NASA ACE (IMF Bz/Bt).
                Updates every 5-15 minutes. Formula based on peer-reviewed space weather research.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
