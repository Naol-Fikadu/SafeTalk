'use client';

import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      queryClient.setQueryData(['unreadNotifications'], data.unreadCount || 0);
      return data.notifications || [];
    }
  });

  const markAsRead = async (notificationId: string | 'all' | 'all-soft') => {
    const isSoft = notificationId === "all-soft";
    const payloadId = (notificationId === "all" || notificationId === "all-soft") ? undefined : notificationId;

    try {
      if (payloadId) {
        queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
          if (!old) return old;
          return old.map(n => n.id === payloadId ? { ...n, is_read: true } : n);
        });
        queryClient.setQueryData<number>(['unreadNotifications'], (old = 0) => Math.max(0, old - 1));
      } else {
        if (!isSoft) {
          queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
            if (!old) return old;
            return old.map(n => ({ ...n, is_read: true }));
          });
        }
        queryClient.setQueryData<number>(['unreadNotifications'], 0);
      }

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          payloadId
            ? { action: "markAsRead", notificationId: payloadId }
            : { action: "markAllAsRead" }
        ),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAllAsRead = () => {
    markAsRead("all");
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  const NotificationList = ({ items }: { items: Notification[] }) => {
    if (isLoading) {
      return <div className="text-center py-8 text-gray-500 text-sm animate-pulse">Loading notifications...</div>;
    }

    if (items.length === 0) {
      return <div className="text-center py-8 text-gray-500 text-sm">No notifications to show.</div>;
    }

    return (
      <div className="space-y-3">
        {items.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              if (!notification.is_read) {
                markAsRead(notification.id);
              }
              if (notification.type === 'follow') {
                router.push(`/profile/${notification.actor.username}`);
              } else if (notification.post?.id) {
                router.push(`/post/${notification.post.id}`);
              }
            }}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition cursor-pointer ${
              !notification.is_read ? 'border-l-4 border-purple-600' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <Avatar src={notification.actor.avatar_url} alt={notification.actor.username} />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">@{notification.actor.username}</span>{' '}
                  {notification.content}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  - {new Date(notification.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="w-6 h-6 flex items-center justify-center">
                {getIcon(notification.type)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={unreadNotifications.length === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadNotifications.length > 0 && `(${unreadNotifications.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <NotificationList items={notifications} />
          </TabsContent>
          <TabsContent value="unread">
            <NotificationList items={unreadNotifications} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}