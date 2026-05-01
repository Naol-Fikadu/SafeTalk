'use client';

import { useState } from 'react'; // Add this missing import
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
  '2xl': 'h-40 w-40',
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const [error, setError] = useState(false);

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {src && !error ? (
        <Image
          src={src}
          alt={alt || 'Avatar'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          onError={() => setError(true)}
          unoptimized={src?.includes('utfs.io')}
        />
      ) : (
        <User className="h-1/2 w-1/2 text-gray-400" />
      )}
    </div>
  );
}