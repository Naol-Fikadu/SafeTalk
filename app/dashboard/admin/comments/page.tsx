'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Flag,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { toast } from 'react-hot-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  reports_count: number;
  is_spam: boolean;
}

export default function CommentsManagementPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: searchQuery,
        status: filterStatus,
      });
      const response = await fetch(`/api/admin/comments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setComments(data.comments);
      setTotalPages(data.pagination.totalPages);
      setTotalComments(data.pagination.total);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterStatus]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentAction = async (commentId: string, action: string) => {
    setActionLoading(commentId);
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, action }),
      });
      if (response.ok) {
        toast.success(`Comment ${action}d`);
        fetchComments(); // refresh
      } else {
        toast.error(`Failed to ${action} comment`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} comment`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Comments Management</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchComments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Comments</p>
            <p className="text-2xl font-bold">{totalComments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Reported</p>
            <p className="text-2xl font-bold">{comments.filter(c => c.reports_count > 0).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Spam</p>
            <p className="text-2xl font-bold">{comments.filter(c => c.is_spam).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search comments..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchComments}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comments.map((comment) => (
                  <motion.tr
                    key={comment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <Avatar src={comment.avatar_url} alt={comment.username} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{comment.full_name || comment.username}</p>
                          <p className="text-xs text-gray-500">@{comment.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-md">
                      <p className="text-sm line-clamp-2">{comment.content}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm">❤️ {comment.likes_count}</span>
                    </td>
                    <td className="px-4 py-4">
                      {comment.is_spam ? (
                        <Badge variant="destructive">Spam</Badge>
                      ) : comment.reports_count > 0 ? (
                        <Badge variant="warning">Reported ({comment.reports_count})</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading === comment.id}>
                            {actionLoading === comment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {comment.is_spam ? (
                            <DropdownMenuItem onClick={() => handleCommentAction(comment.id, 'not-spam')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Not Spam
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleCommentAction(comment.id, 'spam')}>
                              <Flag className="h-4 w-4 mr-2" />
                              Mark as Spam
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleCommentAction(comment.id, 'delete')} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {comments.length} of {totalComments} comments
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}