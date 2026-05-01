'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Grid3x3, List, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Post } from '@/app/dashboard/user/components/Post';

export default function SavedPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/saved');
        if (!res.ok) throw new Error('Failed to fetch saved posts');
        const data = await res.json();
        setSavedPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading saved posts:', err);
        setError('Could not load saved posts. Please try again.');
        toast.error('Could not load saved posts');
      } finally {
        setLoading(false);
      }
    };

    loadSavedPosts();
  }, []);

  const handleSavedToggle = (postId: string, isSaved: boolean) => {
    if (!isSaved) {
      setSavedPosts((prev) => prev.filter((post) => post.id !== postId));
      toast.success('Removed from saved');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold flex items-center">
            <Bookmark className="h-6 w-6 mr-2" />
            Saved Posts
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-xl">
            <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <h2 className="text-lg font-semibold mb-1">No saved posts yet</h2>
            <p className="text-gray-500">Tap the bookmark icon on any post to save it here.</p>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {savedPosts.map((post) => (
              <Post key={post.id} post={post} currentUserId={post.user_id} onSave={handleSavedToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}