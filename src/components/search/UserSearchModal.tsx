"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  image: string;
  bio: string | null;
  successRate: number;
  isFollowing: boolean;
  followers: number;
  sightings: number;
  hunts: number;
  cityBadges: Array<{
    city: string;
    country: string;
    countryCode: string;
  }>;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [searchMinSuccess, setSearchMinSuccess] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (searchCity.trim()) params.append("city", searchCity.trim());
      if (searchCountry.trim()) params.append("country", searchCountry.trim());
      if (searchMinSuccess.trim()) params.append("minSuccessRate", searchMinSuccess.trim());

      const response = await fetch(`/api/users/search?${params.toString()}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });

      if (response.ok) {
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === userId
              ? { ...user, isFollowing: true, followers: user.followers + 1 }
              : user
          )
        );
        toast.success("Following user!");
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === userId
              ? { ...user, isFollowing: false, followers: user.followers - 1 }
              : user
          )
        );
        toast.success("Unfollowed user");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0e17] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Search Aurora Hunters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Filters */}
        <div className="p-6 border-b border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or username"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
            />
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="City"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
            />
            <input
              type="text"
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              placeholder="Country"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
            />
            <input
              type="number"
              value={searchMinSuccess}
              onChange={(e) => setSearchMinSuccess(e.target.value)}
              placeholder="Min success rate %"
              min="0"
              max="100"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="w-full px-6 py-3 bg-aurora-green hover:bg-aurora-green/80 disabled:bg-gray-600 text-black font-semibold rounded-lg transition-colors"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searching ? "Searching..." : "Search for aurora hunters to follow"}
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      onClick={() => {
                        onClose();
                        router.push(`/profile/${user.username || user.id}`);
                      }}
                      className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer flex-shrink-0"
                    >
                      {user.image ? (
                        <Image src={user.image} alt={user.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-aurora-blue to-aurora-green flex items-center justify-center text-white text-xl font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        onClick={() => {
                          onClose();
                          router.push(`/profile/${user.username || user.id}`);
                        }}
                        className="cursor-pointer"
                      >
                        <h3 className="font-bold text-white hover:text-aurora-green transition-colors">
                          {user.name}
                        </h3>
                        {user.username && (
                          <p className="text-sm text-gray-400">@{user.username}</p>
                        )}
                        {user.bio && (
                          <p className="text-sm text-gray-300 mt-1 line-clamp-2">{user.bio}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-400">
                          <span className="text-white font-semibold">{user.sightings}</span> sightings
                        </span>
                        <span className="text-gray-400">
                          <span className="text-white font-semibold">{user.hunts}</span> hunts
                        </span>
                        <span className="text-gray-400">
                          <span className="text-white font-semibold">{user.followers}</span> followers
                        </span>
                        {user.successRate > 0 && (
                          <span className="text-aurora-green font-semibold">
                            {user.successRate.toFixed(1)}% success
                          </span>
                        )}
                      </div>

                      {user.cityBadges.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {user.cityBadges.slice(0, 3).map((badge, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-white/10 px-2 py-1 rounded-full flex items-center gap-1"
                            >
                              <span>{getCountryFlag(badge.countryCode)}</span>
                              <span className="text-white">{badge.city}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => (user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id))}
                      className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                        user.isFollowing
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-aurora-green hover:bg-aurora-green/80 text-black"
                      }`}
                    >
                      {user.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
