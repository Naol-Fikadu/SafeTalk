'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Share2,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Pencil } from 'lucide-react';
import { useProfile } from './ProfileContext';
import { useSession } from 'next-auth/react';

export function ProfileSidebar({ user: initialUser }: { user: any }) {
  const { user, setIsEditing } = useProfile();
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === user.id;

  return (

    <div className="space-y-4">
      {/* About Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl shadow-purple-500/5">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold items-center uppercase tracking-wider text-gray-500 dark:text-gray-400 flex">
                <Users className="h-4 w-4 mr-2.5 text-purple-600" />
                About
              </h3>
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 transition-colors"
                  title="Edit bio"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            {user.bio ? (
              <p className="text-[15px] text-gray-700 dark:text-gray-300 mb-6 leading-relaxed font-medium">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic mb-6">No bio yet</p>
            )}

            <div className="space-y-3.5">
              {user.location && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 group hover:text-purple-600 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-3 text-purple-500 group-hover:scale-110 transition-transform" />
                  {user.location}
                </motion.div>
              )}
              {user.website && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 group hover:text-purple-600 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-3 text-purple-500 group-hover:scale-110 transition-transform" />
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 hover:underline transition-colors decoration-2 underline-offset-4"
                  >
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </motion.div>
              )}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400"
              >
                <Calendar className="h-4 w-4 mr-3 text-purple-500" />
                Joined {new Date(user.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl shadow-purple-500/5">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5" />
          <CardContent className="p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center">
              <Share2 className="h-4 w-4 mr-2.5 text-purple-600" />
              Account Info
            </h3>
            <div className="space-y-3.5">
              {/* Account Type */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Account Type</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  user.is_private
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                }`}>
                  {user.is_private ? '🔒 Private' : '🌐 Public'}
                </span>
              </motion.div>

              {/* Verified Status */}
              {user.is_verified && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    ✓ Verified
                  </span>
                </motion.div>
              )}

              {/* Member Since */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Joined</span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </motion.div>

              {/* Username */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Username</span>
                <span className="text-sm font-bold text-purple-600">@{user.username}</span>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}