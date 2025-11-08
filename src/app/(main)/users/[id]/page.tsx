"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow, format } from "date-fns";
import { formatLocationWithFlag, formatSightingLocation } from "@/utils/location";

interface User {
  id: string;
  name: string;
  image: string;
  bio: string | null;
  sightings: Sighting[];
  _count: {
    sightings: number;
    hunts: number;
  };
}

interface Sighting {
  id: string;
  images: string[];
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

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedView, setShowFeedView] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { id: userId } = use(params);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load profile");
        setLoading(false);
        return;
      }

      setUser(data);
      setLoading(false);
    } catch (err) {
      setError("An error occurred while loading the profile");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "User not found"}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-400 hover:text-blue-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if viewing own profile and redirect in useEffect
  const isOwnProfile = session?.user?.id === user.id;

  useEffect(() => {
    if (isOwnProfile) {
      router.push("/profile");
    }
  }, [isOwnProfile, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-8">
          <img
            src={user.image || "/default-avatar.png"}
            alt={user.name}
            className="w-24 h-24 rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{user.name}</h1>

            {user.bio && (
              <p className="text-gray-300 mb-4 whitespace-pre-wrap">
                {user.bio}
              </p>
            )}

            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold text-white">
                  {user._count.sightings}
                </div>
                <div className="text-sm text-gray-400">Sightings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {user._count.hunts}
                </div>
                <div className="text-sm text-gray-400">Hunts Created</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sightings Grid */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Sightings</h2>

          {user.sightings.length === 0 ? (
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-400">No sightings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {user.sightings
                .filter((sighting) => sighting.images && sighting.images.length > 0)
                .flatMap((sighting) =>
                  sighting.images.map((image, imgIndex) => ({
                    image,
                    sighting,
                    imgIndex
                  }))
                ).map((item, index) => (
                <div
                  key={`${item.sighting.id}-${item.imgIndex}`}
                  className="relative aspect-square group cursor-pointer"
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setShowFeedView(true);
                  }}
                >
                  <img
                    src={item.image}
                    alt="Aurora sighting"
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white">
                      <svg
                        className="w-6 h-6 fill-white"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="font-semibold">
                        {item.sighting._count.likes}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feed View Modal */}
        {showFeedView && user && (
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

            {selectedImageIndex < user.sightings.filter(s => s.images && s.images.length > 0).flatMap(s => s.images).length - 1 && (
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
                const allImages = user.sightings
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
