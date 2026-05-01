"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Hash, TrendingUp, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useSession } from "next-auth/react";

interface TrendingTopic {
  id: string;
  name: string;
  posts_count: number;
}

interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

export function TrendingSidebar() {
  const { data: session } = useSession();
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/trending/hashtags');
        const data = await res.json();
        setTrending(data.trending || []);
      } catch (error) {
        console.error('Failed to fetch trending hashtags:', error);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrending();
  }, []);

  // Fetch suggested users
  useEffect(() => {
    const fetchSuggested = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch('/api/users/suggested');
        const data = await res.json();
        setSuggested(data.suggested || []);
      } catch (error) {
        console.error('Failed to fetch suggested users:', error);
      } finally {
        setLoadingSuggested(false);
      }
    };
    fetchSuggested();
  }, [session]);

  const handleFollow = async (userId: string) => {
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      const data = await res.json();
      setFollowingMap(prev => ({ ...prev, [userId]: data.following }));
      // Optionally refresh suggested list or remove followed user
      if (data.following) {
        // Remove from suggestions after follow
        setSuggested(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Loading skeleton for trending
  if (loadingTrending) {
    return (
      <div className="space-y-4 sticky top-20">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sticky top-20">
      {/* Trending Topics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
        <h2 className="font-semibold mb-3 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
          Trending This Week
        </h2>
        <div className="space-y-2">
          {trending.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">No trending topics</p>
          ) : (
            trending.map((topic) => (
              <Link
                key={topic.id}
                href={`/hashtag/${topic.name}`}
                className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition"
              >
                <div className="flex items-center">
                  <Hash className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium">#{topic.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {topic.posts_count} {topic.posts_count === 1 ? 'post' : 'posts'}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Suggested Users */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
        <h2 className="font-semibold mb-3 flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-600" />
          Suggested for You
        </h2>
        <div className="space-y-3">
          {loadingSuggested ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))
          ) : suggested.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">No suggestions</p>
          ) : (
            suggested.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <Link
                  href={`/profile/${user.username}`}
                  className="flex items-center space-x-2 flex-1 min-w-0"
                >
                  <Avatar src={user.avatar_url} alt={user.username} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFollow(user.id)}
                  disabled={followLoading[user.id]}
                >
                  {followLoading[user.id] ? '...' : 'Follow'}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}