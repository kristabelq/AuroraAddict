"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatDistanceToNow, format } from "date-fns";
import { formatLocationWithFlag, formatSightingLocation } from "@/utils/location";
import UserSearchModal from "@/components/search/UserSearchModal";
import FollowingModal from "@/components/profile/FollowingModal";
import FollowersModal from "@/components/profile/FollowersModal";
import { getCountryCode, getCountryFlag, getCountryName } from "@/utils/countryUtils";

interface Sighting {
  id: string;
  caption: string | null;
  images: string[];
  videos: string[];
  sightingType: string;
  location: string;
  sightingDate?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string;
    username: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
}

interface HuntMissingSighting {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  email: string;
  image: string;
  bio: string;
  instagram: string | null;
  whatsappNumber: string | null;
  publicEmail: string | null;
  sightingsCount: number; // Unique days with dated sightings
  postsCount: number; // Total number of sightings posted
  huntsCount: number;
  huntsParticipatedCount: number;
  completedHuntsCount: number; // NEW: Completed hunts only
  followersCount: number;
  followingCount: number;
  averageSuccessRate: number; // Only from COMPLETED hunts
  huntsMissingSightings: HuntMissingSighting[]; // NEW: For reminder banner
  sightings: Sighting[];
}

interface CityBadge {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  earnedAt: string;
}

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

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<CityBadge[]>([]);
  const [showFeedView, setShowFeedView] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [editCaptionText, setEditCaptionText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Search states
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [searchMinSuccess, setSearchMinSuccess] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Following modal state
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
      fetchBadges();
    }
  }, [session?.user?.id]);

  const fetchProfile = async () => {
    try {
      console.log("[Profile] Fetching profile data...");
      const response = await fetch("/api/user/profile");
      console.log("[Profile] Response status:", response.status);
      const data = await response.json();
      console.log("[Profile] Profile data received:", data);
      console.log("[Profile] huntsMissingSightings:", data.huntsMissingSightings);
      setProfile(data);
      console.log("[Profile] Profile state updated successfully");
    } catch (error) {
      console.error("[Profile] Error fetching profile:", error);
    }
  };

  const fetchBadges = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/user/${session.user.id}/badges`);
      const data = await response.json();
      setBadges(data);
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const handleShareProfile = async () => {
    if (!profile) return;

    const url = `${window.location.origin}/profile/${profile.username || profile.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.name || "My"} Profile`,
          text: "Check out my aurora hunting profile!",
          url: url,
        });
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied to clipboard!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Failed to share. Please try again.");
      }
    }
  };

  const handleEditSighting = (sighting: Sighting) => {
    setEditingCaption(sighting.id);
    setEditCaptionText(sighting.caption || "");
    setShowMenu(null);
  };

  const handleSaveEdit = async (sightingId: string) => {
    if (!profile) return;

    try {
      const res = await fetch(`/api/sightings/${sightingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaptionText }),
      });

      if (res.ok) {
        const updatedSighting = await res.json();
        setProfile({
          ...profile,
          sightings: profile.sightings.map(s =>
            s.id === sightingId ? { ...s, caption: updatedSighting.caption } : s
          )
        });
        setEditingCaption(null);
        setEditCaptionText("");
        toast.success("Caption updated successfully!");
      }
    } catch (error) {
      console.error("Error updating sighting:", error);
      toast.error("Failed to update caption");
    }
  };

  const handleCancelEdit = () => {
    setEditingCaption(null);
    setEditCaptionText("");
  };

  const handleDeleteSighting = async (sightingId: string) => {
    if (!profile) return;

    try {
      const res = await fetch(`/api/sightings/${sightingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProfile({
          ...profile,
          sightings: profile.sightings.filter(s => s.id !== sightingId)
        });
        setShowDeleteConfirm(null);
        setShowMenu(null);
        setShowFeedView(false);
        toast.success("Post deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting sighting:", error);
      toast.error("Failed to delete post");
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-t-aurora-green border-r-aurora-blue border-b-aurora-purple border-l-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-gray-300 text-lg font-medium animate-pulse">
            Accessing Aurora Addicts Classified Archive
          </div>
          <div className="text-gray-500 text-sm">
            ✨ Unfreezing history of magnetic mischief ✨
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            {profile.username ? `@${profile.username}` : profile.name}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Search users"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleShareProfile}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Share profile"
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Hunts Missing Sightings Reminder Banner */}
        {profile.huntsMissingSightings && profile.huntsMissingSightings.length > 0 && (
          <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-xl p-5 mb-6 border-2 border-amber-500/40">
            <div className="flex items-start gap-3">
              <span className="text-3xl">📸</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  Post Sightings to Update Your Success Rate!
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  You have {profile.huntsMissingSightings.length} completed {profile.huntsMissingSightings.length === 1 ? 'hunt' : 'hunts'} without sightings.
                  Adding photos will improve the accuracy of your success rate.
                </p>
                <div className="space-y-2">
                  {profile.huntsMissingSightings.map((hunt) => (
                    <button
                      key={hunt.id}
                      onClick={() => router.push(`/hunts/${hunt.id}`)}
                      className="w-full text-left bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-semibold text-sm">{hunt.name}</div>
                          <div className="text-gray-400 text-xs mt-1">
                            {format(new Date(hunt.startDate), "MMM d")} - {format(new Date(hunt.endDate), "MMM d, yyyy")}
                            {hunt.location && ` • ${hunt.location}`}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6">
          {/* Profile Image and Stats */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
            {/* Profile Image with Handle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-2">
                {profile.image ? (
                  <Image
                    src={profile.image}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-aurora-blue to-aurora-green flex items-center justify-center text-white text-3xl font-bold">
                    {profile.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              {profile.username && (
                <p className="text-sm text-gray-400">@{profile.username}</p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-4 w-full">
              <button
                onClick={() => {
                  document.getElementById('sightings-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-center hover:bg-white/5 rounded-lg py-2 transition-colors"
              >
                <div className="text-2xl font-bold text-white">
                  {profile.sightingsCount}
                </div>
                <div className="text-xs text-gray-400">
                  {profile.sightingsCount <= 1 ? 'Sighting' : 'Sightings'}
                </div>
              </button>
              <button
                onClick={() => router.push('/hunts?tab=my-hunts')}
                className="text-center hover:bg-white/5 rounded-lg py-2 transition-colors"
              >
                <div className="text-2xl font-bold text-white">
                  {profile.completedHuntsCount}
                </div>
                <div className="text-xs text-gray-400">
                  {profile.completedHuntsCount <= 1 ? 'Completed Hunt' : 'Completed Hunts'}
                </div>
              </button>
              <div className="text-center py-2">
                <div className="text-2xl font-bold text-aurora-green">
                  {profile.averageSuccessRate > 0 ? `${profile.averageSuccessRate.toFixed(1)}%` : '-'}
                </div>
                <div className="text-xs text-gray-400">Success Rate</div>
              </div>
              <button
                onClick={() => {
                  document.getElementById('sightings-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-center hover:bg-white/5 rounded-lg py-2 transition-colors"
              >
                <div className="text-2xl font-bold text-white">
                  {profile.postsCount}
                </div>
                <div className="text-xs text-gray-400">
                  {profile.postsCount <= 1 ? 'Post' : 'Posts'}
                </div>
              </button>
              <button
                onClick={() => setShowFollowers(true)}
                className="text-center hover:bg-white/5 rounded-lg py-2 transition-colors"
              >
                <div className="text-2xl font-bold text-white">
                  {profile.followersCount}
                </div>
                <div className="text-xs text-gray-400">
                  {profile.followersCount <= 1 ? 'Follower' : 'Followers'}
                </div>
              </button>
              <button
                onClick={() => setShowFollowing(true)}
                className="text-center hover:bg-white/5 rounded-lg py-2 transition-colors"
              >
                <div className="text-2xl font-bold text-white">
                  {profile.followingCount}
                </div>
                <div className="text-xs text-gray-400">Following</div>
              </button>
            </div>
          </div>

          {/* Name and Bio */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              {/* Social/Contact Icons */}
              <div className="flex items-center gap-2">
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title={`@${profile.instagram} on Instagram`}
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {profile.whatsappNumber && (
                  <a
                    href={`https://wa.me/${profile.whatsappNumber}?text=${encodeURIComponent("Hi! I found your profile on Aurora Addict.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Contact via WhatsApp"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                )}
                {profile.publicEmail && (
                  <a
                    href={`mailto:${profile.publicEmail}`}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title={`Email ${profile.publicEmail}`}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/profile/edit")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={handleShareProfile}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Share Profile
            </button>
          </div>
        </div>

        {/* City Badges Section */}
        {badges.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4">City Badges</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-4xl mb-2">
                    {getCountryFlag(badge.countryCode)}
                  </div>
                  <div className="text-white font-medium text-sm">
                    {badge.city}
                  </div>
                  <div className="text-gray-400 text-xs">{badge.country}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Country Highlights */}
        {profile.sightings && profile.sightings.length > 0 && (() => {
          // Extract unique countries from sightings
          const countriesMap = new Map<string, { name: string; flag: string; image: string }>();

          profile.sightings.forEach(sighting => {
            if (sighting.location && sighting.images && sighting.images.length > 0) {
              const countryCode = getCountryCode(sighting.location);
              if (countryCode && !countriesMap.has(countryCode)) {
                countriesMap.set(countryCode, {
                  name: getCountryName(countryCode),
                  flag: getCountryFlag(countryCode),
                  image: sighting.images[0], // Use first image as representative
                });
              }
            }
          });

          const countries = Array.from(countriesMap.entries());

          if (countries.length === 0) return null;

          return (
            <div className="mb-6">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 px-4 pt-2 scrollbar-hide">
                {/* "All" highlight */}
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="flex flex-col items-center flex-shrink-0 group"
                >
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center overflow-hidden transition-all ${
                      selectedCountry === null
                        ? "ring-4 ring-aurora-green"
                        : "ring-2 ring-gray-600 group-hover:ring-gray-500"
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-aurora-green to-aurora-blue flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs text-white mt-2 font-medium">All</span>
                </button>

                {/* Country highlights */}
                {countries.map(([code, data]) => (
                  <button
                    key={code}
                    onClick={() => setSelectedCountry(code)}
                    className="flex flex-col items-center flex-shrink-0 group"
                  >
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden transition-all ${
                        selectedCountry === code
                          ? "ring-4 ring-aurora-green"
                          : "ring-2 ring-gray-600 group-hover:ring-gray-500"
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={data.image}
                          alt={data.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-xs text-white mt-2 max-w-[80px] truncate font-medium">
                      {data.flag} {data.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Sightings Grid */}
        <div id="sightings-section" className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {selectedCountry ? `Sightings in ${getCountryName(selectedCountry)}` : 'Sightings'}
          </h2>

          {profile.sightings && profile.sightings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {profile.sightings
                .filter((sighting) => {
                  // Filter by images
                  if (!sighting.images || sighting.images.length === 0) return false;

                  // Filter by country if selected
                  if (selectedCountry) {
                    if (!sighting.location) return false;
                    const countryCode = getCountryCode(sighting.location);
                    return countryCode === selectedCountry;
                  }

                  return true;
                })
                .flatMap((sighting) =>
                  sighting.images.map((image, imgIndex) => ({
                    image,
                    sighting,
                    imgIndex
                  }))
                ).map((item, index) => (
                <div
                  key={`${item.sighting.id}-${item.imgIndex}`}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setShowFeedView(true);
                  }}
                  className="relative aspect-square cursor-pointer overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={item.image}
                    alt={item.sighting.caption || "Aurora sighting"}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : selectedCountry ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                No sightings from {getCountryName(selectedCountry)} yet
              </p>
              <button
                onClick={() => setSelectedCountry(null)}
                className="text-aurora-green hover:text-aurora-blue transition-colors text-sm"
              >
                View all sightings
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No sightings yet
            </div>
          )}
        </div>

        {/* Feed View Modal */}
        {showFeedView && profile && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setShowFeedView(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation buttons */}
            {selectedImageIndex > 0 && (
              <button
                onClick={() => setSelectedImageIndex(prev => prev - 1)}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {profile.sightings && selectedImageIndex < profile.sightings.filter(s => s.images && s.images.length > 0).flatMap(s => s.images).length - 1 && (
              <button
                onClick={() => setSelectedImageIndex(prev => prev + 1)}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Content */}
            <div className="max-w-6xl w-full h-full flex items-center justify-center p-4">
              {(() => {
                if (!profile.sightings) return null;

                const allImages = profile.sightings
                  .filter((sighting) => sighting.images && sighting.images.length > 0)
                  .flatMap((sighting) =>
                    sighting.images.map((image, imgIndex) => ({
                      image,
                      sighting,
                      imgIndex
                    }))
                  );
                const currentItem = allImages[selectedImageIndex];
                if (!currentItem) return null;

                return (
                  <div className="w-full max-h-full flex flex-col md:flex-row gap-0 bg-black overflow-hidden">
                    {/* Image */}
                    <div className="flex-1 relative flex items-center justify-center bg-black">
                      <img
                        src={currentItem.image}
                        alt={currentItem.sighting.caption || "Aurora sighting"}
                        className="max-h-[80vh] max-w-full object-contain"
                      />
                    </div>

                    {/* Sidebar with details */}
                    <div className="w-full md:w-96 bg-[#0a0e17] flex flex-col max-h-[80vh]">
                      {/* User Info */}
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <img
                            src={currentItem.sighting.user.image || "/default-avatar.png"}
                            alt={currentItem.sighting.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-white">
                              {currentItem.sighting.user.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(currentItem.sighting.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                          {/* Menu button - only show for user's own posts */}
                          {session?.user?.id === currentItem.sighting.user.id && (
                            <div className="relative">
                              <button
                                onClick={() => setShowMenu(showMenu === currentItem.sighting.id ? null : currentItem.sighting.id)}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                </svg>
                              </button>
                              {/* Dropdown menu */}
                              {showMenu === currentItem.sighting.id && (
                                <div className="absolute right-0 mt-2 w-32 bg-[#1a1f2e] rounded-lg shadow-lg border border-white/10 z-10">
                                  <button
                                    onClick={() => handleEditSighting(currentItem.sighting)}
                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded-t-lg transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowDeleteConfirm(currentItem.sighting.id);
                                      setShowMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 rounded-b-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Caption and Location */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {editingCaption === currentItem.sighting.id ? (
                          <div className="mb-3">
                            <textarea
                              value={editCaptionText}
                              onChange={(e) => setEditCaptionText(e.target.value)}
                              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                              rows={3}
                              placeholder="Write a caption..."
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveEdit(currentItem.sighting.id)}
                                className="px-4 py-1.5 bg-aurora-green text-black rounded-lg text-sm font-semibold hover:bg-aurora-green/80 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-1.5 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {currentItem.sighting.caption ? (
                              <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">
                                {currentItem.sighting.caption}
                              </p>
                            ) : (
                              <p className="text-gray-500 text-sm italic mb-3">No caption</p>
                            )}
                          </>
                        )}
                        {(currentItem.sighting.location || currentItem.sighting.sightingDate) && (
                          <p className="text-gray-400 text-sm">
                            {currentItem.sighting.location && currentItem.sighting.sightingDate ? (
                              `${formatSightingLocation(currentItem.sighting.location)} on ${format(new Date(currentItem.sighting.sightingDate), "dd MMM yyyy")}`
                            ) : currentItem.sighting.location ? (
                              formatSightingLocation(currentItem.sighting.location)
                            ) : currentItem.sighting.sightingDate ? (
                              `on ${format(new Date(currentItem.sighting.sightingDate), "dd MMM yyyy")}`
                            ) : null}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-6 h-6"
                              fill={currentItem.sighting.isLiked ? "currentColor" : "none"}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            <span className="text-white">{currentItem.sighting._count.likes}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            <span className="text-white">{currentItem.sighting._count.comments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1f2e] rounded-2xl p-6 max-w-sm w-full border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">Delete Post?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteSighting(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Search Modal */}
        <UserSearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
        />

        {/* Following Modal */}
        <FollowingModal
          isOpen={showFollowing}
          onClose={() => setShowFollowing(false)}
        />

        {/* Followers Modal */}
        <FollowersModal
          isOpen={showFollowers}
          onClose={() => setShowFollowers(false)}
        />
      </div>
    </div>
  );
}
