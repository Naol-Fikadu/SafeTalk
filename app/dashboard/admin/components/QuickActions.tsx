'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  FileText,
  Flag,
  Bell,
  Mail,
  Download,
  Upload,
  RefreshCw,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const actions = [
  { name: 'Add User', icon: Users, href: '/dashboard/admin/users/add', color: 'bg-blue-500' },
  { name: 'New Post', icon: FileText, href: '/dashboard/admin/posts/create', color: 'bg-green-500' },
  { name: 'View Reports', icon: Flag, href: '/dashboard/admin/reports', color: 'bg-red-500', badge: 23 },
  { name: 'Send Broadcast', icon: Bell, href: '/dashboard/admin/notifications/broadcast', color: 'bg-purple-500' },
  { name: 'Email Users', icon: Mail, href: '/dashboard/admin/email', color: 'bg-yellow-500' },
  { name: 'Export Data', icon: Download, href: '/dashboard/admin/export', color: 'bg-indigo-500' },
  { name: 'Import Data', icon: Upload, href: '/dashboard/admin/import', color: 'bg-pink-500' },
  { name: 'Run Report', icon: BarChart3, href: '/dashboard/admin/analytics/run', color: 'bg-orange-500' },
  { name: 'System Update', icon: RefreshCw, href: '/dashboard/admin/system/update', color: 'bg-cyan-500' },
  { name: 'Security Scan', icon: Shield, href: '/dashboard/admin/security/scan', color: 'bg-emerald-500' },
];

export function QuickActions() {
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {actions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={action.href}>
                <div className="relative p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition cursor-pointer group">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs font-medium">{action.name}</p>
                  {action.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {action.badge}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}