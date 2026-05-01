'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ElementType;
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    setMetrics([
      {
        name: 'Server Uptime',
        value: '99.9%',
        status: 'healthy',
        icon: Server,
      },
      {
        name: 'Database',
        value: 'Connected',
        status: 'healthy',
        icon: Database,
      },
      {
        name: 'CPU Usage',
        value: '45%',
        status: 'healthy',
        icon: Cpu,
      },
      {
        name: 'Memory',
        value: '62%',
        status: 'warning',
        icon: HardDrive,
      },
      {
        name: 'Disk Space',
        value: '78%',
        status: 'warning',
        icon: HardDrive,
      },
      {
        name: 'API Response',
        value: '245ms',
        status: 'healthy',
        icon: Activity,
      },
    ]);
    setLoading(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
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
          System Health
          <span className="text-sm font-normal text-green-500 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
            All Systems Operational
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <metric.icon className="h-5 w-5 text-gray-500" />
                {getStatusIcon(metric.status)}
              </div>
              <p className="text-sm text-gray-500">{metric.name}</p>
              <p className="text-lg font-semibold">{metric.value}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}