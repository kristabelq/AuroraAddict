"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

interface JoinRequest {
  id: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  };
  message: string | null;
  createdAt: string;
}

interface PendingJoinRequestsProps {
  chatId: string;
  isOwner: boolean;
}

export default function PendingJoinRequests({ chatId, isOwner }: PendingJoinRequestsProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch pending requests
  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}/requests`);
      const data = await res.json();

      if (res.ok) {
        setRequests(data.requests);
      } else if (res.status === 403) {
        // Not the owner, don't show anything
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching join requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [chatId, isOwner]);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/chats/${chatId}/requests/${requestId}/approve`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Request approved!");
        // Remove from list
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        toast.error(data.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/chats/${chatId}/requests/${requestId}/reject`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Request rejected");
        // Remove from list
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        toast.error(data.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  // Don't render anything if not owner or no requests
  if (!isOwner || loading || requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-aurora-purple/10 border border-aurora-purple/30 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-aurora-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-white font-semibold">
          Pending Requests ({requests.length})
        </h3>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white/5 rounded-lg p-3 flex items-start gap-3"
          >
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {request.user.image ? (
                <Image
                  src={request.user.image}
                  alt={request.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-green to-aurora-purple flex items-center justify-center text-white font-bold">
                  {request.user.name?.charAt(0) || "?"}
                </div>
              )}
            </div>

            {/* User Info and Message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white">
                  {request.user.name || "Unknown User"}
                </span>
                {request.user.username && (
                  <span className="text-sm text-gray-400">
                    @{request.user.username}
                  </span>
                )}
              </div>

              {request.message && (
                <p className="text-sm text-gray-300 mb-2">"{request.message}"</p>
              )}

              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={processingId === request.id}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-aurora-green/20 text-aurora-green hover:bg-aurora-green/30 disabled:opacity-50 transition-colors"
              >
                {processingId === request.id ? "..." : "Approve"}
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
              >
                {processingId === request.id ? "..." : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
