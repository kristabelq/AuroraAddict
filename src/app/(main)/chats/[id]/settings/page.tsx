"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import toast from "react-hot-toast";

interface ChatInfo {
  id: string;
  name: string;
  groupType: string;
  visibility: string;
  requireApproval: boolean;
  slowModeSeconds: number | null;
  membership: {
    role: string;
  } | null;
  canModerate: boolean;
}

interface Member {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  mutedUntil: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
    userType: string;
  };
}

interface JoinRequest {
  id: string;
  message: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
}

interface PinnedMessage {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

type TabType = "requests" | "members" | "pinned" | "settings";

export default function ChatSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("members");
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch chat info
  useEffect(() => {
    if (!chatId) return;

    fetch(`/api/chats/${chatId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          router.push("/chats");
          return;
        }

        // Check if user can moderate
        if (!data.canModerate) {
          toast.error("You don't have permission to access settings");
          router.push(`/chats/${chatId}`);
          return;
        }

        setChatInfo(data);
        setMembers(data.members || []);
        setPinnedMessages(data.pinnedMessages || []);

        // Set initial tab based on chat type
        if (data.requireApproval && data.visibility === "private") {
          setActiveTab("requests");
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching chat:", error);
        toast.error("Failed to load chat settings");
        router.push("/chats");
      });
  }, [chatId, router]);

  // Fetch join requests for private chats
  useEffect(() => {
    if (!chatId || !chatInfo?.requireApproval) return;

    fetch(`/api/chats/${chatId}/join-requests`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setJoinRequests(data.requests || []);
        }
      })
      .catch((error) => {
        console.error("Error fetching join requests:", error);
      });
  }, [chatId, chatInfo]);

  const handleJoinRequestAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    setActionLoading(requestId);

    try {
      const response = await fetch(
        `/api/chats/${chatId}/join-requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} request`);
      }

      toast.success(
        action === "approve" ? "Request approved!" : "Request rejected"
      );

      // Remove from list
      setJoinRequests((prev) => prev.filter((req) => req.id !== requestId));

      // If approved, refresh members list
      if (action === "approve") {
        const chatResponse = await fetch(`/api/chats/${chatId}`);
        const chatData = await chatResponse.json();
        setMembers(chatData.members || []);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing request:`, error);
      toast.error(error.message || `Failed to ${action} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMemberAction = async (
    memberId: string,
    action: "mute" | "unmute" | "ban" | "kick" | "promote" | "demote"
  ) => {
    setActionLoading(memberId);

    try {
      const response = await fetch(`/api/chats/${chatId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} member`);
      }

      toast.success(
        action === "mute"
          ? "Member muted for 24 hours"
          : action === "unmute"
          ? "Member unmuted"
          : action === "ban"
          ? "Member banned"
          : action === "kick"
          ? "Member removed"
          : action === "promote"
          ? "Member promoted to moderator"
          : "Member demoted to member"
      );

      // Update members list
      if (action === "kick" || action === "ban") {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  status: action === "mute" ? "muted" : m.status,
                  mutedUntil:
                    action === "mute"
                      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                      : null,
                  role:
                    action === "promote"
                      ? "moderator"
                      : action === "demote"
                      ? "member"
                      : m.role,
                }
              : m
          )
        );
      }
    } catch (error: any) {
      console.error(`Error ${action}ing member:`, error);
      toast.error(error.message || `Failed to ${action} member`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    setActionLoading(messageId);

    try {
      const response = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpin" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unpin message");
      }

      toast.success("Message unpinned");
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error: any) {
      console.error("Error unpinning message:", error);
      toast.error(error.message || "Failed to unpin message");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSlowModeToggle = async () => {
    try {
      const newSlowMode = chatInfo?.slowModeSeconds ? 0 : 30;

      const response = await fetch(`/api/chats/${chatId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slowModeSeconds: newSlowMode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update slow mode");
      }

      toast.success(
        newSlowMode > 0 ? "Slow mode enabled (30s)" : "Slow mode disabled"
      );

      if (chatInfo) {
        setChatInfo({ ...chatInfo, slowModeSeconds: newSlowMode });
      }
    } catch (error: any) {
      console.error("Error toggling slow mode:", error);
      toast.error(error.message || "Failed to update slow mode");
    }
  };

  const getUserAvatar = (user: { name: string; image: string | null }) => {
    if (user.image) {
      return (
        <Image
          src={user.image}
          alt={user.name}
          width={40}
          height={40}
          className="rounded-full"
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-green to-aurora-purple flex items-center justify-center text-white font-bold">
        {user.name?.charAt(0) || "?"}
      </div>
    );
  };

  const getRoleBadge = (role: string) => {
    if (role === "owner") {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-aurora-green/20 text-aurora-green rounded">
          Owner
        </span>
      );
    }
    if (role === "moderator") {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-aurora-blue/20 text-aurora-blue rounded">
          Moderator
        </span>
      );
    }
    return null;
  };

  const getStatusBadge = (member: Member) => {
    if (member.status === "muted" && member.mutedUntil) {
      const mutedUntil = new Date(member.mutedUntil);
      if (mutedUntil > new Date()) {
        return (
          <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500/20 text-orange-500 rounded">
            Muted
          </span>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  if (!chatInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <div className="sticky top-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/chats/${chatId}`)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Chat Settings</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[45px] bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {chatInfo.requireApproval && (
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                  activeTab === "requests"
                    ? "text-aurora-green"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Join Requests
                {joinRequests.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-aurora-green text-black rounded-full">
                    {joinRequests.length}
                  </span>
                )}
                {activeTab === "requests" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aurora-green" />
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === "members"
                  ? "text-aurora-green"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Members ({members.length})
              {activeTab === "members" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aurora-green" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("pinned")}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === "pinned"
                  ? "text-aurora-green"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pinned ({pinnedMessages.length})
              {activeTab === "pinned" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aurora-green" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === "settings"
                  ? "text-aurora-green"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Settings
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aurora-green" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Join Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            {joinRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No pending requests</h3>
                <p className="text-gray-400">All join requests have been reviewed</p>
              </div>
            ) : (
              joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    {getUserAvatar(request.user)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {request.user.name}
                        </h3>
                        {request.user.username && (
                          <span className="text-sm text-gray-400">
                            @{request.user.username}
                          </span>
                        )}
                      </div>
                      {request.message && (
                        <p className="text-sm text-gray-300 mb-2">{request.message}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleJoinRequestAction(request.id, "approve")}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-aurora-green hover:bg-aurora-green/80 text-black font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === request.id ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleJoinRequestAction(request.id, "reject")}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === request.id ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="space-y-3">
            {members.map((member) => {
              const isOwner = member.role === "owner";
              const isSelf = session?.user?.id === member.user.id;
              const canModify = !isOwner && !isSelf;

              return (
                <div
                  key={member.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {getUserAvatar(member.user)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {member.user.name}
                        </h3>
                        {getRoleBadge(member.role)}
                        {getStatusBadge(member)}
                        {isSelf && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-gray-500/20 text-gray-400 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                      </p>
                    </div>

                    {canModify && (
                      <div className="flex gap-2">
                        {member.status === "muted" ? (
                          <button
                            onClick={() => handleMemberAction(member.id, "unmute")}
                            disabled={actionLoading === member.id}
                            className="text-sm text-aurora-green hover:text-aurora-green/80 font-semibold disabled:opacity-50"
                          >
                            Unmute
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMemberAction(member.id, "mute")}
                            disabled={actionLoading === member.id}
                            className="text-sm text-orange-500 hover:text-orange-400 font-semibold disabled:opacity-50"
                          >
                            Mute
                          </button>
                        )}

                        {member.role === "member" && chatInfo.membership?.role === "owner" && (
                          <button
                            onClick={() => handleMemberAction(member.id, "promote")}
                            disabled={actionLoading === member.id}
                            className="text-sm text-aurora-blue hover:text-aurora-blue/80 font-semibold disabled:opacity-50"
                          >
                            Promote
                          </button>
                        )}

                        {member.role === "moderator" && chatInfo.membership?.role === "owner" && (
                          <button
                            onClick={() => handleMemberAction(member.id, "demote")}
                            disabled={actionLoading === member.id}
                            className="text-sm text-gray-400 hover:text-gray-300 font-semibold disabled:opacity-50"
                          >
                            Demote
                          </button>
                        )}

                        <button
                          onClick={() => handleMemberAction(member.id, "kick")}
                          disabled={actionLoading === member.id}
                          className="text-sm text-red-500 hover:text-red-400 font-semibold disabled:opacity-50"
                        >
                          Kick
                        </button>

                        <button
                          onClick={() => handleMemberAction(member.id, "ban")}
                          disabled={actionLoading === member.id}
                          className="text-sm text-red-600 hover:text-red-500 font-semibold disabled:opacity-50"
                        >
                          Ban
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pinned Messages Tab */}
        {activeTab === "pinned" && (
          <div className="space-y-3">
            {pinnedMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No pinned messages</h3>
                <p className="text-gray-400">Important messages can be pinned here</p>
              </div>
            ) : (
              pinnedMessages.map((message) => (
                <div
                  key={message.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    {getUserAvatar(message.user)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {message.user.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnpinMessage(message.id)}
                      disabled={actionLoading === message.id}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white mb-1">Slow Mode</h3>
                  <p className="text-sm text-gray-400">
                    Members can only send a message every 30 seconds
                  </p>
                </div>
                <button
                  onClick={handleSlowModeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    chatInfo.slowModeSeconds
                      ? "bg-aurora-green"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      chatInfo.slowModeSeconds
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="font-semibold text-white mb-2">Chat Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Chat Type:</span>
                  <span className="text-white">{chatInfo.groupType.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Visibility:</span>
                  <span className="text-white capitalize">{chatInfo.visibility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Requires Approval:</span>
                  <span className="text-white">{chatInfo.requireApproval ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
