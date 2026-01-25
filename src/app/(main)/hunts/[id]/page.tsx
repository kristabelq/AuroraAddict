"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { formatHuntDateDetailed } from "@/utils/timezone";

interface User {
  id: string;
  name: string;
  username: string | null;
  image: string;
}

interface Participant {
  id: string;
  userId: string;
  status: string;
  paymentStatus?: string | null;
  joinedAt: string;
  user: User;
}

interface Hunt {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  additionalInfoUrl?: string | null;
  whatsappNumber?: string | null;
  startDate: string;
  endDate: string;
  timezone?: string | null;
  location: string;
  latitude: number;
  longitude: number;
  hideLocation: boolean;
  isPublic: boolean;
  isPaid: boolean;
  price: number | null;
  capacity: number | null;
  allowWaitlist: boolean;
  cancellationPolicy?: string | null;
  createdAt: string;
  user: User;
  participants: Participant[];
  isUserParticipant: boolean;
  isCreator: boolean;
  chatGroup: {
    id: string;
    name: string;
  } | null;
}

export default function HuntDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status} = useSession();
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [huntId, setHuntId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setHuntId(p.id));
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && huntId) {
      fetchHuntDetails();
    }
  }, [status, huntId]);

  const fetchHuntDetails = async () => {
    if (!huntId) return;

    try {
      const response = await fetch(`/api/hunts/${huntId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load hunt");
        setLoading(false);
        return;
      }

      setHunt(data);
      setLoading(false);
    } catch (err) {
      setError("An error occurred while loading the hunt");
      setLoading(false);
    }
  };

  const handleJoinHunt = async () => {
    if (!huntId) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}/join`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        if (data.isWaitlisted) {
          toast.success(data.message || "Added to waitlist! You'll be notified if a spot opens up");
        } else if (data.requiresApproval) {
          toast.success(data.message || "Request sent! Waiting for organizer approval");
        } else if (data.requiresPayment) {
          toast.success(data.message || "Joined! Please pay the organizer directly and mark your payment as complete.");
        } else {
          toast.success(data.message || "Successfully joined hunt!");
        }
        fetchHuntDetails(); // Refresh to update participant list
      } else {
        toast.error(data.error || "Failed to join hunt");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveHunt = async () => {
    if (!huntId || !hunt) return;

    // Show cancellation policy warning for paid hunts
    let confirmMessage = "Are you sure you want to leave this hunt?";
    if (hunt.isPaid && hunt.cancellationPolicy) {
      confirmMessage = `Are you sure you want to leave this hunt?\n\nBy leaving, you are adhering to the cancellation policy:\n\n${hunt.cancellationPolicy}`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}/leave`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Successfully left hunt");
        fetchHuntDetails(); // Refresh to update participant list
      } else {
        toast.error(data.error || "Failed to leave hunt");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (userId: string) => {
    if (!huntId) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}/requests/${userId}`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Request approved successfully");
        fetchHuntDetails(); // Refresh to update participant list
      } else {
        toast.error(data.error || "Failed to approve request");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    if (!huntId) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}/requests/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Request rejected");
        fetchHuntDetails(); // Refresh to update participant list
      } else {
        toast.error(data.error || "Failed to reject request");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for participant to mark payment as made
  const handleMarkPaymentMade = async () => {
    if (!huntId) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}/payment/mark-paid`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Payment marked as made! Waiting for organizer confirmation.");
        fetchHuntDetails();
      } else {
        toast.error(data.error || "Failed to mark payment");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for organizer to confirm payment received
  const handleConfirmPayment = async (userId: string) => {
    if (!huntId) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}/payment/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Payment confirmed! Participant is now confirmed.");
        fetchHuntDetails();
      } else {
        toast.error(data.error || "Failed to confirm payment");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditHunt = () => {
    if (!huntId) return;
    router.push(`/hunts/${huntId}/edit`);
  };

  const handleDeleteHunt = async () => {
    if (!huntId) return;

    if (!confirm("Are you sure you want to delete this hunt? This action cannot be undone.")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Hunt deleted successfully");
        router.push("/hunts");
      } else {
        toast.error(data.error || "Failed to delete hunt");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareHunt = async () => {
    if (!huntId) return;

    const url = `${window.location.origin}/hunts/${huntId}`;

    try {
      if (navigator.share) {
        // Use native share API if available
        await navigator.share({
          title: hunt?.name || "Aurora Hunt",
          text: hunt?.description || "Join me for an aurora hunting adventure!",
          url: url,
        });
        toast.success("Shared successfully!");
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      // If user cancels share or clipboard fails
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Failed to share. Please try again.");
      }
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* Aurora Wave Animation */}
          <div className="relative w-32 h-32">
            {/* Outer wave - Green */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 border-r-green-500 animate-spin" style={{ animationDuration: '3s' }}></div>
            {/* Middle wave - Blue */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-400 border-r-blue-500 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
            {/* Inner wave - Purple */}
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-400 border-r-purple-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
            {/* Center glow */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-green-400/20 via-blue-400/20 to-purple-400/20 animate-pulse"></div>
          </div>

          {/* Text with gradient */}
          <div className="text-center space-y-2">
            <div className="text-xl font-semibold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              Loading Hunt Details
            </div>
            <div className="text-sm text-gray-400 animate-pulse" style={{ animationDelay: '0.5s' }}>
              Preparing your aurora adventure...
            </div>
          </div>

          {/* Dancing aurora lights */}
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 hover:text-blue-300"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!hunt) {
    return null;
  }

  const startDate = new Date(hunt.startDate);
  const endDate = new Date(hunt.endDate);
  const now = new Date();
  const isPastHunt = now > endDate;
  const isActiveHunt = now >= startDate && now <= endDate;
  const confirmedParticipants = hunt.participants.filter(
    (p) => p.status === "confirmed"
  );
  const pendingParticipants = hunt.participants.filter(
    (p) => p.status === "pending"
  );
  const waitlistedParticipants = hunt.participants.filter(
    (p) => p.status === "waitlisted"
  );

  // Check if current user has a pending request
  const currentUserParticipant = hunt.participants.find(
    (p) => p.userId === session?.user?.id
  );
  const isPendingApproval = currentUserParticipant?.status === "pending" && !hunt.isPaid;
  const isPendingPayment = currentUserParticipant?.status === "pending" && hunt.isPaid && currentUserParticipant?.paymentStatus === "pending";
  const isPaymentMarkedPaid = currentUserParticipant?.status === "pending" && hunt.isPaid && currentUserParticipant?.paymentStatus === "marked_paid";
  const isPaymentConfirmed = hunt.isPaid && currentUserParticipant?.status === "confirmed";
  const isWaitlisted = currentUserParticipant?.status === "waitlisted";
  const isConfirmed = currentUserParticipant?.status === "confirmed" && !hunt.isPaid;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/hunts")}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
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

          {/* Cover Image */}
          <div className="mb-6">
            <img
              src={hunt.coverImage || "/default-hunt-cover.svg"}
              alt={hunt.name}
              className="w-full aspect-video rounded-xl object-cover"
            />
          </div>

          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-white">{hunt.name}</h1>
            <button
              onClick={handleShareHunt}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              title="Share hunt"
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
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          <button
            onClick={() => router.push(`/hunts?organizer=${hunt.user.username || hunt.user.id}`)}
            className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <img
              src={hunt.user.image || "/default-avatar.png"}
              alt={hunt.user.name}
              className="w-8 h-8 rounded-full"
            />
            <span>
              Organized by <span className="text-white">{hunt.isCreator ? "You" : hunt.user.name}</span>
            </span>
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {isActiveHunt && (
            <span className="px-3 py-1 bg-green-500/90 text-white text-sm rounded-full font-semibold backdrop-blur-sm">
              ONGOING
            </span>
          )}
          {!isActiveHunt && !isPastHunt && (
            <span className="px-3 py-1 bg-blue-500/90 text-white text-sm rounded-full font-semibold backdrop-blur-sm">
              UPCOMING
            </span>
          )}
          {isPastHunt && (
            <span className="px-3 py-1 bg-gray-500/90 text-white text-sm rounded-full font-semibold backdrop-blur-sm">
              COMPLETED
            </span>
          )}
          {!hunt.isPublic && (
            <span className="px-3 py-1 bg-purple-600/30 text-purple-200 text-sm rounded-full font-semibold backdrop-blur-sm border border-purple-400/30">
              PRIVATE
            </span>
          )}
          {hunt.isPaid && (
            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full">
              ${hunt.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/pax
            </span>
          )}
          {hunt.capacity && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
              {confirmedParticipants.length}/{hunt.capacity} spots
            </span>
          )}
        </div>

        {/* Waitlist Approvals (Only visible to hunt creator) */}
        {hunt.isCreator && waitlistedParticipants.length > 0 && (
          <div className="bg-purple-500/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-purple-500/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {waitlistedParticipants.length}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-purple-200">
                Waitlist ({waitlistedParticipants.length})
              </h2>
            </div>

            <p className="text-purple-200/80 text-sm mb-4">
              Review and approve waitlisted participants to add them to the hunt.
            </p>

            <div className="space-y-3">
              {waitlistedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4"
                >
                  <button
                    onClick={() => router.push(`/profile/${participant.user.username || participant.user.id}`)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={participant.user.image || "/default-avatar.png"}
                      alt={participant.user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">
                        {participant.user.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Joined waitlist {formatDistanceToNow(new Date(participant.joinedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(participant.userId)}
                      disabled={actionLoading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(participant.userId)}
                      disabled={actionLoading}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Participants ({confirmedParticipants.length})
          </h2>

          {confirmedParticipants.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {confirmedParticipants.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => router.push(`/hunts?organizer=${participant.user.username || participant.user.id}`)}
                  className="flex flex-col items-center gap-2 hover:bg-white/5 rounded-lg p-2 transition-colors"
                >
                  <img
                    src={participant.user.image || "/default-avatar.png"}
                    alt={participant.user.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="text-center">
                    <div className="text-sm text-white">
                      {participant.user.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(participant.joinedAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No confirmed participants yet</p>
          )}

        </div>

        {/* Hunt Chat Button - Only visible to organizer and confirmed participants */}
        {hunt.chatGroup && (hunt.isCreator || hunt.isUserParticipant) && (
          <button
            onClick={() => hunt.chatGroup && router.push(`/chats/${hunt.chatGroup.id}`)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-colors mb-6 flex items-center justify-center gap-2 shadow-lg"
          >
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
            Open Hunt Chat
          </button>
        )}

        {/* User Status Buttons - After Participants */}
        {/* 1. Pending Approval (Gold) + Cancel Request - For private hunts awaiting organizer approval */}
        {!hunt.isCreator && isPendingApproval && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Left: Pending Approval (Inactionable) */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg opacity-90 cursor-default">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Pending Approval</span>
            </div>

            {/* Right: Cancel Request */}
            <button
              onClick={handleLeaveHunt}
              disabled={actionLoading}
              className="bg-red-500 text-white py-4 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {actionLoading ? "Cancelling..." : "Cancel Request"}
            </button>
          </div>
        )}

        {/* 2. Payment Pending - Participant needs to pay and mark as paid */}
        {!hunt.isCreator && isPendingPayment && (
          <div className="space-y-3 mb-6">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-yellow-200">Payment Required: ${hunt.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <p className="text-sm text-yellow-200/80 mb-3">
                Pay the organizer directly (via WhatsApp, bank transfer, etc.) then mark your payment as complete below.
              </p>
              {hunt.whatsappNumber && (
                <a
                  href={`https://wa.me/${hunt.whatsappNumber}?text=${encodeURIComponent(`Hi! I'd like to pay for the hunt "${hunt.name}". How can I send the payment?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 mb-3"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Contact organizer on WhatsApp
                </a>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleMarkPaymentMade}
                disabled={actionLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {actionLoading ? "Marking..." : "I've Paid"}
              </button>
              <button
                onClick={handleLeaveHunt}
                disabled={actionLoading}
                className="bg-red-500 text-white py-4 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {actionLoading ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* 2b. Payment Marked - Awaiting organizer confirmation */}
        {!hunt.isCreator && isPaymentMarkedPaid && (
          <div className="space-y-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-500/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-blue-200">Payment Marked - Awaiting Confirmation</span>
              </div>
              <p className="text-sm text-blue-200/80">
                You've marked your payment as complete. The organizer will confirm once they receive it.
              </p>
            </div>
            <button
              onClick={handleLeaveHunt}
              disabled={actionLoading}
              className="w-full bg-red-500 text-white py-4 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {actionLoading ? "Cancelling..." : "Cancel Request"}
            </button>
          </div>
        )}

        {/* 2c. Payment Confirmed - For confirmed paid hunt participants */}
        {!hunt.isCreator && isPaymentConfirmed && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg opacity-90 cursor-default">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Confirmed & Paid</span>
            </div>
            <button
              onClick={handleLeaveHunt}
              disabled={actionLoading}
              className="bg-red-500 text-white py-4 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {actionLoading ? "Leaving..." : "Leave Hunt"}
            </button>
          </div>
        )}

        {/* 3. Waitlisted (Blue) + Leave Waitlist - For waitlisted participants */}
        {!hunt.isCreator && isWaitlisted && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Left: Waitlisted (Inactionable) */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg opacity-90 cursor-default">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>Waitlisted</span>
            </div>

            {/* Right: Leave Waitlist */}
            <button
              onClick={handleLeaveHunt}
              disabled={actionLoading}
              className="bg-red-500 text-white py-4 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {actionLoading ? "Leaving..." : "Leave Waitlist"}
            </button>
          </div>
        )}

        {/* 4. Confirmed (Green) + Leave Hunt - For confirmed free hunt participants */}
        {!hunt.isCreator && isConfirmed && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Left: Confirmed (Inactionable) */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg opacity-90 cursor-default">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Confirmed</span>
            </div>

            {/* Right: Leave Hunt */}
            <button
              onClick={handleLeaveHunt}
              disabled={actionLoading}
              className="bg-red-500 text-white py-4 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {actionLoading ? "Leaving..." : "Leave Hunt"}
            </button>
          </div>
        )}

        {/* Initial Action Buttons - For non-participants */}
        {!hunt.isCreator && !hunt.isUserParticipant && !isPendingApproval && !isPendingPayment && !isPaymentMarkedPaid && !isWaitlisted && !isPastHunt && (
          <>
            {/* Capacity is met - Show waitlist or full message */}
            {hunt.capacity !== null && confirmedParticipants.length >= hunt.capacity ? (
              hunt.allowWaitlist ? (
                <button
                  onClick={handleJoinHunt}
                  disabled={actionLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Joining Waitlist...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Join Waitlist
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full bg-red-500/20 border-2 border-red-500/50 text-red-200 py-4 rounded-xl font-semibold text-center mb-6 shadow-lg">
                  Hunt is at full capacity
                </div>
              )
            ) : (
              /* Capacity not met - Show join/request button */
              <button
                onClick={handleJoinHunt}
                disabled={actionLoading}
                className={`w-full py-4 rounded-xl font-semibold transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                  !hunt.isPublic
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                    : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600"
                }`}
              >
                {actionLoading
                  ? hunt.isPublic ? "Joining..." : "Sending Request..."
                  : hunt.isPublic
                  ? hunt.isPaid
                    ? `Join Hunt ($${hunt.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/pax)`
                    : "Join Hunt"
                  : "Request to Join"}
              </button>
            )}
          </>
        )}

        {/* Real-Time Sighting and Album Buttons Side by Side */}
        {isActiveHunt && (hunt.isUserParticipant || hunt.isCreator) && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Post Real-Time Sighting Button (left) */}
            <button
              onClick={() => router.push(`/sightings/new?huntId=${huntId}`)}
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 rounded-xl font-semibold hover:from-green-500 hover:to-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg animate-pulse"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Post Real-Time Sighting</span>
              <span className="sm:hidden">Post Sighting</span>
            </button>

            {/* Hunt's Shared Album Button (right) */}
            <button
              onClick={() => router.push(`/hunts/${huntId}/album`)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">Hunt's Shared Album</span>
              <span className="sm:hidden">Album</span>
            </button>
          </div>
        )}

        {/* Hunt's Album Button - For non-active hunts (full width) */}
        {!isActiveHunt && (hunt.isUserParticipant || hunt.isCreator) && (
          <button
            onClick={() => router.push(`/hunts/${huntId}/album`)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors mb-6 flex items-center justify-center gap-2 shadow-lg"
          >
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Hunt's Shared Album
          </button>
        )}

        {/* View Shared Album Button - For non-participants when hunt is public and ended */}
        {hunt.isPublic && isPastHunt && !hunt.isUserParticipant && !hunt.isCreator && (
          <button
            onClick={() => router.push(`/hunts/${huntId}/album`)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-colors mb-6 flex items-center justify-center gap-2 shadow-lg"
          >
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Hunt's Shared Album
          </button>
        )}

        {/* WhatsApp Contact Button */}
        {hunt.whatsappNumber && (
          <a
            href={`https://wa.me/${hunt.whatsappNumber}?text=${encodeURIComponent("Hi fellow Aurora addict, I am keen to join your hunt! Tell me more!")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white py-3 rounded-lg font-medium hover:bg-[#20BA5A] transition-colors mb-3 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Contact via WhatsApp
          </a>
        )}

        {/* Additional Info Button */}
        {hunt.additionalInfoUrl && (
          <a
            href={hunt.additionalInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium transition-colors mb-6 flex items-center justify-center gap-2"
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            More Information
          </a>
        )}

        {/* Description */}
        {hunt.description && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">
              Description
            </h2>
            <p className="text-gray-300 whitespace-pre-wrap">
              {hunt.description}
            </p>
          </div>
        )}

        {/* Cancellation Policy */}
        {hunt.isPaid && hunt.cancellationPolicy && (
          <div className="bg-yellow-500/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-3">
              <svg
                className="w-6 h-6 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-yellow-200">
                Cancellation Policy
              </h2>
            </div>
            <p className="text-yellow-200/90 whitespace-pre-wrap">
              {hunt.cancellationPolicy}
            </p>
          </div>
        )}

        {/* Date & Time */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Date & Time
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <div className="font-medium text-white mb-1">Start</div>
                <div className="text-sm text-gray-400">
                  {formatHuntDateDetailed(hunt.startDate, hunt.timezone)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <div className="font-medium text-white mb-1">End</div>
                <div className="text-sm text-gray-400">
                  {formatHuntDateDetailed(hunt.endDate, hunt.timezone)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Point */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Meeting Point</h2>
          {hunt.hideLocation && !hunt.isUserParticipant && !hunt.isCreator ? (
            <p className="text-gray-400 text-sm">
              Meeting point is hidden. Join the hunt to see the exact meeting point.
            </p>
          ) : (
            <>
              <p className="text-gray-300 mb-4">{hunt.location || "Meeting Point TBD"}</p>
              {hunt.latitude && hunt.longitude && !isNaN(hunt.latitude) && !isNaN(hunt.longitude) ? (
                <div className="space-y-3">
                  {/* Google Maps Embed */}
                  <div className="h-64 rounded-lg overflow-hidden border border-white/10">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${hunt.latitude},${hunt.longitude}&zoom=13`}
                      allowFullScreen
                    />
                  </div>

                  {/* Get Directions Button */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hunt.latitude},${hunt.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
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
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    Get Directions
                  </a>
                </div>
              ) : (
                <div className="h-64 rounded-lg bg-white/5 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">No coordinates available</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pending Payment Confirmations (Only visible to hunt creator) - For paid hunts */}
        {hunt.isCreator && hunt.isPaid && pendingParticipants.filter(p => p.paymentStatus === "marked_paid").length > 0 && (
          <div className="bg-green-500/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-green-500/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <svg
                  className="w-6 h-6 text-green-400"
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
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingParticipants.filter(p => p.paymentStatus === "marked_paid").length}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-green-200">
                Payments to Confirm ({pendingParticipants.filter(p => p.paymentStatus === "marked_paid").length})
              </h2>
            </div>

            <p className="text-green-200/80 text-sm mb-4">
              These participants have marked their payment as complete. Confirm once you've received the payment.
            </p>

            <div className="space-y-3">
              {pendingParticipants.filter(p => p.paymentStatus === "marked_paid").map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4"
                >
                  <button
                    onClick={() => router.push(`/profile/${participant.user.username || participant.user.id}`)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={participant.user.image || "/default-avatar.png"}
                      alt={participant.user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">
                        {participant.user.name}
                      </div>
                      <div className="text-xs text-green-400">
                        Marked paid {formatDistanceToNow(new Date(participant.joinedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmPayment(participant.userId)}
                      disabled={actionLoading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Payment
                    </button>
                    <button
                      onClick={() => handleRejectRequest(participant.userId)}
                      disabled={actionLoading}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Awaiting Payment (Only visible to hunt creator) - For paid hunts */}
        {hunt.isCreator && hunt.isPaid && pendingParticipants.filter(p => p.paymentStatus === "pending").length > 0 && (
          <div className="bg-yellow-500/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingParticipants.filter(p => p.paymentStatus === "pending").length}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-yellow-200">
                Awaiting Payment ({pendingParticipants.filter(p => p.paymentStatus === "pending").length})
              </h2>
            </div>

            <p className="text-yellow-200/80 text-sm mb-4">
              These participants have joined but haven't marked their payment yet.
            </p>

            <div className="space-y-3">
              {pendingParticipants.filter(p => p.paymentStatus === "pending").map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4"
                >
                  <button
                    onClick={() => router.push(`/profile/${participant.user.username || participant.user.id}`)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={participant.user.image || "/default-avatar.png"}
                      alt={participant.user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">
                        {participant.user.name}
                      </div>
                      <div className="text-xs text-yellow-400">
                        Joined {formatDistanceToNow(new Date(participant.joinedAt), {
                          addSuffix: true,
                        })} • Payment pending
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRejectRequest(participant.userId)}
                    disabled={actionLoading}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Requests (Only visible to hunt creator) - For private/approval-required hunts */}
        {hunt.isCreator && !hunt.isPaid && pendingParticipants.length > 0 && (
          <div className="bg-yellow-500/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingParticipants.length}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-yellow-200">
                Pending Join Requests ({pendingParticipants.length})
              </h2>
            </div>

            <p className="text-yellow-200/80 text-sm mb-4">
              Review and approve join requests from users who want to participate in this hunt.
            </p>

            <div className="space-y-3">
              {pendingParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4"
                >
                  <button
                    onClick={() => router.push(`/hunts?organizer=${participant.user.username || participant.user.id}`)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={participant.user.image || "/default-avatar.png"}
                      alt={participant.user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">
                        {participant.user.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Requested {formatDistanceToNow(new Date(participant.joinedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(participant.userId)}
                      disabled={actionLoading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(participant.userId)}
                      disabled={actionLoading}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - Only for creator */}
        {hunt.isCreator && (
          <div className="flex gap-3">
            <button
              onClick={handleEditHunt}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Edit Hunt
            </button>
            <button
              onClick={handleDeleteHunt}
              disabled={actionLoading}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? "Deleting..." : "Delete Hunt"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
