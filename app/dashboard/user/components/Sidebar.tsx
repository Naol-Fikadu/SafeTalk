"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Users,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Bookmark,
  Calendar,
  Video,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  user: any;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/dashboard/user", icon: Home },
    { name: "Profile", href: `/profile/${user.username}`, icon: User },
    { name: "Messages", href: "/messages", icon: MessageCircle },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Saved", href: "/saved", icon: Bookmark },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/unread-count');
      const data = await res.json();
      return data.unreadCount || 0;
    },
    enabled: !!user,
  });

  const { data: savedCount = 0 } = useQuery({
    queryKey: ['savedCount'],
    queryFn: async () => {
      const res = await fetch('/api/saved/count');
      const data = await res.json();
      return data.count || 0;
    },
    enabled: !!user,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sticky top-20">
      {/* User Info */}
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Avatar src={user.avatar_url} alt={user.username} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user.name || user.username}</p>
          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition",
                isActive
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.name === "Notifications" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shrink-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {item.name === 'Saved' && savedCount > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full shrink-0">
                  {savedCount > 99 ? '99+' : savedCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <Button
        variant="ghost"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-5 w-5 mr-3" />
        Logout
      </Button>
    </div>
  );
}
