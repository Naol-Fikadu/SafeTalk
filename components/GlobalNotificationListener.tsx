"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "mention" | "share" | "reaction" | "system";
  actor: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  post?: {
    id: string;
    content: string;
  };
  comment?: {
    id: string;
    content: string;
  };
  content: string;
  is_read: boolean;
  created_at: string;
}

function NotificationToast({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-[350px] pointer-events-auto border-l-4 border-primary cursor-pointer"
      onClick={() => {
        if (notification.type === 'follow') {
          router.push(`/profile/${notification.actor.username}`);
        } else if (notification.post?.id) {
          router.push(`/post/${notification.post.id}`);
        } else {
          router.push("/dashboard/user/notifications");
        }
        onClose();
      }}
    >
      <div className="flex items-start space-x-3">
        <Avatar
          src={notification.actor.avatar_url}
          alt={notification.actor.username}
        />
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-semibold">
              {notification.actor.full_name || notification.actor.username}
            </span>{" "}
            {notification.content}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-xs text-gray-500 hover:text-primary mt-2"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function GlobalNotificationListener() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pusherClient || !session?.user?.id) return;

    const userChannel = pusherClient.subscribe(`user-notifications-${session.user.id}`);

    const handleNewNotification = (data: Notification) => {
      // Don't show toast for own public actions
      if (data.type === 'system' && data.actor.id === session.user.id) return;

      queryClient.setQueryData(['unreadNotifications'], (old: number = 0) => old + 1);

      toast.custom((t) => (
        <NotificationToast
          notification={data}
          onClose={() => toast.dismiss(t.id)}
        />
      ), { duration: 5000, position: "top-right", id: `notification-${data.id || Date.now()}` });
    };

    userChannel.bind("new-notification", handleNewNotification);

    return () => {
      userChannel.unbind("new-notification", handleNewNotification);
      userChannel.unsubscribe();
    };
  }, [session?.user?.id]);

  return null;
}
