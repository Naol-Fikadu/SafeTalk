"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { Post } from "./Post";
import { PostSkeleton } from "./PostSkeleton";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FeedProps {
  userId: string;
}

export function Feed({ userId }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ref, inView } = useInView();

  const loadPosts = useCallback(
    async (reset = false) => {
      if (loading || (!hasMore && !reset)) return;

      setLoading(true);
      setError(null);
      try {
        const currentPage = reset ? 1 : page;
        const response = await fetch(
          `/api/posts?limit=5&offset=${(currentPage - 1) * 5}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }

        const newPosts = await response.json();

        if (newPosts.length < 5) {
          setHasMore(false);
        }

        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
        setPage((prev) => (reset ? 2 : prev + 1));
      } catch (error) {
        console.error("Failed to load posts:", error);
        setError("Failed to load posts. Please try again.");
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [page, loading, hasMore],
  );

  // Add new post to feed immediately
  const handleNewPost = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  useEffect(() => {
    loadPosts(true);
  }, []);

  useEffect(() => {
    if (inView && !initialLoading && !error) {
      loadPosts();
    }
  }, [inView, initialLoading, error, loadPosts]);

  const handlePostUpdate = (updatedPost: any) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post removed from feed");
  };

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => loadPosts(true)}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-500">
            Create your first post or follow some users!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            currentUserId={userId}
            onUpdate={handlePostUpdate}
            onDelete={handlePostDelete}
          />
        ))
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      )}

      {hasMore && !loading && posts.length > 0 && (
        <div ref={ref} className="h-10" />
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-gray-500 py-4">
          You've reached the end! 🎉
        </p>
      )}
    </div>
  );
}
