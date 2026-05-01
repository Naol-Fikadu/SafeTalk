'use client';

import { useState } from 'react';
import { Star, StarOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface CloseFriendButtonProps {
  userId: string;
  initialIsCloseFriend: boolean;
}

export function CloseFriendButton({ userId, initialIsCloseFriend }: CloseFriendButtonProps) {
  const [isCloseFriend, setIsCloseFriend] = useState(initialIsCloseFriend);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsCloseFriend(!isCloseFriend);
      toast.success(isCloseFriend ? 'Removed from close friends' : 'Added to close friends');
    } catch (error) {
      toast.error('Failed to update close friend status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant="outline"
      size="icon"
      className={isCloseFriend ? 'text-yellow-500 hover:text-yellow-600' : ''}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isCloseFriend ? (
        <Star className="h-4 w-4 fill-current" />
      ) : (
        <StarOff className="h-4 w-4" />
      )}
    </Button>
  );
}