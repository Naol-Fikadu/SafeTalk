'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Flag,
  Loader2,
  RefreshCw,
  Download,
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

interface Report {
  id: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_username: string;
  reporter_avatar: string;
  reported_user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  reported_post?: {
    id: string;
    content: string;
    user: { username: string; full_name: string };
  };
  reported_comment?: {
    id: string;
    content: string;
    user: { username: string; full_name: string };
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        status: filterStatus,
        type: filterType,
      });
      const response = await fetch(`/api/admin/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setReports(data.reports);
      setTotalPages(data.pagination.totalPages);
      setTotalReports(data.pagination.total);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleReportAction = async (reportId: string, action: string) => {
    setActionLoading(reportId);
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      });
      if (response.ok) {
        toast.success(`Report ${action}d`);
        fetchReports(); // refresh list
      } else {
        toast.error(`Failed to ${action} report`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} report`);
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
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchReports}>
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
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-2xl font-bold">{totalReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-2xl font-bold">{reports.filter(r => r.status === 'resolved').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchReports}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <Avatar src={report.reporter_avatar} alt={report.reporter_username} size="sm" />
                        <span className="text-sm font-medium">@{report.reporter_username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {report.reported_user && (
                        <span>User: @{report.reported_user.username}</span>
                      )}
                      {report.reported_post && (
                        <div>
                          <span className="font-medium">Post by @{report.reported_post.user.username}</span>
                          <p className="text-xs text-gray-500 line-clamp-1">{report.reported_post.content}</p>
                        </div>
                      )}
                      {report.reported_comment && (
                        <div>
                          <span className="font-medium">Comment by @{report.reported_comment.user.username}</span>
                          <p className="text-xs text-gray-500 line-clamp-1">{report.reported_comment.content}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium">{report.reason}</p>
                        {report.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{report.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="capitalize">
                        {report.reported_post ? 'Post' : report.reported_comment ? 'Comment' : 'User'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      {report.status === 'pending' && (
                        <Badge variant="warning">Pending</Badge>
                      )}
                      {report.status === 'resolved' && (
                        <Badge variant="success">Resolved</Badge>
                      )}
                      {report.status === 'dismissed' && (
                        <Badge variant="secondary">Dismissed</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading === report.id}>
                            {actionLoading === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {report.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleReportAction(report.id, 'resolve')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Resolve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReportAction(report.id, 'dismiss')}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Dismiss
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReportAction(report.id, 'remove_content')} className="text-red-600">
                                <Flag className="h-4 w-4 mr-2" />
                                Remove Content
                              </DropdownMenuItem>
                            </>
                          )}
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
          Showing {reports.length} of {totalReports} reports
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