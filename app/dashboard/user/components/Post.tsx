"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Users,
  Lock,
  Star,
  Trash2,
  Edit,
  Archive,
  Smile,
  Send,
  X,
  Loader2,
  Play,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { toast } from "react-hot-toast";

interface PostProps {
  post: any;
  currentUserId: string;
  onUpdate?: (post: any) => void;
  onSave?: (postId: string, saved: boolean) => void;
  onDelete?: (postId: string) => void;
}

export function Post({ post, currentUserId, onUpdate, onSave, onDelete }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>(post.recent_comments || []);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count || 0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const visibilityIcons = {
    public: <Globe className="h-4 w-4" />,
    followers: <Users className="h-4 w-4" />,
    close_friends: <Lock className="h-4 w-4" />,
  };

  const reactions = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"];

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });
      const data = await res.json();

      setIsLiked(data.liked);
      setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleReaction = async (reactionType: string) => {
    try {
      const res = await fetch(`/api/posts/${post.id}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: reactionType }),
      });

      if (res.ok) {
        setReaction(reactionType);
        setShowReactionPicker(false);
        toast.success(`Reacted with ${reactionType}`);
      }
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "default" }),
      });

      const data = await res.json();
      setIsSaved(data.saved);
      onSave?.(post.id, data.saved);
      toast.success(data.saved ? "Post saved!" : "Post removed from saved");
    } catch (error) {
      toast.error("Failed to save post");
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
        setCommentsCount(data.length);
      }
    } catch (error) {
      toast.error("Failed to load comments");
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);


  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.username}`,
        text: post.content,
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/post/${post.id}`,
      );
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete?.(post.id);
        toast.success("Post deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/archive`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.archived) {
        onDelete?.(post.id); // Remove from feed
        toast.success("Post archived");
      }
    } catch (error) {
      toast.error("Failed to archive post");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });

      if (res.ok) {
        const newComment = await res.json();
        const updatedCount = commentsCount + 1;
        setComments((prev) => [newComment, ...prev]);
        setCommentsCount(updatedCount);
        onUpdate?.({ ...post, comments_count: updatedCount });
        setComment("");
        toast.success("Comment added");
      } else {
        const data = await res.json();
        toast.error(data?.error || "Failed to add comment");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReply = async (parentCommentId: string) => {
    const content = replyText[parentCommentId]?.trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId: parentCommentId }),
      });

      if (res.ok) {
        const newReply = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentCommentId
              ? { ...c, replies: [...(c.replies || []), newReply] }
              : c,
          ),
        );
        const updatedCount = commentsCount + 1;
        setCommentsCount(updatedCount);
        onUpdate?.({ ...post, comments_count: updatedCount });
        setReplyText((prev) => ({ ...prev, [parentCommentId]: "" }));
        setReplyingTo(null);
        toast.success("Reply posted");
      } else {
        const data = await res.json();
        toast.error(data?.error || "Failed to post reply");
      }
    } catch (error) {
      toast.error("Failed to post reply");
    }
  };


  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.username}`}>
            <Avatar src={post.avatar_url} alt={post.username} size="md" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/profile/${post.username}`}
                className="font-semibold hover:underline"
              >
                {post.full_name || post.username}
              </Link>
              {post.is_verified && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </span>
              <span className="text-gray-400">
                {visibilityIcons[post.visibility]}
              </span>
            </div>
            <p className="text-sm text-gray-500">@{post.username}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {post.user_id === currentUserId ? (
              <>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  {isArchiving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4 mr-2" />
                  )}
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem>Report post</DropdownMenuItem>
                <DropdownMenuItem>Hide post</DropdownMenuItem>
                <DropdownMenuItem>Unfollow @{post.username}</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-2">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/hashtag/${tag}`}
                className="text-blue-500 hover:underline text-sm"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Post Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div
          className={`grid ${
            post.media_urls.length === 1
              ? "grid-cols-1"
              : post.media_urls.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
          } gap-1`}
        >
          {post.media_urls.map((url: string, index: number) => (
            <div
              key={index}
              className={`relative ${
                post.media_urls.length === 1 ? "h-96" : "h-48"
              }`}
            >
              {post.media_types?.[index] === "video" ? (
                <video
                  src={url}
                  controls
                  className="w-full h-full object-cover"
                  playsInline
                />
              ) : (
                <Image
                  src={url}
                  alt={`Post media ${index + 1}`}
                  fill
                  className="object-cover cursor-pointer hover:opacity-95 transition"
                  onClick={() => window.open(url, "_blank")}
                />
              )}
            </div>
          ))}
        </div>
      )}


      {/* Post Stats */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 hover:text-red-500 transition"
            >
              <Heart
                className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span className="font-medium">{likesCount}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 hover:text-blue-500 transition"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">{commentsCount}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-green-500 transition">
              <Share2 className="h-5 w-5" />
              <span className="font-medium">{post.shares_count || 0}</span>
            </button>
          </div>
          <button onClick={handleSave}>
            <Bookmark
              className={`h-5 w-5 ${isSaved ? "fill-purple-600 text-purple-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            {/* Comment Input */}
            <div className="p-4">
              <form onSubmit={handleComment} className="flex space-x-2">
                <Avatar src={post.avatar_url} alt="You" size="sm" />
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[40px] max-h-[80px] resize-none pr-12"
                    rows={1}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!comment.trim() || isSubmittingComment}
                    className="absolute right-2 bottom-2 h-6 w-6 bg-purple-600 hover:bg-purple-700 rounded-full"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div className="px-4 pb-4 space-y-3">
              {(showAllComments ? comments : comments.slice(0, 2)).map(
                (comment: any) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex space-x-2">
                      <Avatar
                        src={comment.user?.avatar_url}
                        alt={comment.user?.username}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                          <Link
                            href={`/profile/${comment.user?.username}`}
                            className="font-semibold text-sm hover:underline"
                          >
                            {comment.user?.full_name || comment.user?.username}
                          </Link>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          <button
                            onClick={() => {
                              setReplyingTo(comment.id);
                              setReplyText((prev) => ({ ...prev, [comment.id]: "" }));
                            }}
                            className="hover:text-gray-700"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {comment.replies?.length > 0 && (
                      <div className="ml-10 space-y-2">
                        {comment.replies.map((reply: any) => (
                          <div key={reply.id} className="flex space-x-2">
                            <Avatar
                              src={reply.user?.avatar_url}
                              alt={reply.user?.username}
                              size="sm"
                            />
                            <div className="flex-1">
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                                <Link
                                  href={`/profile/${reply.user?.username}`}
                                  className="font-semibold text-sm hover:underline"
                                >
                                  {reply.user?.full_name || reply.user?.username}
                                </Link>
                                <p className="text-sm">{reply.content}</p>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(reply.created_at), {
                                  addSuffix: true,
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {replyingTo === comment.id && (
                      <div className="ml-10 flex items-start space-x-2">
                        <Textarea
                          value={replyText[comment.id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [comment.id]: e.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          className="min-h-[34px] h-auto"
                        />
                        <Button
                          onClick={() => handleReply(comment.id)}
                          disabled={!replyText[comment.id]?.trim()}
                          className="h-8"
                        >
                          Send
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ),
              )}

              {comments.length > 2 && !showAllComments && (
                <button
                  onClick={() => setShowAllComments(true)}
                  className="text-sm text-purple-600 hover:underline"
                >
                  View all {comments.length} comments
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

