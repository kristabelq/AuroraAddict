"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import toast from "react-hot-toast";
import PendingJoinRequests from "@/components/PendingJoinRequests";

interface Message {
  id: string;
  content: string;
  messageType: string;
  createdAt: string;
  isEdited: boolean;
  isPinned: boolean;
  user: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
}

interface ChatInfo {
  id: string;
  name: string;
  description: string | null;
  groupType: string;
  visibility: string;
  areaName: string;
  memberCount: number;
  isVerified: boolean;
  businessCategory: string | null;
  owner: {
    id: string;
    name: string;
    businessName: string | null;
  } | null;
  memberRole: string;
  canModerate: boolean;
}

export default function ChatRoomPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch chat info and messages
  useEffect(() => {
    if (!chatId) return;

    Promise.all([
      fetch(`/api/chats/${chatId}`).then(res => res.json()),
      fetch(`/api/chats/${chatId}/messages`).then(res => res.json())
    ])
      .then(([chatData, messagesData]) => {
        if (chatData.error) {
          toast.error(chatData.error);
          router.push("/chats");
          return;
        }
        setChatInfo(chatData);
        setMessages(messagesData.messages || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching chat:", error);
        toast.error("Failed to load chat");
        router.push("/chats");
      });
  }, [chatId, router]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || sending) return;

    setSending(true);
    const tempMessage = messageInput;
    setMessageInput(""); // Clear input immediately for better UX

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmedMessage,
          messageType: "text",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Add the new message to the list
      setMessages((prev) => [...prev, data.message]);

    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
      setMessageInput(tempMessage); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const getChatIcon = () => {
    if (!chatInfo) return null;

    if (chatInfo.groupType === "area") {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-green to-aurora-blue flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    );
  };

  const getUserAvatar = (user: Message['user']) => {
    if (user.image) {
      return (
        <Image
          src={user.image}
          alt={user.name}
          width={32}
          height={32}
          className="rounded-full"
        />
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-green to-aurora-purple flex items-center justify-center text-white text-sm font-bold">
        {user.name?.charAt(0) || "?"}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-white">Loading chat...</div>
      </div>
    );
  }

  if (!chatInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/chats')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {getChatIcon()}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white truncate">{chatInfo.name}</h1>
                {chatInfo.isVerified && (
                  <svg className="w-4 h-4 text-aurora-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {chatInfo.visibility === "private" && (
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{chatInfo.areaName}</span>
                <span>•</span>
                <span>{chatInfo.memberCount} members</span>
              </div>
            </div>

            {/* Settings button (only for moderators) */}
            {chatInfo.canModerate && (
              <button
                onClick={() => router.push(`/chats/${chatId}/settings`)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Chat Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pending Join Requests (for owners of private chats) */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4">
        <PendingJoinRequests
          chatId={chatId}
          isOwner={chatInfo.owner?.id === session?.user?.id}
        />
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full"
        style={{ paddingBottom: "80px" }} // Space for input
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
            <p className="text-gray-400">Be the first to send a message!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwnMessage = session?.user?.id === message.user.id;
              const showAvatar = index === 0 || messages[index - 1].user.id !== message.user.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {showAvatar ? (
                      getUserAvatar(message.user)
                    ) : (
                      <div className="w-8 h-8" /> // Spacer
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${isOwnMessage ? "items-end" : "items-start"} flex flex-col max-w-[70%]`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                        <span className="text-sm font-semibold text-white">
                          {message.user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? "bg-aurora-green text-black"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {message.isEdited && (
                        <span className="text-xs opacity-60 mt-1 block">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="sticky bottom-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full bg-white/10 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green resize-none max-h-32"
                style={{
                  minHeight: "44px",
                  maxHeight: "128px",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!messageInput.trim() || sending}
              className="bg-aurora-green hover:bg-aurora-green/80 text-black rounded-full p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
