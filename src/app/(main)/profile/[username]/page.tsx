"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatDistanceToNow, format } from "date-fns";
import { formatSightingLocation } from "@/utils/location";
import { getCountryCode, getCountryFlag, getCountryName } from "@/utils/countryUtils";

interface Sighting {
  id: string;
  images: string[];
  videos: string[];
  caption: string | null;
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
}

interface ProfileData {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  instagram: string | null;
  whatsappNumber: string | null;
  publicEmail: string | null;
  sightingsCount: number;
  postsCount: number;
  huntsCount: number;
  huntsParticipatedCount: number;
  followersCount: number;
  followingCount: number;
  averageSuccessRate: number;
  sightings: Sighting[];
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const { username } = use(params);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFeedView, setShowFeedView] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    if (!username) return;

    try {
      const response = await fetch(`/api/user/${username}/profile`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to load profile");
        router.push("/");
        return;
      }

      // If viewing own profile, redirect to /profile
      if (data.isOwnProfile) {
        router.push("/profile");
        return;
      }

      setProfile(data);
      setFollowing(data.isFollowing);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
      router.push("/");
    }
  };

  const handleFollowToggle = async () => {
    if (!session) {
      toast.error("Please sign in to follow users");
      router.push("/auth/signin");
      return;
    }

    if (!profile) return;

    setFollowLoading(true);

    try {
      const method = following ? "DELETE" : "POST";
      const response = await fetch(`/api/user/${profile.id}/follow`, {
        method,
      });

      const data = await response.json();

      if (response.ok) {
        setFollowing(!following);
        setProfile({
          ...profile,
          followersCount: following
            ? profile.followersCount - 1
            : profile.followersCount + 1,
        });
        toast.success(following ? "Unfollowed" : "Following");
      } else {
        toast.error(data.error || "Failed to update follow status");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (!profile) return;

    const url = `${window.location.origin}/profile/${profile.username || profile.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.name || "User"}'s Profile`,
          text: `Check out ${profile.name || "this user"}'s aurora hunting profile!`,
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

  if (loading) {
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

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6">
          {/* Profile Image and Stats */}
          <div className="flex items-start gap-6 mb-6">
            {/* Profile Image with Handle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative w-24 h-24 rounded-full overflow-hidden mb-2">
                {profile.image ? (
                  <Image
                    src={profile.image}
                    alt={profile.name || "User"}
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
            <div className="flex-1 grid grid-cols-3 gap-4">
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
                  {profile.sightingsCount === 1 ? 'Sighting' : 'Sightings'}
                </div>
              </button>
              <button
                onClick={() => router.push(`/hunts?organizer=${profile.username || profile.id}`)}
                className="text-center hover:bg-white/5 rounded-lg py-2 transition-colors"
              >
                <div className="text-2xl font-bold text-white">
                  {profile.huntsParticipatedCount}
                </div>
                <div className="text-xs text-gray-400">
                  {profile.huntsParticipatedCount === 1 ? 'Hunt' : 'Hunts'}
                </div>
              </button>
              <div className="text-center py-2">
                <div className="text-2xl font-bold text-aurora-green">
                  {profile.averageSuccessRate.toFixed(1)}%
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
                  {profile.postsCount === 1 ? 'Post' : 'Posts'}
                </div>
              </button>
              <div className="text-center py-2">
                <div className="text-2xl font-bold text-white">
                  {profile.followersCount}
                </div>
                <div className="text-xs text-gray-400">
                  {profile.followersCount === 1 ? 'Follower' : 'Followers'}
                </div>
              </div>
              <div className="text-center py-2">
                <div className="text-2xl font-bold text-white">
                  {profile.followingCount}
                </div>
                <div className="text-xs text-gray-400">Following</div>
              </div>
            </div>
          </div>

          {/* Name and Bio */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">
                {profile.name || "Anonymous"}
              </h2>
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
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                following
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white"
              }`}
            >
              {followLoading
                ? "Loading..."
                : following
                  ? "Following"
                  : "Follow"}
            </button>
            <button
              onClick={handleShareProfile}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Share Profile
            </button>
          </div>
        </div>

        {/* Country Highlights */}
        {profile.sightings.length > 0 && (() => {
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
              <div className="flex gap-4 overflow-x-auto pb-2 px-4 pt-2 scrollbar-hide">
                {/* "All" highlight */}
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="flex flex-col items-center flex-shrink-0 group"
                >
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-all ${
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
                      className={`w-20 h-20 rounded-full overflow-hidden transition-all ${
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

          {profile.sightings.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
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
                    className="relative aspect-square cursor-pointer overflow-hidden rounded group"
                  >
                    <Image
                      src={item.image}
                      alt={item.sighting.caption || "Aurora sighting"}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{item.sighting._count.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{item.sighting._count.comments}</span>
                        </div>
                      </div>
                    </div>
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

            {selectedImageIndex < profile.sightings.filter(s => s.images && s.images.length > 0).flatMap(s => s.images).length - 1 && (
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
                        </div>
                      </div>

                      {/* Caption and Location */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {currentItem.sighting.caption ? (
                          <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">
                            {currentItem.sighting.caption}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm italic mb-3">No caption</p>
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
                              fill="none"
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
      </div>
    </div>
  );
}
