'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export function RecentReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/admin/reports?status=resolved&limit=5');
        const data = await response.json();
        setReports(data.reports);
      } catch (error) {
        console.error('Failed to fetch recent reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-center text-gray-500">No recent reports</p>
          ) : (
            reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <Avatar src={report.reporter_avatar} alt={report.reporter_username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">@{report.reporter_username}</span>{' '}
                    reported {report.reported_post ? 'a post' : report.reported_comment ? 'a comment' : 'a user'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Reason: {report.reason}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {report.status}
                </Badge>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}