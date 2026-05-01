// app/posts/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CommentSection from '@/components/comments/CommentSection';

interface Post {
  id: string;
  title?: string;
  content: string;
  user_id: string;
  created_at: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  media_urls?: string[];
  media_types?: string[];
  comments_count: number;
}

export default function PostPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch post data from API
  const fetchPost = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/posts/${id}?t=${Date.now()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error('Failed to fetch post');
      }
      
      const data = await response.json();
      setPost(data);
      setCommentCount(data.comments_count || 0);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError(error instanceof Error ? error.message : 'Failed to load post');
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Handle comment count updates from CommentSection
  const handleCommentCountChange = useCallback((newCount: number) => {
    setCommentCount(newCount);
    // Optionally update the post's comments_count in the background
    setPost(prev => prev ? { ...prev, comments_count: newCount } : null);
  }, []);

  // Refresh post data (for when comments are added/deleted)
  const refreshPostData = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPost();
    setIsRefreshing(false);
  }, [fetchPost]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch post on mount and when post ID changes
  useEffect(() => {
    if (id && status === 'authenticated') {
      fetchPost();
    }
  }, [id, status, fetchPost]);

  // Handle loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <div className="mb-4 text-red-500">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {error === 'Post not found' ? 'Post Not Found' : 'Error Loading Post'}
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchPost();
              }}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if no session
  if (!session) {
    return null;
  }

  // Handle case where post is null after loading
  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Post not available</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          
          <button
            onClick={refreshPostData}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <svg 
              className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Post Content */}
        <div className="mb-8 overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <div className="p-6">
            <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              {post.title}
            </h1>
            
            {/* Author Info */}
            <div className="flex items-center mb-4 space-x-3">
              {post.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt={post.username}
                  className="object-cover w-10 h-10 rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                  {post.full_name?.charAt(0) || post.username?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {post.full_name || post.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            {/* Post Text Content */}
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                {post.content}
              </p>
            </div>

            {/* Post Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-6 space-y-4">
                {post.media_urls.map((url, index) => (
                  <div key={index} className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                    {post.media_types?.[index] === 'video' ? (
                      <video 
                        src={url} 
                        controls 
                        className="w-full max-h-[600px] object-contain"
                      />
                    ) : (
                      <img 
                        src={url} 
                        alt={`Media ${index + 1}`}
                        className="w-full max-h-[600px] object-contain mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Post Stats */}
            <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                <div 
                  className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => {
                    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>
                    {commentCount.toLocaleString()} {commentCount === 1 ? 'Comment' : 'Comments'}
                  </span>
                </div>
                
                {/* Optional: Add like button or other stats here */}
                {/* <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>0 Likes</span>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Section */}
        <div id="comments-section">
          <CommentSection 
            postId={id} 
            onCommentCountChange={handleCommentCountChange}
          />
        </div>
      </div>
    </div>
  );
}