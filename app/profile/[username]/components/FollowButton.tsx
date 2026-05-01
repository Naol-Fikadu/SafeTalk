'use client';

import { useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onToggle?: (isFollowing: boolean, newFollowerCount: number) => void; // CHANGED: pass count
}

export function FollowButton({ userId, initialIsFollowing, onToggle }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      
      const data = await res.json(); // data = { following: boolean, followerCount: number }
      
      // Update local button state
      setIsFollowing(data.following);
      // Pass both new status AND exact count to parent
      if (onToggle) onToggle(data.following, data.followerCount);
      
      toast.success(data.following ? 'Following!' : 'Unfollowed');
    } catch (error) {
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      className={isFollowing 
        ? 'relative bg-white text-gray-900 border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-75 active:scale-95' 
        : 'relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-md transition-all duration-75 active:scale-95'}
    >
      <div className="flex items-center justify-center">
        {isLoading && (
          <Loader2 className="absolute h-4 w-4 animate-spin opacity-50" />
        )}
        <div className={cn("flex items-center transition-opacity duration-75", isLoading ? "opacity-30" : "opacity-100")}>
          {isFollowing ? (
            <>
              <UserCheck className="h-4 w-4 mr-2 text-green-500" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Follow
            </>
          )}
        </div>
      </div>
    </Button>
  );
}