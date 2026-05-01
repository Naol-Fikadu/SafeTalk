import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: any;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        <Link href={`/profile/${post.username}`}>
          <Avatar src={post.avatar_url} alt={post.username} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Link href={`/profile/${post.username}`} className="font-medium hover:underline">
              {post.full_name || post.username}
            </Link>
            <span className="text-gray-500 text-sm">@{post.username}</span>
            <span className="text-gray-400 text-sm">·</span>
            <span className="text-gray-500 text-sm">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {post.media_urls.map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="rounded-lg object-cover w-full h-48"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}