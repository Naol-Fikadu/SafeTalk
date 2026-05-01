'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  MessageCircle,
  AlertTriangle,
  Activity,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    } else if (!session.user?.is_admin) {
      router.push('/dashboard/user');
    } else {
      fetchDashboardData();
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats, recent reports, and analytics in parallel
      const [statsRes, reportsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/reports?status=pending&limit=5'),
        fetch('/api/admin/analytics'),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      if (!reportsRes.ok) throw new Error('Failed to fetch reports');
      if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');

      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();
      const analyticsData = await analyticsRes.json();

      setStats(statsData);
      setRecentReports(reportsData.reports || []);
      setUserGrowth(analyticsData.userGrowth || []);
      setTopPosts(analyticsData.topPosts || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Posts"
          value={stats?.totalPosts || 0}
          icon={FileText}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Comments"
          value={stats?.totalComments || 0}
          icon={MessageCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Reports"
          value={stats?.pendingReports || 0}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="New Users Today"
          value={stats?.newUsersToday || 0}
          icon={Users}
          color="bg-cyan-500"
        />
        <StatCard
          title="Posts Today"
          value={stats?.postsToday || 0}
          icon={FileText}
          color="bg-indigo-500"
        />
        <StatCard
          title="Active Sessions"
          value={stats?.activeSessions || 0}
          icon={Activity}
          color="bg-emerald-500"
        />
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pending Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No pending reports</p>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report: any) => (
                <div key={report.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar src={report.reporter_avatar} alt={report.reporter_username} size="sm" />
                      <span className="font-medium text-sm">@{report.reporter_username}</span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {report.reason}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {report.description || 'No description'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topPosts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <img src={post.avatar_url} alt={post.username} className="w-8 h-8 rounded-full" />
                        <span className="text-sm font-medium">{post.full_name || post.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                    </td>
                    <td className="px-4 py-4 text-sm">{post.likes_count}</td>
                    <td className="px-4 py-4 text-sm">{post.comments_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Small stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

