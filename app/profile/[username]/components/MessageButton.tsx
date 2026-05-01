'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface MessageButtonProps {
  userId: string;
}

export function MessageButton({ userId }: MessageButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMessage = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/messages?user=${userId}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMessage}
      disabled={isLoading}
      variant="default" // Changed from outline to default to support gradient
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-sm transition transform active:scale-95"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4 mr-2" />
      )}
      Message
    </Button>
  );
}