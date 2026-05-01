'use client';

import { motion } from 'framer-motion';
import { Users, Image, Heart, Activity } from 'lucide-react';
import Link from 'next/link';

interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  userId: string;
}

export function ProfileStats({ postsCount, followersCount, followingCount, userId }: ProfileStatsProps) {
  const stats = [
    { 
      label: 'Posts', 
      value: postsCount, 
      icon: Image, 
      color: 'from-blue-500 to-cyan-500',
      href: '#posts'
    },
    { 
      label: 'Followers', 
      value: followersCount, 
      icon: Users, 
      color: 'from-purple-500 to-pink-500',
      href: `/profile/${userId}/followers`
    },
    { 
      label: 'Following', 
      value: followingCount, 
      icon: Users, 
      color: 'from-green-500 to-emerald-500',
      href: `/profile/${userId}/following`
    },
    { 
      label: 'Engagement', 
      value: '98%', 
      icon: Heart, 
      color: 'from-orange-500 to-red-500',
      href: '#engagement'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={stat.href}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700 group cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} group-hover:scale-110 transition`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}