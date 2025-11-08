"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import Image from "next/image";
import toast from "react-hot-toast";
import CategoryPreviewCard from "@/components/business/CategoryPreviewCard";

interface BusinessProfile {
  id: string;
  name: string;
  businessName: string;
  businessCategory: string;
  businessServices: string[];
  businessDescription: string | null;
  businessWebsite: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessCountry: string | null;
  image: string | null;
  username: string | null;
  isVerified: boolean;
  verificationStatus: string;
  createdAt: string;
  stats: {
    totalHunts: number;
    completedHunts: number;
    successRate: number;
    activeHunts: number;
  };
  categoryPreviews: Record<string, {
    count: number;
    minPrice?: number;
    currency?: string;
    highlights?: string[];
    hasBookingOptions?: boolean;
  }>;
  recentHunts: Array<{
    id: string;
    areaName: string;
    status: string;
    date: string;
    startTime: string;
    duration: number;
    maxParticipants: number;
    currentParticipants: number;
    price: number;
    currency: string;
    photoRequired: boolean;
    createdAt: string;
  }>;
  publicChat: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    messageCount: number;
    requireApproval: boolean;
    areaName: string;
    isMember: boolean;
    memberRole: string | null;
    memberStatus: string | null;
    unreadCount: number;
    joinedAt: string | null;
    hasPendingRequest: boolean;
    joinRequestId: string | null;
  } | null;
  privateChat: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    messageCount: number;
    requireApproval: boolean;
    areaName: string;
    isMember: boolean;
    memberRole: string | null;
    memberStatus: string | null;
    unreadCount: number;
    joinedAt: string | null;
    hasPendingRequest: boolean;
    joinRequestId: string | null;
  } | null;
}

export default function BusinessProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningChat, setJoiningChat] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;

    fetch(`/api/businesses/${businessId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          router.push("/chats");
          return;
        }
        setBusiness(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching business:", error);
        toast.error("Failed to load business profile");
        router.push("/chats");
      });
  }, [businessId, router]);

  const handleChatAction = async (chatId: string, isMember: boolean, hasPendingRequest: boolean) => {
    if (isMember) {
      // Open chat
      router.push(`/chats/${chatId}`);
    } else if (hasPendingRequest) {
      // Cancel request
      setJoiningChat(chatId);
      try {
        const res = await fetch(`/api/chats/${chatId}/leave`, {
          method: "POST",
        });
        const data = await res.json();

        if (res.ok) {
          toast.success("Request cancelled");
          // Refresh business data to update button state
          const refreshRes = await fetch(`/api/businesses/${businessId}`);
          const refreshData = await refreshRes.json();
          setBusiness(refreshData);
        } else {
          toast.error(data.error || "Failed to cancel request");
        }
      } catch (error) {
        console.error("Error cancelling request:", error);
        toast.error("Failed to cancel request");
      } finally {
        setJoiningChat(null);
      }
    } else {
      // Join chat
      setJoiningChat(chatId);
      try {
        const res = await fetch(`/api/chats/${chatId}/join`, {
          method: "POST",
        });
        const data = await res.json();

        if (res.ok) {
          if (data.requiresApproval) {
            toast.success("Join request submitted! The business will review your request.");
          } else {
            toast.success("Successfully joined!");
          }
          // Refresh business data to update button state
          const refreshRes = await fetch(`/api/businesses/${businessId}`);
          const refreshData = await refreshRes.json();
          setBusiness(refreshData);
        } else {
          toast.error(data.error || "Failed to join chat");
        }
      } catch (error) {
        console.error("Error joining chat:", error);
        toast.error("Failed to join chat");
      } finally {
        setJoiningChat(null);
      }
    }
  };

  const getCategoryBadge = (category: string) => {
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
      <span className={`text-sm px-3 py-1 rounded-full ${categoryColors[category] || categoryColors.other}`}>
        {categoryLabels[category] || category}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      upcoming: "bg-blue-500/20 text-blue-400",
      in_progress: "bg-aurora-green/20 text-aurora-green",
      completed: "bg-gray-500/20 text-gray-400",
      cancelled: "bg-red-500/20 text-red-400",
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status] || statusColors.upcoming}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-white">Loading business profile...</div>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/chats?tab=discover')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Business Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Business Header */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <div className="flex items-start gap-4">
            {business.image ? (
              <Image
                src={business.image}
                alt={business.businessName}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-aurora-green to-aurora-purple flex items-center justify-center text-white text-2xl font-bold">
                {business.businessName?.charAt(0) || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{business.businessName}</h1>
                {business.isVerified && (
                  <svg className="w-6 h-6 text-aurora-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {getCategoryBadge(business.businessCategory)}
              {business.businessDescription && (
                <p className="text-gray-300 mt-3">{business.businessDescription}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-400">
                {business.businessCity && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {business.businessCity}, {business.businessCountry}
                  </span>
                )}
                {business.businessWebsite && (
                  <a
                    href={business.businessWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-aurora-green transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{business.stats.totalHunts}</div>
            <div className="text-xs text-gray-400">Total Hunts</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-aurora-green">{business.stats.completedHunts}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-aurora-blue">{business.stats.activeHunts}</div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-aurora-purple">{business.stats.successRate}%</div>
            <div className="text-xs text-gray-400">Success Rate</div>
          </div>
        </div>

        {/* Category Previews (Multi-Service) */}
        {business.businessServices && business.businessServices.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Services</h2>
            <div className="space-y-3">
              {business.businessServices.map((service) => {
                const preview = business.categoryPreviews?.[service];
                // Only show if there's preview data available
                if (!preview || preview.count === 0) return null;

                return (
                  <CategoryPreviewCard
                    key={service}
                    businessId={business.id}
                    service={service}
                    preview={preview}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Chats */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Community Chats</h2>

          {/* Public Chat */}
          {business.publicChat && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{business.publicChat.name}</h3>
                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                      Public
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{business.publicChat.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{business.publicChat.memberCount} members</span>
                    <span>•</span>
                    <span>{business.publicChat.messageCount} messages</span>
                  </div>
                </div>
                <button
                  onClick={() => handleChatAction(
                    business.publicChat.id,
                    business.publicChat.isMember,
                    business.publicChat.hasPendingRequest
                  )}
                  disabled={joiningChat === business.publicChat.id}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                    business.publicChat.isMember
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : business.publicChat.hasPendingRequest
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-aurora-green text-black hover:bg-aurora-green/80"
                  }`}
                >
                  {business.publicChat.isMember
                    ? "Open Chat"
                    : joiningChat === business.publicChat.id
                    ? business.publicChat.hasPendingRequest
                      ? "Cancelling..."
                      : "Joining..."
                    : business.publicChat.hasPendingRequest
                    ? "Cancel Request"
                    : "Join"}
                </button>
              </div>
            </div>
          )}

          {/* Private Chat */}
          {business.privateChat && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{business.privateChat.name}</h3>
                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Private
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{business.privateChat.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{business.privateChat.memberCount} members</span>
                    <span>•</span>
                    <span>{business.privateChat.messageCount} messages</span>
                    {business.privateChat.requireApproval && (
                      <>
                        <span>•</span>
                        <span>Requires Approval</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleChatAction(
                    business.privateChat.id,
                    business.privateChat.isMember,
                    business.privateChat.hasPendingRequest
                  )}
                  disabled={joiningChat === business.privateChat.id}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                    business.privateChat.isMember
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : business.privateChat.hasPendingRequest
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-aurora-purple text-white hover:bg-aurora-purple/80"
                  }`}
                >
                  {business.privateChat.isMember
                    ? "Open Chat"
                    : joiningChat === business.privateChat.id
                    ? business.privateChat.hasPendingRequest
                      ? "Cancelling..."
                      : "Requesting..."
                    : business.privateChat.hasPendingRequest
                    ? "Cancel Request"
                    : "Request Access"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Hunts */}
        {business.recentHunts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Recent Hunts</h2>
            <div className="space-y-2">
              {business.recentHunts.map((hunt) => (
                <div
                  key={hunt.id}
                  onClick={() => router.push(`/hunts/${hunt.id}`)}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{hunt.areaName}</h3>
                        {getStatusBadge(hunt.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <span>{format(new Date(hunt.date), "MMM d, yyyy")}</span>
                        <span>•</span>
                        <span>{hunt.startTime}</span>
                        <span>•</span>
                        <span>{hunt.duration}h</span>
                        <span>•</span>
                        <span>{hunt.currentParticipants}/{hunt.maxParticipants} spots</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{hunt.currency}{hunt.price}</div>
                      {hunt.photoRequired && (
                        <span className="text-xs text-gray-500">Photo Required</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
