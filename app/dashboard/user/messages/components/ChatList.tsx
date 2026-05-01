// app/(dashboard)/user/messages/components/ChatList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Search, Plus, MoreVertical } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { pusherClient } from "@/lib/pusher";

interface Chat {
  id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_online: boolean;
  };
  lastMessage: {
    content: string;
    created_at: string;
    is_read: boolean;
  };
  unreadCount: number;
}

interface ChatListProps {
  userId: string;
}

export function ChatList({ userId }: ChatListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get("chat");

  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();

    // Subscribe to Pusher for real-time updates
    const channel = pusherClient.subscribe(`user-${userId}`);

    channel.bind("new-message", (data: any) => {
      updateChatWithNewMessage(data);
    });

    channel.bind("message-read", (data: any) => {
      updateChatReadStatus(data.chatId);
    });

    channel.bind("user-online", (data: any) => {
      updateUserOnlineStatus(data.userId, true);
    });

    channel.bind("user-offline", (data: any) => {
      updateUserOnlineStatus(data.userId, false);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/messages/chats");
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateChatWithNewMessage = (data: any) => {
    setChats((prev) => {
      const existingChat = prev.find((c) => c.id === data.chatId);

      if (existingChat) {
        return prev.map((chat) =>
          chat.id === data.chatId
            ? {
                ...chat,
                lastMessage: {
                  content: data.content,
                  created_at: data.createdAt,
                  is_read: false,
                },
                unreadCount:
                  chat.unreadCount + (data.senderId !== userId ? 1 : 0),
              }
            : chat,
        );
      } else {
        // New chat, fetch it
        fetchChats();
        return prev;
      }
    });
  };

  const updateChatReadStatus = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              unreadCount: 0,
              lastMessage: { ...chat.lastMessage, is_read: true },
            }
          : chat,
      ),
    );
  };

  const updateUserOnlineStatus = (targetUserId: string, isOnline: boolean) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.user.id === targetUserId
          ? { ...chat, user: { ...chat.user, is_online: isOnline } }
          : chat,
      ),
    );
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="h-full p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button variant="ghost" size="icon">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet</p>
            <Button variant="link" className="mt-2">
              Start a conversation
            </Button>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => router.push(`/messages?chat=${chat.id}`)}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                activeChatId === chat.id ? "bg-gray-50 dark:bg-gray-800" : ""
              }`}
            >
              <div className="relative">
                <Avatar src={chat.user.avatar_url} alt={chat.user.username} />
                {chat.user.is_online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">
                    {chat.user.full_name || chat.user.username}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(
                      new Date(chat.lastMessage.created_at),
                      { addSuffix: true },
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage.content}
                  </p>
                  {chat.unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
