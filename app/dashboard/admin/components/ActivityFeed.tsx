'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  UserPlus,
  FileText,
  MessageCircle,
  Heart,
  Flag,
  Shield,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

interface ActivityItem {
  id: string;
  type: 'user_joined' | 'post_created' | 'comment_added' | 'like_given' | 'report_filed' | 'moderation_action' | 'user_login' | 'user_logout';
  user: {
    username: string;
    avatar_url: string;
  };
  target?: string;
  timestamp: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call
    setActivities([
      {
        id: '1',
        type: 'user_joined',
        user: { username: 'john_doe', avatar_url: '' },
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: '2',
        type: 'post_created',
        user: { username: 'jane_smith', avatar_url: '' },
        target: 'New feature announcement',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: '3',
        type: 'report_filed',
        user: { username: 'moderator', avatar_url: '' },
        target: 'Post #1234',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: '4',
        type: 'moderation_action',
        user: { username: 'admin', avatar_url: '' },
        target: 'User banned',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: '5',
        type: 'user_login',
        user: { username: 'alex_wilson', avatar_url: '' },
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'user_joined':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'post_created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'comment_added':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'like_given':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'report_filed':
        return <Flag className="h-4 w-4 text-yellow-500" />;
      case 'moderation_action':
        return <Shield className="h-4 w-4 text-indigo-500" />;
      case 'user_login':
        return <LogIn className="h-4 w-4 text-cyan-500" />;
      case 'user_logout':
        return <LogOut className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'user_joined':
        return `joined the platform`;
      case 'post_created':
        return `created a new post: ${activity.target}`;
      case 'comment_added':
        return `commented on a post`;
      case 'like_given':
        return `liked a post`;
      case 'report_filed':
        return `reported ${activity.target}`;
      case 'moderation_action':
        return `took moderation action: ${activity.target}`;
      case 'user_login':
        return `logged in`;
      case 'user_logout':
        return `logged out`;
      default:
        return `performed an action`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Activity
          <span className="text-sm font-normal text-gray-500">Live</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3"
            >
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">@{activity.user.username}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getMessage(activity)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}