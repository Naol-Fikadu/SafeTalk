// components/comments/CommentSection.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  created_at: string;
  username: string;
  full_name: string;
  avatar_url: string;
  replies: Comment[];
}

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export default function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  // Helper function to count total comments (including replies)
  const countTotalComments = useCallback((commentsList: Comment[]): number => {
    let total = commentsList.length;
    commentsList.forEach(comment => {
      if (comment.replies?.length) {
        total += countTotalComments(comment.replies);
      }
    });
    return total;
  }, []);

  // Update parent component when comment count changes
  const updateCommentCount = useCallback((newComments: Comment[]) => {
    const totalCount = countTotalComments(newComments);
    if (onCommentCountChange) {
      onCommentCountChange(totalCount);
    }
  }, [countTotalComments, onCommentCountChange]);

  // Fetch comments from database
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/posts/${postId}/comments?t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data);
      updateCommentCount(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please refresh the page.');
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId, updateCommentCount]);

  // Fetch comments on component mount and when postId changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    if (!session) {
      toast.error('Please sign in to comment');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyTo?.id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      const newCommentData = await response.json();
      
      // Refresh comments to get the latest from database
      await fetchComments();
      
      setNewComment('');
      setReplyTo(null);
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: newContent.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }

      // Refresh comments to get the latest from database
      await fetchComments();
      setEditingComment(null);
      toast.success('Comment edited successfully!');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Refresh comments to get the latest from database
      await fetchComments();
      toast.success('Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const isAuthor = session?.user?.id === comment.user_id;

    const handleSubmitReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyContent.trim()) return;

      try {
        setSubmittingReply(true);
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: replyContent.trim(),
            parentId: comment.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to post reply');
        }

        // Refresh comments to get the latest from database
        await fetchComments();
        
        setReplyContent('');
        setShowReplyForm(false);
        toast.success('Reply posted successfully!');
      } catch (error) {
        console.error('Error posting reply:', error);
        toast.error('Failed to post reply');
      } finally {
        setSubmittingReply(false);
      }
    };

    return (
      <div className={`${isReply ? 'ml-8 mt-2' : 'mt-4'} border-l-2 border-gray-200 pl-4`}>
        <div className="p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {comment.avatar_url ? (
                <img
                  src={comment.avatar_url}
                  alt={comment.username}
                  className="object-cover w-8 h-8 rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                  {comment.full_name?.charAt(0) || comment.username?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {comment.full_name || comment.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {isAuthor && !isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(comment.content);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
              />
              <div className="flex mt-2 space-x-2">
                <button
                  onClick={() => handleEditComment(comment.id, editContent)}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm text-gray-700 bg-gray-300 rounded-lg dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-gray-700 dark:text-gray-300">{comment.content}</p>
          )}

          {!isEditing && session && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
          )}

          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={2}
                disabled={submittingReply}
              />
              <div className="flex mt-2 space-x-2">
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingReply ? 'Posting...' : 'Post Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1 text-sm text-gray-700 bg-gray-300 rounded-lg dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentComponent key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchComments}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const totalComments = countTotalComments(comments);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Comments ({totalComments})
      </h3>

      {/* Comment Form */}
      {session ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? `Replying to ${replyTo.full_name || replyTo.username}...` : "Write a comment..."}
            className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            rows={3}
            disabled={submitting}
          />
          <div className="flex items-center justify-between mt-2">
            {replyTo && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Replying to {replyTo.full_name || replyTo.username}
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Cancel
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : replyTo ? 'Post Reply' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 mb-6 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            Please <a href="/api/auth/signin" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">sign in</a> to join the conversation.
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentComponent key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}