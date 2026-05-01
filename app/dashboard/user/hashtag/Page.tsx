// app/(dashboard)/user/hashtag/[tag]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Hash, Users, Calendar, TrendingUp, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Post } from "../../components/Post";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";

interface HashtagData {
  id: string;
  name: string;
  posts_count: number;
  created_at: string;
  is_following: boolean;
  related_hashtags: Array<{
    name: string;
    posts_count: number;
  }>;
  top_posts: any[];
}

export default function HashtagPage() {
  const { tag } = useParams();
  const { data: session } = useSession();
  const [hashtagData, setHashtagData] = useState<HashtagData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchHashtagData();
  }, [tag]);

  const fetchHashtagData = async () => {
    try {
      const [hashtagRes, postsRes] = await Promise.all([
        fetch(`/api/hashtags/${tag}`),
        fetch(`/api/hashtags/${tag}/posts?sort=${activeTab}`),
      ]);

      const hashtagData = await hashtagRes.json();
      const postsData = await postsRes.json();

      setHashtagData(hashtagData);
      setPosts(postsData);
      setIsFollowing(hashtagData.is_following);
    } catch (error) {
      console.error("Failed to fetch hashtag data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!session) {
      toast.error("Please login to follow hashtags");
      return;
    }

    try {
      const response = await fetch(`/api/hashtags/${tag}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? "Unfollowed hashtag" : "Following hashtag");
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hashtagData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-4xl text-center">
          <Hash className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Hashtag not found</h1>
          <p className="text-gray-500">
            The hashtag #{tag} doesn't exist or has no posts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Hash className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">#{hashtagData.name}</h1>
                  <p className="text-gray-500">
                    {hashtagData.posts_count.toLocaleString()} posts
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Started{" "}
                  {formatDistanceToNow(new Date(hashtagData.created_at), {
                    addSuffix: true,
                  })}
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Trending
                </div>
              </div>
            </div>

            {session && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
              >
                {isFollowing ? (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Follow Hashtag
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Related Hashtags */}
        {hashtagData.related_hashtags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="text-lg font-semibold mb-3">Related Hashtags</h2>
            <div className="flex flex-wrap gap-2">
              {hashtagData.related_hashtags.map((related) => (
                <a
                  key={related.name}
                  href={`/hashtag/${related.name}`}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1 rounded-full text-sm transition"
                >
                  #{related.name}
                  <span className="text-gray-500 ml-1">
                    ({related.posts_count})
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="top">Top</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                  <Hash className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No posts found</p>
                </div>
              ) : (
                posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    currentUserId={session?.user.id}
                    onUpdate={() => fetchHashtagData()}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
