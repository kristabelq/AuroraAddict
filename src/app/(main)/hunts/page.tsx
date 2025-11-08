"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import TimeHeader from "@/components/TimeHeader";
import { formatHuntDate } from "@/utils/timezone";
import { formatLocationWithFlag, formatCountryOnly } from "@/utils/location";
import AuroraLoader from "@/components/ui/AuroraLoader";

interface Hunt {
  id: string;
  name: string;
  description?: string;
  coverImage?: string | null;
  location: string;
  hideLocation?: boolean;
  startDate: string;
  endDate: string;
  timezone?: string | null;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  isPaid: boolean;
  price?: number | null;
  capacity?: number | null;
  isCreator?: boolean; // Only present in My Hunts
  isUserParticipant?: boolean; // Only present in Hunts tab - indicates if logged-in user is already a participant
  isPendingPayment?: boolean; // True if user has joined a paid hunt but hasn't completed payment
  successRate?: string; // Success rate for completed hunts (sightings per day)
  sightingsCount?: number; // Total sightings for completed hunts
  huntLengthDays?: number; // Total hunt duration in days
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string;
  };
  participants: number; // Confirmed participants count
  waitlistCount?: number; // Waitlisted participants count
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

interface ChatPreview {
  huntId: string;
  huntName: string;
  lastMessage?: Message;
  unreadCount: number;
}

type TabType = "hunts" | "my-hunts";
type HuntFilterType = "all" | "upcoming" | "ongoing" | "past";

export default function HuntsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("hunts");
  const [huntFilter, setHuntFilter] = useState<HuntFilterType>("all");
  const [allHunts, setAllHunts] = useState<Hunt[]>([]);
  const [myHunts, setMyHunts] = useState<Hunt[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningHunt, setJoiningHunt] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filter states
  const [hunterName, setHunterName] = useState("");
  const [huntName, setHuntName] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [huntType, setHuntType] = useState<"all" | "free" | "paid">("all");
  const [availability, setAvailability] = useState<"all" | "available" | "full">("all");
  const [durationFilter, setDurationFilter] = useState<"all" | "single" | "multi">("all");

  // Set initial tab from URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "my-hunts") {
      setActiveTab("my-hunts");
    }

    // Set organizer filter from URL params
    const organizer = searchParams.get("organizer");
    if (organizer) {
      setHunterName(organizer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "hunts") {
      fetchAllHunts();
    } else if (activeTab === "my-hunts") {
      fetchMyHunts();
    }
  }, [activeTab]);

  const fetchAllHunts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/hunts/upcoming");
      const data = await response.json();

      // Check if response is ok and data is an array
      if (response.ok && Array.isArray(data)) {
        setAllHunts(data);
      } else {
        console.error("Failed to fetch hunts:", data);
        setAllHunts([]); // Set empty array on error
      }
    } catch (error) {
      console.error("Error fetching hunts:", error);
      setAllHunts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchMyHunts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/hunts/my-hunts");
      const data = await response.json();

      // Check if response is ok and data is an array
      if (response.ok && Array.isArray(data)) {
        setMyHunts(data);
      } else {
        console.error("Failed to fetch my hunts:", data);
        setMyHunts([]); // Set empty array on error
      }
    } catch (error) {
      console.error("Error fetching my hunts:", error);
      setMyHunts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/hunts/chats");
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHunt = async (huntId: string) => {
    setJoiningHunt(huntId);
    try {
      const response = await fetch(`/api/hunts/${huntId}/join`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh the hunts list
        fetchAllHunts();
      }
    } catch (error) {
      console.error("Error joining hunt:", error);
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

      if (response.ok) {
        // Refresh the hunts list
        fetchAllHunts();
      }
    } catch (error) {
      console.error("Error leaving hunt:", error);
    } finally {
      setJoiningHunt(null);
    }
  };

  // Filter hunts based on selected filter
  const getFilteredHunts = () => {
    const now = new Date();

    let filtered = allHunts;

    // Apply time-based filter (All, Upcoming, Ongoing, Past)
    switch (huntFilter) {
      case "upcoming":
        filtered = filtered.filter(hunt => new Date(hunt.startDate) > now);
        break;
      case "ongoing":
        filtered = filtered.filter(hunt =>
          new Date(hunt.startDate) <= now && new Date(hunt.endDate) >= now
        );
        break;
      case "past":
        filtered = filtered.filter(hunt => new Date(hunt.endDate) < now);
        break;
    }

    // Apply hunter name filter with boolean operators support (AND, OR, NOT)
    if (hunterName.trim()) {
      filtered = filtered.filter(hunt => {
        const searchInput = hunterName.trim().toLowerCase().replace(/^@/, '');
        const username = hunt.user.username?.toLowerCase() || "";
        const name = hunt.user.name.toLowerCase();
        const combinedText = `${username} ${name}`;

        // Check for boolean operators
        const hasAND = searchInput.includes(' and ');
        const hasOR = searchInput.includes(' or ');
        const hasNOT = searchInput.includes(' not ');

        // Parse NOT operators first
        let positiveTerms = searchInput;
        const notTerms: string[] = [];
        if (hasNOT) {
          const notSplit = searchInput.split(' not ');
          positiveTerms = notSplit[0];
          for (let i = 1; i < notSplit.length; i++) {
            const notTerm = notSplit[i].split(/ and | or /)[0].trim();
            if (notTerm) notTerms.push(notTerm);
          }
        }

        // Check NOT conditions - if any NOT term is found, exclude this hunt
        for (const notTerm of notTerms) {
          if (combinedText.includes(notTerm)) {
            return false;
          }
        }

        // Handle AND operator (all terms must be present)
        if (hasAND && !hasOR) {
          const andTerms = positiveTerms.split(' and ').map(t => t.trim()).filter(t => t);
          return andTerms.every(term => combinedText.includes(term));
        }

        // Handle OR operator (at least one term must be present)
        if (hasOR && !hasAND) {
          const orTerms = positiveTerms.split(' or ').map(t => t.trim()).filter(t => t);
          return orTerms.some(term => combinedText.includes(term));
        }

        // Handle mixed AND/OR (process left to right with AND having higher precedence)
        if (hasAND && hasOR) {
          // Split by OR first, then check if all AND conditions in each group are met
          const orGroups = positiveTerms.split(' or ');
          return orGroups.some(group => {
            const andTerms = group.split(' and ').map(t => t.trim()).filter(t => t);
            return andTerms.every(term => combinedText.includes(term));
          });
        }

        // No boolean operators - simple substring match
        return combinedText.includes(positiveTerms);
      });
    }

    // Apply hunt name filter with boolean operators support (AND, OR, NOT)
    if (huntName.trim()) {
      filtered = filtered.filter(hunt => {
        const searchInput = huntName.trim().toLowerCase();
        const name = hunt.name.toLowerCase();

        // Check for boolean operators
        const hasAND = searchInput.includes(' and ');
        const hasOR = searchInput.includes(' or ');
        const hasNOT = searchInput.includes(' not ');

        // Parse NOT operators first
        let positiveTerms = searchInput;
        const notTerms: string[] = [];
        if (hasNOT) {
          const notSplit = searchInput.split(' not ');
          positiveTerms = notSplit[0];
          for (let i = 1; i < notSplit.length; i++) {
            const notTerm = notSplit[i].split(/ and | or /)[0].trim();
            if (notTerm) notTerms.push(notTerm);
          }
        }

        // Check NOT conditions - if any NOT term is found, exclude this hunt
        for (const notTerm of notTerms) {
          if (name.includes(notTerm)) {
            return false;
          }
        }

        // Handle AND operator (all terms must be present)
        if (hasAND && !hasOR) {
          const andTerms = positiveTerms.split(' and ').map(t => t.trim()).filter(t => t);
          return andTerms.every(term => name.includes(term));
        }

        // Handle OR operator (at least one term must be present)
        if (hasOR && !hasAND) {
          const orTerms = positiveTerms.split(' or ').map(t => t.trim()).filter(t => t);
          return orTerms.some(term => name.includes(term));
        }

        // Handle mixed AND/OR (process left to right with AND having higher precedence)
        if (hasAND && hasOR) {
          // Split by OR first, then check if all AND conditions in each group are met
          const orGroups = positiveTerms.split(' or ');
          return orGroups.some(group => {
            const andTerms = group.split(' and ').map(t => t.trim()).filter(t => t);
            return andTerms.every(term => name.includes(term));
          });
        }

        // No boolean operators - simple substring match
        return name.includes(positiveTerms);
      });
    }

    // Apply location filter
    if (searchLocation.trim()) {
      filtered = filtered.filter(hunt =>
        hunt.location.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }

    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter(hunt =>
        new Date(hunt.startDate) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(hunt =>
        new Date(hunt.endDate) <= new Date(endDate)
      );
    }

    // Apply hunt type filter (free/paid)
    if (huntType === "free") {
      filtered = filtered.filter(hunt => !hunt.isPaid);
    } else if (huntType === "paid") {
      filtered = filtered.filter(hunt => hunt.isPaid);
    }

    // Apply availability filter
    if (availability === "available") {
      filtered = filtered.filter(hunt =>
        hunt.capacity == null || hunt.participants < hunt.capacity
      );
    } else if (availability === "full") {
      filtered = filtered.filter(hunt =>
        hunt.capacity != null && hunt.participants >= hunt.capacity
      );
    }

    // Apply duration filter (single night vs multi-day)
    if (durationFilter === "single") {
      filtered = filtered.filter(hunt => {
        const start = new Date(hunt.startDate).toDateString();
        const end = new Date(hunt.endDate).toDateString();
        return start === end;
      });
    } else if (durationFilter === "multi") {
      filtered = filtered.filter(hunt => {
        const start = new Date(hunt.startDate).toDateString();
        const end = new Date(hunt.endDate).toDateString();
        return start !== end;
      });
    }

    // Sort hunts: ongoing first, then upcoming, then past hunts
    return filtered.sort((a, b) => {
      const aStart = new Date(a.startDate);
      const aEnd = new Date(a.endDate);
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);

      const aIsOngoing = now >= aStart && now <= aEnd;
      const bIsOngoing = now >= bStart && now <= bEnd;
      const aIsUpcoming = now < aStart;
      const bIsUpcoming = now < bStart;
      const aIsPast = now > aEnd;
      const bIsPast = now > bEnd;

      // Ongoing hunts at the top
      if (aIsOngoing && !bIsOngoing) return -1;
      if (!aIsOngoing && bIsOngoing) return 1;

      // If both ongoing, sort by start date (earlier first)
      if (aIsOngoing && bIsOngoing) {
        return aStart.getTime() - bStart.getTime();
      }

      // Upcoming hunts in the middle
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;

      // If both upcoming, sort by start date (earlier first)
      if (aIsUpcoming && bIsUpcoming) {
        return aStart.getTime() - bStart.getTime();
      }

      // Past hunts at the bottom
      if (aIsPast && bIsPast) {
        // Sort past hunts by end date (most recent first)
        return bEnd.getTime() - aEnd.getTime();
      }

      return 0;
    });
  };

  const filteredHunts = getFilteredHunts();

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      {/* Tab Navigation - Outside of max-width container for proper sticky behavior */}
      <div className="sticky top-[57px] bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="max-w-2xl mx-auto">
          <div className="p-4">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("hunts")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "hunts"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Hunts
              </button>
              <button
                onClick={() => setActiveTab("my-hunts")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "my-hunts"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                My Hunts
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">

        {/* Hunts Tab */}
        {activeTab === "hunts" && (
          <div className="p-4">
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-semibold mb-2">Search Hunts</h2>
                    <p className="text-sm text-gray-400">
                      Find and join aurora hunting events near you
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      showFilters || hunterName || huntName || searchLocation || startDate || endDate || huntType !== "all" || availability !== "all" || durationFilter !== "all" || huntFilter !== "all"
                        ? "bg-aurora-green text-black"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    <span>Filters</span>
                  </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="bg-white/5 rounded-xl p-4 space-y-4">
                    {/* Hunter Name/Handle Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Hunter Name or Handle
                      </label>
                      <input
                        type="text"
                        value={hunterName}
                        onChange={(e) => setHunterName(e.target.value)}
                        placeholder="Search by name or @handle..."
                        className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        💡 Use <span className="text-aurora-green font-mono">and</span>, <span className="text-aurora-green font-mono">or</span>, <span className="text-aurora-green font-mono">not</span> for advanced search
                        <br />
                        Examples: <span className="font-mono">john and smith</span>, <span className="font-mono">alice or bob</span>, <span className="font-mono">sarah not jones</span>
                      </p>
                    </div>

                    {/* Hunt Name Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Hunt Name
                      </label>
                      <input
                        type="text"
                        value={huntName}
                        onChange={(e) => setHuntName(e.target.value)}
                        placeholder="Search by hunt name..."
                        className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        💡 Use <span className="text-aurora-green font-mono">and</span>, <span className="text-aurora-green font-mono">or</span>, <span className="text-aurora-green font-mono">not</span> for advanced search
                        <br />
                        Examples: <span className="font-mono">northern and lights</span>, <span className="font-mono">iceland or norway</span>, <span className="font-mono">aurora not weekend</span>
                      </p>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Search by Location
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          placeholder="Enter a location..."
                          className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                        />
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Start Date (From)
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          End Date (To)
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-white/10 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-green"
                        />
                      </div>
                    </div>

                    {/* Hunt Type Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Hunt Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setHuntType("all")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            huntType === "all"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setHuntType("free")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            huntType === "free"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Free
                        </button>
                        <button
                          onClick={() => setHuntType("paid")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            huntType === "paid"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Paid
                        </button>
                      </div>
                    </div>

                    {/* Availability Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Availability
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setAvailability("all")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            availability === "all"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setAvailability("available")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            availability === "available"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Available
                        </button>
                        <button
                          onClick={() => setAvailability("full")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            availability === "full"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Full
                        </button>
                      </div>
                    </div>

                    {/* Duration Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Hunt Duration
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setDurationFilter("all")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            durationFilter === "all"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setDurationFilter("single")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            durationFilter === "single"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Single Night
                        </button>
                        <button
                          onClick={() => setDurationFilter("multi")}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            durationFilter === "multi"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Multi-Day
                        </button>
                      </div>
                    </div>

                    {/* Time Period Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Time Period
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() => setHuntFilter("all")}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            huntFilter === "all"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setHuntFilter("upcoming")}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            huntFilter === "upcoming"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Upcoming
                        </button>
                        <button
                          onClick={() => setHuntFilter("ongoing")}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            huntFilter === "ongoing"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Ongoing
                        </button>
                        <button
                          onClick={() => setHuntFilter("past")}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            huntFilter === "past"
                              ? "bg-aurora-green text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          Past Hunts
                        </button>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {(hunterName || huntName || searchLocation || startDate || endDate || huntType !== "all" || availability !== "all" || durationFilter !== "all" || huntFilter !== "all") && (
                      <button
                        onClick={() => {
                          setHuntFilter("all");
                          setHunterName("");
                          setHuntName("");
                          setSearchLocation("");
                          setStartDate("");
                          setEndDate("");
                          setHuntType("all");
                          setAvailability("all");
                          setDurationFilter("all");
                        }}
                        className="w-full bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Hunts List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="py-12">
                    <AuroraLoader size="lg" text="Loading hunts..." />
                  </div>
                ) : filteredHunts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No upcoming hunts. Create the first one!
                  </div>
                ) : (
                  filteredHunts.map((hunt) => {
                    const isFull = hunt.capacity != null && hunt.participants >= hunt.capacity;
                    const now = new Date();
                    const startDate = new Date(hunt.startDate);
                    const endDate = new Date(hunt.endDate);
                    const isOngoing = now >= startDate && now <= endDate;
                    const isCompleted = now > endDate;

                    return <div
                      key={hunt.id}
                      onClick={() => router.push(`/hunts/${hunt.id}`)}
                      className={`bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer border border-white/5 ${
                        isFull ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Cover Image - Full Width */}
                      <div className="w-full h-48 overflow-hidden relative">
                        <img
                          src={hunt.coverImage || "/default-hunt-cover.svg"}
                          alt={hunt.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Availability Ribbon - Top Left Corner */}
                        {!hunt.isPublic ? (
                          <div className="absolute top-0 left-0">
                            <div className="bg-purple-600/95 text-white px-4 py-1 text-xs font-bold backdrop-blur-sm shadow-lg" style={{
                              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%)',
                              minWidth: '120px'
                            }}>
                              INVITE ONLY
                            </div>
                          </div>
                        ) : hunt.capacity != null && hunt.participants >= hunt.capacity ? (
                          <div className="absolute top-0 left-0">
                            <div className="bg-red-600/95 text-white px-4 py-1 text-xs font-bold backdrop-blur-sm shadow-lg" style={{
                              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%)',
                              minWidth: '120px'
                            }}>
                              FULL
                            </div>
                          </div>
                        ) : hunt.capacity != null && hunt.participants < hunt.capacity ? (
                          <div className="absolute top-0 left-0">
                            <div className="bg-aurora-green/95 text-black px-4 py-1 text-xs font-bold backdrop-blur-sm shadow-lg" style={{
                              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%)',
                              minWidth: '120px'
                            }}>
                              SLOTS AVAILABLE
                            </div>
                          </div>
                        ) : null}
                        {/* Status Badges - Overlay on Cover Image */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          {isCompleted && (
                            <span className="bg-gray-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                              COMPLETED
                            </span>
                          )}
                          {isOngoing && (
                            <span className="bg-green-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                              ONGOING
                            </span>
                          )}
                          {isFull && !isCompleted && (
                            <span className="bg-red-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                              FULL
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">

                        {/* Title with Price/Free Badge */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-bold text-lg text-white">{hunt.name}</h3>
                            {!hunt.isPaid && (
                              <span className="bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                                FREE
                              </span>
                            )}
                            {hunt.isPaid && hunt.price && (
                              <span className="bg-aurora-green/20 text-aurora-green px-2.5 py-1 rounded-full text-xs font-semibold">
                                ${hunt.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/pax
                              </span>
                            )}
                          </div>

                          {/* Organizer Info - Moved up */}
                          <div className="flex items-center gap-2">
                            <img
                              src={hunt.user.image || "/default-avatar.png"}
                              alt={hunt.user.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm text-gray-400">
                              Organized by{" "}
                              <span className="text-white font-medium">
                                {session?.user?.id === hunt.user.id ? "You" : hunt.user.name}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {hunt.description && (
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {hunt.description}
                          </p>
                        )}

                        {/* Location, Date, Participants - Stacked on Mobile */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <svg className="w-4 h-4 flex-shrink-0 text-aurora-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">
                              {hunt.location
                                ? (hunt.hideLocation ? formatCountryOnly(hunt.location) : formatLocationWithFlag(hunt.location))
                                : "Location TBD"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <svg className="w-4 h-4 flex-shrink-0 text-aurora-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                              {(() => {
                                // Check if hunt is shorter than 24 hours (same day)
                                const isSameDay = startDate.toDateString() === endDate.toDateString();
                                if (isSameDay) {
                                  // Show time with timezone for short hunts
                                  return formatHuntDate(hunt.startDate, hunt.timezone, "MMM d, h:mm a");
                                } else {
                                  // Show date range for multi-day hunts
                                  return `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`;
                                }
                              })()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <svg className="w-4 h-4 flex-shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium">
                              {hunt.capacity
                                ? `${hunt.participants} / ${hunt.capacity} ${hunt.participants === 1 ? "participant" : "participants"}`
                                : `${hunt.participants} ${hunt.participants === 1 ? "participant" : "participants"}`}
                              {hunt.waitlistCount && hunt.waitlistCount > 0 && (
                                <>, {hunt.waitlistCount} on waitlist</>
                              )}
                            </span>
                          </div>

                          {hunt.successRate !== undefined && (
                            <div className="flex items-center gap-2 text-sm">
                              <svg className={`w-4 h-4 flex-shrink-0 ${parseFloat(hunt.successRate) <= 0 ? 'text-red-500' : 'text-aurora-green'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className={`${parseFloat(hunt.successRate) <= 0 ? 'text-red-500' : 'text-aurora-green'} font-semibold`}>
                                Success Rate: {hunt.successRate}%
                              </span>
                              <span className="text-gray-500">
                                ({hunt.sightingsCount} out of {hunt.huntLengthDays} nights)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Post Sighting or View Shared Album for Completed Hunts (Creator or Participant) */}
                        {isCompleted && session && (session.user?.id === hunt.user.id || hunt.isUserParticipant) && (
                          <>
                            {(hunt.sightingsCount === 0 || hunt.sightingsCount === undefined) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/sightings/new?huntId=${hunt.id}`);
                                }}
                                className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-2.5 px-4 rounded-lg hover:from-green-500 hover:to-blue-600 transition-colors font-medium flex items-center justify-center gap-2 mb-3"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                Post Sighting
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/hunts/${hunt.id}/album`);
                                }}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium flex items-center justify-center gap-2 mb-3"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                View Shared Album
                              </button>
                            )}
                          </>
                        )}

                        {/* View Shared Album Button for Completed Public Hunts (non-participants) */}
                        {isCompleted && hunt.isPublic && session && session.user?.id !== hunt.user.id && !hunt.isUserParticipant && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/hunts/${hunt.id}/album`);
                            }}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium flex items-center justify-center gap-2 mb-3"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            View Shared Album
                          </button>
                        )}

                        {/* Join/Request to Join/Leave Hunt Buttons - Only for non-completed hunts and non-creator */}
                        {!isCompleted && session && session.user?.id !== hunt.user.id && (
                          <>
                            {hunt.isPendingPayment ? (
                              <button
                                disabled
                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2.5 px-4 rounded-lg cursor-not-allowed font-medium opacity-90 flex items-center justify-center gap-2"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Payment Pending
                              </button>
                            ) : hunt.isUserParticipant ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveHunt(hunt.id);
                                }}
                                disabled={joiningHunt === hunt.id}
                                className="w-full bg-red-500/80 text-white py-2.5 px-4 rounded-lg hover:bg-red-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {joiningHunt === hunt.id ? "Leaving..." : "Leave Hunt"}
                              </button>
                            ) : isFull ? (
                              <button
                                disabled
                                className="w-full bg-gray-500/50 text-gray-300 py-2.5 px-4 rounded-lg cursor-not-allowed font-medium"
                              >
                                Hunt Full
                              </button>
                            ) : !hunt.isPublic ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinHunt(hunt.id);
                                }}
                                disabled={joiningHunt === hunt.id}
                                className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {joiningHunt === hunt.id ? "Requesting..." : "Request to Join Hunt"}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinHunt(hunt.id);
                                }}
                                disabled={joiningHunt === hunt.id}
                                className="w-full bg-aurora-green text-black py-2.5 px-4 rounded-lg hover:bg-aurora-green/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {joiningHunt === hunt.id ? "Joining..." : "Join Hunt"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Hunts Tab */}
        {activeTab === "my-hunts" && (
          <div className="p-4">
            {/* Plan Your Hunt Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">Plan Your Hunt</h2>
              <button
                onClick={() => router.push("/createhunt")}
                className="w-full bg-gradient-to-r from-aurora-green to-aurora-blue rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all shadow-lg hover:shadow-xl group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <svg
                        className="w-6 h-6 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-semibold text-black">Create New Hunt</p>
                      <p className="text-sm text-black/70">Start planning your aurora adventure</p>
                    </div>
                  </div>
                  <svg
                    className="w-6 h-6 text-black/70 group-hover:text-black group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            </div>

            {loading ? (
              <div className="py-12">
                <AuroraLoader size="lg" text="Loading your hunts..." />
              </div>
            ) : myHunts.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-gray-400 mb-2">You haven't created any hunts yet</p>
                <button
                  onClick={() => router.push("/createhunt")}
                  className="mt-4 px-6 py-2 bg-aurora-green text-black rounded-lg hover:bg-aurora-green/80 transition-colors"
                >
                  Plan Your First Hunt
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myHunts
                  .sort((a, b) => {
                    const now = new Date();
                    const aStart = new Date(a.startDate);
                    const aEnd = new Date(a.endDate);
                    const bStart = new Date(b.startDate);
                    const bEnd = new Date(b.endDate);

                    const aIsOngoing = now >= aStart && now <= aEnd;
                    const bIsOngoing = now >= bStart && now <= bEnd;
                    const aIsUpcoming = now < aStart;
                    const bIsUpcoming = now < bStart;
                    const aIsCompleted = now > aEnd;
                    const bIsCompleted = now > bEnd;

                    // Ongoing hunts first
                    if (aIsOngoing && !bIsOngoing) return -1;
                    if (!aIsOngoing && bIsOngoing) return 1;

                    // If both ongoing, sort by start date
                    if (aIsOngoing && bIsOngoing) {
                      return aStart.getTime() - bStart.getTime();
                    }

                    // Upcoming hunts second
                    if (aIsUpcoming && !bIsUpcoming) return -1;
                    if (!aIsUpcoming && bIsUpcoming) return 1;

                    // If both upcoming, sort by start date (chronological)
                    if (aIsUpcoming && bIsUpcoming) {
                      return aStart.getTime() - bStart.getTime();
                    }

                    // Completed hunts last
                    if (aIsCompleted && bIsCompleted) {
                      return bEnd.getTime() - aEnd.getTime();
                    }

                    return 0;
                  })
                  .map((hunt) => {
                    const now = new Date();
                    const startDate = new Date(hunt.startDate);
                    const endDate = new Date(hunt.endDate);
                    const isOngoing = now >= startDate && now <= endDate;
                    const isUpcoming = now < startDate;
                    const isCompleted = now > endDate;

                  return (
                  <div
                    key={hunt.id}
                    onClick={() => router.push(`/hunts/${hunt.id}`)}
                    className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
                  >
                    {/* Cover Image - Full Width */}
                    <div className="w-full h-48 overflow-hidden relative">
                      <img
                        src={hunt.coverImage || "/default-hunt-cover.svg"}
                        alt={hunt.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Availability Ribbon - Top Left Corner */}
                      {!hunt.isPublic ? (
                        <div className="absolute top-0 left-0">
                          <div className="bg-purple-600/95 text-white px-4 py-1 text-xs font-bold backdrop-blur-sm shadow-lg" style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%)',
                            minWidth: '120px'
                          }}>
                            INVITE ONLY
                          </div>
                        </div>
                      ) : hunt.capacity != null && hunt.participants >= hunt.capacity ? (
                        <div className="absolute top-0 left-0">
                          <div className="bg-red-600/95 text-white px-4 py-1 text-xs font-bold backdrop-blur-sm shadow-lg" style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%)',
                            minWidth: '120px'
                          }}>
                            FULL
                          </div>
                        </div>
                      ) : hunt.capacity != null && hunt.participants < hunt.capacity ? (
                        <div className="absolute top-0 left-0">
                          <div className="bg-aurora-green/95 text-black px-4 py-1 text-xs font-bold backdrop-blur-sm shadow-lg" style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%)',
                            minWidth: '120px'
                          }}>
                            SLOTS AVAILABLE
                          </div>
                        </div>
                      ) : null}
                      {/* Status Badges - Overlay on Cover Image */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {isOngoing && (
                          <span className="bg-green-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                            ONGOING
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="bg-blue-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                            UPCOMING
                          </span>
                        )}
                        {isCompleted && (
                          <span className="bg-gray-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                            COMPLETED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">

                      {/* Title with Price/Free Badge */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-bold text-lg text-white">{hunt.name}</h3>
                          {!hunt.isPaid && (
                            <span className="bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                              FREE
                            </span>
                          )}
                          {hunt.isPaid && hunt.price && (
                            <span className="bg-aurora-green/20 text-aurora-green px-2.5 py-1 rounded-full text-xs font-semibold">
                              ${hunt.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/pax
                            </span>
                          )}
                        </div>

                        {/* Organizer Info - Moved up */}
                        <div className="flex items-center gap-2">
                          <img
                            src={hunt.user.image || "/default-avatar.png"}
                            alt={hunt.user.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-400">
                            Organized by{" "}
                            <span className="text-white font-medium">
                              {hunt.isCreator ? "You" : hunt.user.name}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {hunt.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {hunt.description}
                        </p>
                      )}

                      {/* Location, Date, Participants - Stacked on Mobile */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <svg className="w-4 h-4 flex-shrink-0 text-aurora-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">
                            {hunt.location
                              ? (hunt.hideLocation ? formatCountryOnly(hunt.location) : formatLocationWithFlag(hunt.location))
                              : "Location TBD"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <svg className="w-4 h-4 flex-shrink-0 text-aurora-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">
                            {format(startDate, "dd MMM yyyy")}
                            {hunt.endDate && ` - ${format(endDate, "dd MMM yyyy")}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <svg className="w-4 h-4 flex-shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="font-medium">
                            {hunt.capacity
                              ? `${hunt.participants} / ${hunt.capacity} ${hunt.participants === 1 ? "participant" : "participants"}`
                              : `${hunt.participants} ${hunt.participants === 1 ? "participant" : "participants"}`}
                            {hunt.waitlistCount && hunt.waitlistCount > 0 && (
                              <>, {hunt.waitlistCount} on waitlist</>
                            )}
                          </span>
                        </div>

                        {isCompleted && hunt.successRate !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className={`w-4 h-4 flex-shrink-0 ${parseFloat(hunt.successRate) <= 0 ? 'text-red-500' : 'text-aurora-green'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={`${parseFloat(hunt.successRate) <= 0 ? 'text-red-500' : 'text-aurora-green'} font-semibold`}>
                              Success Rate: {hunt.successRate}%
                            </span>
                            <span className="text-gray-500">
                              ({hunt.sightingsCount} out of {hunt.huntLengthDays} nights)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-white/10">
                        {hunt.isCreator ? (
                          <>
                            {!isCompleted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/hunts/${hunt.id}/edit`);
                                }}
                                className="flex-1 py-2.5 px-4 bg-aurora-blue text-black rounded-lg hover:bg-aurora-blue/80 transition-colors font-medium"
                              >
                                Edit
                              </button>
                            )}
                            {/* Show "Post Sighting" for completed hunts with no sightings, otherwise "View Shared Album" */}
                            {isCompleted && (hunt.sightingsCount === 0 || hunt.sightingsCount === undefined) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/sightings/new?huntId=${hunt.id}`);
                                }}
                                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg hover:from-green-500 hover:to-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                Post Sighting
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/hunts/${hunt.id}/album`);
                                }}
                                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                View Shared Album
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Show "Post Sighting" for completed hunts with no sightings, otherwise "View Shared Album" */}
                            {isCompleted && (hunt.sightingsCount === 0 || hunt.sightingsCount === undefined) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/sightings/new?huntId=${hunt.id}`);
                                }}
                                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg hover:from-green-500 hover:to-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                Post Sighting
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/hunts/${hunt.id}/album`);
                                }}
                                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                View Shared Album
                              </button>
                            )}
                            {!isCompleted && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(`/api/hunts/${hunt.id}/leave`, {
                                      method: "POST",
                                    });
                                    if (response.ok) {
                                      fetchMyHunts();
                                    }
                                  } catch (error) {
                                    console.error("Error leaving hunt:", error);
                                  }
                                }}
                                className="flex-1 py-2.5 px-4 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
                              >
                                Leave Hunt
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
