'use client';

interface CommentsProps {
  postId: string;
  currentUserId: string;
  onClose: () => void;
}

export function Comments({ postId, currentUserId, onClose }: CommentsProps) {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <p>Comments component coming soon...</p>
    </div>
  );
}