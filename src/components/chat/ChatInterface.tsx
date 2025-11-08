"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Message {
  id: string;
  content: string;
  userId: string;
  messageType: string;
  images: string[];
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  reactions: any[];
}

interface ChatInterfaceProps {
  chatGroupId: string;
  isOrganizer?: boolean;
}

export default function ChatInterface({ chatGroupId, isOrganizer = false }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chats/${chatGroupId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [chatGroupId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/chats/${chatGroupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: "text",
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages(); // Refresh messages
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aurora-green"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-[#1a1f2e] rounded-2xl border border-white/10">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.userId === session?.user?.id;
            const isSystem = message.messageType === "system";

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-white/5 text-gray-400 text-sm px-4 py-2 rounded-full">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.user.image ? (
                    <Image
                      src={message.user.image}
                      alt={message.user.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {(message.user.name || message.user.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Message bubble */}
                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                  {!isOwn && (
                    <span className="text-xs text-gray-400 mb-1">
                      {message.user.name || `@${message.user.username}`}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? "bg-aurora-green text-black"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-aurora-green resize-none"
            rows={1}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-aurora-green text-black font-semibold rounded-xl hover:bg-aurora-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </form>
    </div>
  );
}
