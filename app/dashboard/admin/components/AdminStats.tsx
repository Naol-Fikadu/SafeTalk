'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export function AdminStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: stats?.userGrowth,
      changeIcon: stats?.userGrowth && stats.userGrowth > 0 ? TrendingUp : TrendingDown,
    },
    {
      title: 'New Users Today',
      value: stats?.newUsersToday?.toLocaleString(),
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Total Posts',
      value: stats?.totalPosts?.toLocaleString(),
      icon: FileText,
      color: 'bg-purple-500',
      change: stats?.postGrowth,
      changeIcon: stats?.postGrowth && stats.postGrowth > 0 ? TrendingUp : TrendingDown,
    },
    {
      title: 'Posts Today',
      value: stats?.postsToday?.toLocaleString(),
      icon: FileText,
      color: 'bg-yellow-500',
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports?.toLocaleString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Active Sessions',
      value: stats?.activeSessions?.toLocaleString(),
      icon: Activity,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                {stat.change !== undefined && (
                  <div className={`flex items-center ${
                    stat.change > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <stat.changeIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">
                      {Math.abs(stat.change)}%
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {stat.title}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}