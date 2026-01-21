"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow, format } from "date-fns";
import TimeHeader from "@/components/TimeHeader";
import ChatFilters from "@/components/ChatFilters";
import { useRouter, useSearchParams } from "next/navigation";

interface Chat {
  id: string;
  name: string;
  description: string;
  groupType: string;
  visibility: string;
  areaName: string;
  countryCode: string;
  countryName: string;
  isVerified: boolean;
  avatarUrl: string | null;
  memberCount: number;
  messageCount: number;
  businessCategory: string | null;
  requireApproval: boolean;
  memberLimit: number | null;
  owner: {
    id: string;
    name: string;
    image: string;
    businessName: string | null;
    businessCategory: string | null;
  } | null;

  // For My Chats
  unreadCount?: number;
  role?: string;
  joinedAt?: string;
  lastReadAt?: string | null;
  lastMessage?: {
    id: string;
    content: string;
    messageType: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      image: string;
    };
  } | null;

  // Hunt-specific fields
  hunt?: {
    id: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'ongoing' | 'completed';
  } | null;

  // For Discover
  isMember?: boolean;
  memberRole?: string | null;
  memberStatus?: string | null;
}

interface BusinessProfile {
  type: 'business';
  ownerId: string;
  businessName: string;
  businessCategory: string;
  businessServices: string[];
  areaName: string;
  countryCode: string;
  countryName: string;
  isVerified: boolean;
  owner: {
    id: string;
    name: string;
    image: string;
    businessName: string | null;
    businessCategory: string | null;
  };
  publicChat: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    messageCount: number;
    requireApproval: boolean;
    isMember: boolean;
    memberRole: string | null;
    memberStatus: string | null;
  } | null;
  privateChat: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    messageCount: number;
    requireApproval: boolean;
    isMember: boolean;
    memberRole: string | null;
    memberStatus: string | null;
  } | null;
}

type DiscoverItem = (Chat & { type: 'area' }) | BusinessProfile;

interface GroupedItems {
  [areaName: string]: DiscoverItem[];
}

type TabType = "my-chats" | "discover";

export default function ChatsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(
    (tabParam === 'discover' ? 'discover' : 'my-chats')
  );
  const [myChats, setMyChats] = useState<Chat[]>([]);
  const [discoverItems, setDiscoverItems] = useState<DiscoverItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
  const [loading, setLoading] = useState(true);
  const [joiningChat, setJoiningChat] = useState<string | null>(null);

  // Shared filter state for both tabs
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [chatTypeFilter, setChatTypeFilter] = useState<"all" | "hunt" | "area" | "business" | "direct">("all");

  // Hunt-specific filters
  const [huntStatusFilter, setHuntStatusFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");

  // Location filters (for area chats)
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  // Business category filter
  const [businessCategoryFilter, setBusinessCategoryFilter] = useState<string>("all");

  // Direct message username search
  const [usernameSearch, setUsernameSearch] = useState("");

  // Fetch my chats
  useEffect(() => {
    if (activeTab === "my-chats") {
      setLoading(true);
      fetch("/api/chats/my-chats")
        .then(async (res) => {
          if (res.status === 401) {
            // User is not authenticated, return empty array
            return [];
          }
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setMyChats(data);
          } else {
            console.error("API returned non-array data:", data);
            setMyChats([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching my chats:", error);
          setMyChats([]);
          setLoading(false);
        });
    }
  }, [activeTab]);

  // Fetch discover chats
  useEffect(() => {
    if (activeTab === "discover") {
      setLoading(true);
      const params = new URLSearchParams({
        country: countryFilter !== "all" ? countryFilter : "FI", // Default to Finland
      });
      if (searchQuery) params.append("search", searchQuery);
      if (businessCategoryFilter && businessCategoryFilter !== "all") {
        params.append("category", businessCategoryFilter);
      }

      fetch(`/api/chats/discover?${params.toString()}`)
        .then(async (res) => {
          if (res.status === 401) {
            // User is not authenticated, return empty data
            return { items: [], groupedByArea: {} };
          }
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.items && Array.isArray(data.items)) {
            setDiscoverItems(data.items);
            setGroupedItems(data.groupedByArea || {});
          } else {
            console.error("API returned unexpected data:", data);
            setDiscoverItems([]);
            setGroupedItems({});
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching discover items:", error);
          setDiscoverItems([]);
          setGroupedItems({});
          setLoading(false);
        });
    }
  }, [activeTab, searchQuery, countryFilter, businessCategoryFilter]);

  const handleJoinChat = async (chatId: string) => {
    setJoiningChat(chatId);
    try {
      const res = await fetch(`/api/chats/${chatId}/join`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requiresApproval) {
          alert("Join request submitted! The business owner will review your request.");
        } else {
          alert("Successfully joined the chat!");
          // Refresh the discover list
          setActiveTab("discover");
        }
      } else {
        alert(data.error || "Failed to join chat");
      }
    } catch (error) {
      console.error("Error joining chat:", error);
      alert("Failed to join chat");
    } finally {
      setJoiningChat(null);
    }
  };

  const getChatIcon = (chat: Chat) => {
    // Hunt chat icon
    if (chat.groupType === "hunt") {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>
      );
    }

    // Area chat icon
    if (chat.groupType === "area") {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aurora-green to-aurora-blue flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      );
    }

    // Business chat - use logo with VIP star if verified AND private
    if (chat.groupType === "business_public" || chat.groupType === "business_private") {
      const logoUrl = chat.avatarUrl || chat.owner?.image;
      const isVIP = chat.isVerified && chat.groupType === "business_private";

      return (
        <div className="relative w-12 h-12 flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={chat.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          {/* VIP Star Badge */}
          {isVIP && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-[#0a0e17]">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
        </div>
      );
    }

    // Direct message or other - use avatar if available
    if (chat.avatarUrl) {
      return (
        <img
          src={chat.avatarUrl}
          alt={chat.name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
      );
    }

    // Default fallback icon
    return (
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    );
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;

    const categoryColors: Record<string, string> = {
      accommodation: "bg-blue-500/20 text-blue-400",
      tour_operator: "bg-green-500/20 text-green-400",
      photography: "bg-purple-500/20 text-purple-400",
      restaurant: "bg-orange-500/20 text-orange-400",
      shop: "bg-pink-500/20 text-pink-400",
      other: "bg-gray-500/20 text-gray-400",
    };

    const categoryLabels: Record<string, string> = {
      accommodation: "Accommodation",
      tour_operator: "Tour Operator",
      photography: "Photography",
      restaurant: "Restaurant",
      shop: "Shop",
      other: "Other",
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[category] || categoryColors.other}`}>
        {categoryLabels[category] || category}
      </span>
    );
  };

  const getHuntStatusBadge = (status: 'upcoming' | 'ongoing' | 'completed') => {
    const statusConfig = {
      upcoming: { bg: 'bg-blue-500/90', text: 'text-white', label: 'UPCOMING' },
      ongoing: { bg: 'bg-green-500/90', text: 'text-white', label: 'ONGOING' },
      completed: { bg: 'bg-gray-500/90', text: 'text-white', label: 'COMPLETED' },
    };

    const config = statusConfig[status];
    return (
      <span className={`${config.bg} ${config.text} px-2 py-0.5 rounded text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  const formatHuntDates = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatStr = "MMM d, yyyy";

    if (start.toDateString() === end.toDateString()) {
      return format(start, formatStr);
    }
    return `${format(start, formatStr)} - ${format(end, formatStr)}`;
  };

  // Get available cities based on selected country
  const getCitiesForCountry = (country: string): string[] => {
    const citiesMap: Record<string, string[]> = {
      FI: ["Helsinki", "Rovaniemi", "Inari", "Kittilä", "Saariselkä", "Levi", "Utsjoki"],
      NO: ["Oslo", "Tromsø", "Alta", "Bodø", "Svalbard", "Lyngen"],
      SE: ["Stockholm", "Kiruna", "Abisko", "Jukkasjärvi", "Luleå"],
    };
    return citiesMap[country] || [];
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setChatTypeFilter("all");
    setHuntStatusFilter("all");
    setCountryFilter("all");
    setCityFilter("all");
    setBusinessCategoryFilter("all");
    setUsernameSearch("");
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      searchQuery.trim() !== "" ||
      chatTypeFilter !== "all" ||
      huntStatusFilter !== "all" ||
      countryFilter !== "all" ||
      cityFilter !== "all" ||
      businessCategoryFilter !== "all" ||
      usernameSearch.trim() !== ""
    );
  };

  // Filter my chats
  const getFilteredMyChats = () => {
    let filtered = myChats;

    // Search filter
    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(search) ||
        chat.description?.toLowerCase().includes(search) ||
        chat.areaName?.toLowerCase().includes(search) ||
        chat.owner?.name?.toLowerCase().includes(search) ||
        chat.owner?.businessName?.toLowerCase().includes(search)
      );
    }

    // Chat type filter
    if (chatTypeFilter !== "all") {
      filtered = filtered.filter(chat => {
        if (chatTypeFilter === "hunt") return chat.groupType === "hunt";
        if (chatTypeFilter === "area") return chat.groupType === "area";
        if (chatTypeFilter === "business") return chat.groupType === "business_public" || chat.groupType === "business_private";
        if (chatTypeFilter === "direct") return chat.groupType === "direct_message";
        return true;
      });
    }

    // Hunt status filter (only applies to hunt chats)
    if (huntStatusFilter !== "all") {
      filtered = filtered.filter(chat => {
        if (chat.groupType !== "hunt" || !chat.hunt) return false;
        return chat.hunt.status === huntStatusFilter;
      });
    }

    // Country filter (for area and business chats)
    if (countryFilter !== "all") {
      filtered = filtered.filter(chat => chat.countryCode === countryFilter);
    }

    // City filter (for area chats)
    if (cityFilter !== "all") {
      filtered = filtered.filter(chat => chat.areaName === cityFilter);
    }

    // Business category filter
    if (businessCategoryFilter !== "all") {
      filtered = filtered.filter(chat => chat.businessCategory === businessCategoryFilter);
    }

    // Username search (for direct messages)
    if (usernameSearch.trim() && chatTypeFilter === "direct") {
      const search = usernameSearch.toLowerCase();
      filtered = filtered.filter(chat =>
        chat.owner?.name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const filteredMyChats = getFilteredMyChats();

  // Loading animation
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] pb-24">
        <TimeHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="flex flex-col items-center gap-6">
            {/* Aurora Shimmer Animation */}
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 border-r-green-500 animate-spin" style={{ animationDuration: '2.5s' }}></div>
              <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-blue-400 border-r-blue-500 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-6 rounded-full border-4 border-transparent border-t-purple-400 border-r-purple-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
              <div className="absolute inset-9 rounded-full bg-gradient-to-br from-green-400/20 via-blue-400/20 to-purple-400/20 animate-pulse flex items-center justify-center">
                <svg className="w-12 h-12 text-green-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>

            {/* Text with gradient */}
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Loading Chats
              </div>
              <div className="text-sm text-gray-400 animate-pulse" style={{ animationDelay: '0.3s' }}>
                Connecting you with the community...
              </div>
            </div>

            {/* Dancing aurora particles */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0s', animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.45s', animationDuration: '1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-green-300 animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      {/* Tab Navigation */}
      <div className="sticky top-[45px] bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="max-w-2xl mx-auto">
          <div className="p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("my-chats")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "my-chats"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                My Chats
              </button>
              <button
                onClick={() => setActiveTab("discover")}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === "discover"
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Discover
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* My Chats Tab */}
        {activeTab === "my-chats" && (
          <div className="p-4">
            {/* Search and Filters */}
            {myChats.length > 0 && (
              <ChatFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                chatTypeFilter={chatTypeFilter}
                setChatTypeFilter={setChatTypeFilter}
                huntStatusFilter={huntStatusFilter}
                setHuntStatusFilter={setHuntStatusFilter}
                countryFilter={countryFilter}
                setCountryFilter={setCountryFilter}
                cityFilter={cityFilter}
                setCityFilter={setCityFilter}
                businessCategoryFilter={businessCategoryFilter}
                setBusinessCategoryFilter={setBusinessCategoryFilter}
                usernameSearch={usernameSearch}
                setUsernameSearch={setUsernameSearch}
                getCitiesForCountry={getCitiesForCountry}
                clearAllFilters={clearAllFilters}
                hasActiveFilters={hasActiveFilters}
              />
            )}

            {myChats.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No chats yet</h3>
                <p className="text-gray-400 mb-6">Discover and join chats to start connecting with the community</p>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="px-6 py-2 bg-aurora-green text-black rounded-lg font-semibold hover:bg-aurora-green/80 transition-colors"
                >
                  Discover Chats
                </button>
              </div>
            ) : filteredMyChats.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No chats found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMyChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => router.push(`/chats/${chat.id}`)}
                    className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      {getChatIcon(chat)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white truncate">{chat.name}</h3>
                          {chat.isVerified && (
                            <svg className="w-4 h-4 text-aurora-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {chat.visibility === "private" && (
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                          {chat.hunt && getHuntStatusBadge(chat.hunt.status)}
                        </div>

                        {/* Hunt Dates */}
                        {chat.hunt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatHuntDates(chat.hunt.startDate, chat.hunt.endDate)}
                          </p>
                        )}

                        {chat.lastMessage ? (
                          <p className="text-sm text-gray-400 truncate mt-1">
                            {chat.lastMessage.user.name}: {chat.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic mt-1">No messages yet</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{chat.areaName}</span>
                          {chat.businessCategory && getCategoryBadge(chat.businessCategory)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                        {(chat.unreadCount ?? 0) > 0 && (
                          <div className="bg-aurora-green text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {(chat.unreadCount ?? 0) > 9 ? "9+" : chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === "discover" && (
          <div className="p-4">
            {/* Search and Filters */}
            <ChatFilters
              context="discover"
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              chatTypeFilter={chatTypeFilter}
              setChatTypeFilter={setChatTypeFilter}
              huntStatusFilter={huntStatusFilter}
              setHuntStatusFilter={setHuntStatusFilter}
              countryFilter={countryFilter}
              setCountryFilter={setCountryFilter}
              cityFilter={cityFilter}
              setCityFilter={setCityFilter}
              businessCategoryFilter={businessCategoryFilter}
              setBusinessCategoryFilter={setBusinessCategoryFilter}
              usernameSearch={usernameSearch}
              setUsernameSearch={setUsernameSearch}
              getCitiesForCountry={getCitiesForCountry}
              clearAllFilters={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* Grouped Items by Area */}
            {Object.entries(groupedItems).length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No chats found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([areaName, items]) => (
                  <div key={areaName}>
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-aurora-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {areaName}
                    </h2>
                    <div className="space-y-2">
                      {items.map((item) => {
                        // Render Business Profile Card
                        if (item.type === 'business') {
                          const totalMembers = (item.publicChat?.memberCount || 0) + (item.privateChat?.memberCount || 0);
                          const totalMessages = (item.publicChat?.messageCount || 0) + (item.privateChat?.messageCount || 0);

                          return (
                            <div
                              key={item.ownerId}
                              onClick={() => router.push(`/businesses/${item.ownerId}`)}
                              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-white">{item.businessName}</h3>
                                    {item.isVerified && (
                                      <svg className="w-4 h-4 text-aurora-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-400 mb-2">
                                    {item.publicChat?.description || item.privateChat?.description}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                      </svg>
                                      {totalMembers} members
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                      {totalMessages} messages
                                    </span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {(item.businessServices && item.businessServices.length > 0) ? (
                                      item.businessServices.map((service) => (
                                        <span key={service}>
                                          {getCategoryBadge(service)}
                                        </span>
                                      ))
                                    ) : (
                                      getCategoryBadge(item.businessCategory)
                                    )}
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Render Area Chat Card (existing logic)
                        const chat = item as Chat & { type: 'area' };
                        return (
                          <div
                            key={chat.id}
                            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {getChatIcon(chat)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-white">{chat.name}</h3>
                                  {chat.isVerified && (
                                    <svg className="w-4 h-4 text-aurora-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                {chat.description && (
                                  <p className="text-sm text-gray-400 mb-2">{chat.description}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {chat.memberCount} members
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {chat.messageCount} messages
                                  </span>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {chat.isMember ? (
                                  <button
                                    onClick={() => router.push(`/chats/${chat.id}`)}
                                    className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                                  >
                                    Open
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleJoinChat(chat.id)}
                                    disabled={joiningChat === chat.id}
                                    className="px-4 py-2 bg-aurora-green text-black rounded-lg text-sm font-semibold hover:bg-aurora-green/80 transition-colors disabled:opacity-50"
                                  >
                                    {joiningChat === chat.id ? "Joining..." : chat.requireApproval ? "Request" : "Join"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
