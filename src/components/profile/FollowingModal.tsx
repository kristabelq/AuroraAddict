"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface FollowingUser {
  id: string;
  name: string;
  username: string | null;
  image: string;
  bio: string | null;
  followers: number;
  sightings: number;
}

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FollowingModal({ isOpen, onClose }: FollowingModalProps) {
  const router = useRouter();
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFollowing();
    }
  }, [isOpen]);

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users/following");
      const data = await response.json();
      setFollowing(data);
    } catch (error) {
      console.error("Error fetching following:", error);
      toast.error("Failed to load following");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFollowing((prev) => prev.filter((user) => user.id !== userId));
        toast.success("Unfollowed user");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  const handleUserClick = (user: FollowingUser) => {
    onClose();
    router.push(`/profile/${user.username || user.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0e17] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Following</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : following.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              You're not following anyone yet
            </div>
          ) : (
            <div className="space-y-4">
              {following.map((user) => (
                <div
                  key={user.id}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      onClick={() => handleUserClick(user)}
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
                        onClick={() => handleUserClick(user)}
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
                          <span className="text-white font-semibold">{user.followers}</span> followers
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnfollow(user.id)}
                      className="px-6 py-2 rounded-lg font-semibold transition-colors bg-white/10 hover:bg-white/20 text-white"
                    >
                      Unfollow
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
