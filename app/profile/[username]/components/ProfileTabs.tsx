'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, Bookmark, Heart, Film, Image as ImageIcon, Video, FileText, Plus, MapPin, Calendar, Link2, Shield, Users, Pencil, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Post } from '@/app/dashboard/user/components/Post';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useProfile } from './ProfileContext';

interface ProfileTabsProps {
  userId: string;
  username: string;
  initialPosts: any[];
  currentUserId?: string;
  user: any;
}

export function ProfileTabs({ userId, username, initialPosts, currentUserId }: ProfileTabsProps) {
  const { user, setIsEditing } = useProfile();
  const [posts, setPosts] = useState(initialPosts);
  const [activeTab, setActiveTab] = useState('posts');

  // Sync state with props when initialPosts changes (e.g., navigating between profiles)
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const reels = useMemo(() => 
    posts.filter(p => p.media_types?.includes('video')),
  [posts]);

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid3x3 },
    { id: 'reels', label: 'Reels', icon: Film, count: reels.length },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'liked', label: 'Liked', icon: Heart },
    { id: 'about', label: 'About', icon: FileText },
  ];

  const mediaTabs = [
    { id: 'all', icon: Grid3x3 },
    { id: 'images', icon: ImageIcon },
    { id: 'videos', icon: Video },
    { id: 'articles', icon: FileText },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Main Tabs */}
      <Tabs defaultValue="posts" className="w-full" onValueChange={setActiveTab}>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <TabsList className="w-full justify-start bg-transparent h-auto p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative flex-1 md:flex-none px-8 py-5 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-purple-600 transition-colors group"
              >
                <div className="flex items-center justify-center">
                  <tab.icon className="h-4 w-4 md:mr-2.5 transition-transform group-hover:scale-110" />
                  <span className="hidden md:inline font-bold tracking-tight">{tab.label}</span>
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Media Type Filters - Only show for posts tab */}
        {activeTab === 'posts' && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <TabsList className="bg-transparent space-x-3">
              {mediaTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 transition-all"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}

        {/* Posts Grid */}
        <TabsContent value="posts" className="p-4">
          {posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg"
                  >
                    {post.media_urls?.[0] ? (
                      <div className="w-full h-full relative">
                        {post.media_types?.[0] === 'video' ? (
                          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                            <Video className="h-12 w-12 text-white/50" />
                            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 backdrop-blur-sm">
                               <Video className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={post.media_urls[0]}
                            alt={post.content || 'Post'}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 p-4 flex flex-col justify-between overflow-hidden group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                        <p className="text-white text-xs md:text-sm font-bold line-clamp-6 leading-relaxed italic">
                          "{post.content}"
                        </p>
                        <div className="flex justify-end">
                           <FileText className="h-4 w-4 text-white/30" />
                        </div>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="flex items-center space-x-6 text-white scale-90 group-hover:scale-100 transition-transform duration-300">
                        <div className="flex items-center font-bold">
                          <Heart className="h-6 w-6 mr-2 fill-white" />
                          <span className="text-lg">{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center font-bold">
                          <MessageCircle className="h-6 w-6 mr-2 fill-white" />
                          <span className="text-lg">{post.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-gray-50 dark:ring-gray-900">
                <ImageIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No posts yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8">
                {userId === currentUserId 
                  ? "Share your first photo or video and start building your story." 
                  : `When @${username} posts, they'll appear here`}
              </p>
              {userId === currentUserId && (
                <Button className="rounded-full px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl shadow-purple-500/20 group">
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
                  Create Your First Post
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Other Tabs Content */}
        <TabsContent value="reels" className="p-4">
          {reels.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              <AnimatePresence>
                {reels.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg"
                  >
                    <img
                      src={post.media_urls?.[0]}
                      alt={post.content || 'Reel'}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="flex items-center space-x-4 text-white">
                        <div className="flex items-center">
                          <Heart className="h-5 w-5 mr-1" />
                          <span>{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <Bookmark className="h-5 w-5 mr-1" />
                          <span>{post.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No reels yet</h3>
              <p className="text-gray-500">Video posts will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          <div className="text-center py-16">
            <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No saved posts</h3>
            <p className="text-gray-500">Posts you save will appear here</p>
          </div>
        </TabsContent>

        {/* Liked Tab */}
        <TabsContent value="liked">
          <div className="text-center py-16">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No liked posts</h3>
            <p className="text-gray-500">Posts you like will appear here</p>
          </div>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Bio Section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-purple-600" />
                  Bio
                </h3>
                {userId === currentUserId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="h-8 px-3 text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full"
                  >
                    <Pencil className="h-3 w-3 mr-1.5" />
                    Edit Bio
                  </Button>
                )}
              </div>
              {user.bio ? (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
              ) : (
                <p className="text-gray-400 italic">
                  {userId === currentUserId
                    ? 'Add a bio to let people know more about you.'
                    : 'This user has not added a bio yet.'}
                </p>
              )}
            </div>

            {/* Details Section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center">
                <Users className="h-4 w-4 mr-2 text-purple-600" />
                Details
              </h3>
              <div className="space-y-4">
                {/* Location */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mr-4">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-0.5">Location</p>
                    {user.location ? (
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.location}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not specified</p>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mr-4">
                    <Link2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-0.5">Website</p>
                    {user.website ? (
                      <a
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors underline-offset-4"
                      >
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not specified</p>
                    )}
                  </div>
                </div>

                {/* Joined */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mr-4">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-0.5">Member Since</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Account type */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mr-4">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-0.5">Account</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {user.is_private ? 'Private' : 'Public'} account
                      </span>
                      {user.is_verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA for own profile */}
            {userId === currentUserId && (
              <div className="pt-4 text-center">
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 py-6 font-bold shadow-lg shadow-purple-500/20"
                >
                  Edit Full Profile
                </Button>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}