'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Mail,
  MoreHorizontal,
  UserPlus,
  UserCheck,
  Star,
  Lock,
  Globe,
  MessageCircle,
  Camera,
  Loader2,
  Instagram,
  Twitter,
  Github,
  Facebook,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { FollowButton } from './FollowButton';
import { CloseFriendButton } from './CloseFriendButton';
import { MessageButton } from './MessageButton';
import { toast } from 'react-hot-toast';
import { UploadButton } from '@/lib/uploadthing';
import { useProfile } from './ProfileContext';

interface ProfileHeaderProps {
  user: any;
  currentUserId?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isCloseFriend: boolean;
}

export function ProfileHeader(props: ProfileHeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[500px] w-full bg-white dark:bg-gray-800 rounded-2xl animate-pulse flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return <ProfileHeaderClient {...props} />;
}

function ProfileHeaderClient({
  currentUserId,
  postsCount,
  followersCount,
  followingCount,
  isFollowing,
  isCloseFriend,
}: ProfileHeaderProps) {
  const { update } = useSession();
  const router = useRouter();
  const { user, updateUser, isEditing, setIsEditing } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editLocation, setEditLocation] = useState(user.location || '');
  const [editWebsite, setEditWebsite] = useState(user.website || '');
  const [editFullName, setEditFullName] = useState(user.full_name || '');
  
  const [coverImage, setCoverImage] = useState(user.cover_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200');
  const [avatarImage, setAvatarImage] = useState(user.avatar_url || 'https://i.pravatar.cc/300');
  const [currentFollowers, setCurrentFollowers] = useState(followersCount);
  const isOwnProfile = currentUserId === user.id;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editBio,
          location: editLocation,
          website: editWebsite,
          full_name: editFullName,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      // Optimistically update shared context
      updateUser({
        bio: editBio,
        location: editLocation,
        website: editWebsite,
        full_name: editFullName,
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      router.refresh(); // Sync server data in background
    } catch (error) {
      toast.error('Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Listen for real-time follower count updates
  useEffect(() => {
    if (!user.id || !pusherClient) return;

    const channel = pusherClient.subscribe(`user-profile-${user.id}`);
    
    channel.bind('followers-updated', (data: { count: number }) => {
      setCurrentFollowers(data.count);
    });

    return () => {
      pusherClient.unsubscribe(`user-profile-${user.id}`);
    };
  }, [user.id]);

  const socialLinks = [
    { icon: Instagram, href: '#', color: 'hover:text-pink-600' },
    { icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { icon: Github, href: '#', color: 'hover:text-gray-900 dark:hover:text-white' },
    { icon: Facebook, href: '#', color: 'hover:text-blue-600' },
  ];

const handleFollowToggle = (isFollowing: boolean, newFollowerCount: number) => {
  // Directly set the exact count from the server
  setCurrentFollowers(newFollowerCount);
};
  return (
    <>
      {/* Pre-load avatar for instant lightbox pop */}
      <div className="hidden" aria-hidden="true">
        <Image 
          src={avatarImage} 
          alt="" 
          width={1} 
          height={1} 
          priority 
          unoptimized 
        />
        <Image 
          src={coverImage} 
          alt="" 
          width={1} 
          height={1} 
          priority 
          unoptimized 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
      >
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 group">
        <Image
          src={coverImage}
          alt="Cover"
          fill
          className="object-cover"
          priority
          unoptimized={coverImage?.includes('utfs.io')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {isOwnProfile && (
          <div className="absolute bottom-4 right-4 z-10 scale-90 sm:scale-100">
            <UploadButton
              endpoint="coverUploader"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  setCoverImage(res[0].url);
                  toast.success('Cover image updated!');
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Error: ${error.message}`);
              }}
              content={{
                button({ ready }) {
                  if (ready) return (
                    <div className="flex items-center gap-2">
                       <Camera className="h-4 w-4" />
                       Change Cover
                    </div>
                  );
                  return "Loading...";
                },
              }}
              appearance={{
                button: "bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium transition backdrop-blur-sm border-none shadow-none focus-within:ring-0 after:hidden",
                allowedContent: "hidden",
              }}
            />
          </div>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="px-6 pb-6 relative">
        {/* Main Header Area: Avatar, Name, and Top-Row Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
            {/* LARGE Avatar Display */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer transition hover:opacity-90 active:scale-95">
                      <Avatar
                        src={avatarImage}
                        alt={user.username}
                        size="2xl"
                        className="border-4 border-white dark:border-gray-800 shadow-2xl"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-none overflow-hidden flex items-center justify-center">
                    <div className="relative w-full aspect-square max-h-[85vh] flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center justify-center -z-10">
                        <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                      </div>
                      <Image
                        src={avatarImage}
                        alt={user.username}
                        fill
                        className="object-contain rounded-lg shadow-2xl"
                        priority
                        unoptimized
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                
                {isOwnProfile && (
                  <div className="absolute bottom-1 right-1 z-10">
                    <UploadButton
                      endpoint="avatarUploader"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]) {
                          setAvatarImage(res[0].url);
                          update({ avatar_url: res[0].url }); // Update global session photo
                          toast.success('Profile picture updated!');
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast.error(`Error: ${error.message}`);
                      }}
                      content={{
                        button({ ready }) {
                          if (ready) return <Camera className="h-3 w-3" />;
                          return "...";
                        },
                      }}
                      appearance={{
                        button: "bg-purple-600 text-white p-0 h-6 w-6 min-w-0 rounded-full shadow-lg hover:bg-purple-700 transition transform hover:scale-110 flex items-center justify-center border-none after:hidden",
                        allowedContent: "hidden",
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Social Links under profile picture */}
              <div className="flex items-center space-x-2 mt-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ${social.color} transition transform hover:scale-110`}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Name, Username, and Stats */}
            <div className="pt-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {user.full_name || user.username}
                </h1>
                {user.is_verified && (
                  <Star className="h-5 w-5 text-blue-500 fill-current" />
                )}
                {user.is_private && (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <p className="text-lg text-gray-500 mb-6 font-medium">@{user.username}</p>
              
              {/* Stats Row */}
              <div className="flex items-center justify-center sm:justify-start space-x-8 mt-6">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{currentFollowers}</span>
                  <span className="text-sm text-gray-500 font-medium">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{followingCount}</span>
                  <span className="text-sm text-gray-500 font-medium">Following</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{postsCount}</span>
                  <span className="text-sm text-gray-500 font-medium">Posts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top-Row Action Buttons */}
          <div className="flex items-center space-x-3 mt-8 sm:mt-2">
            {isOwnProfile ? (
              <>
                {/* Edit Profile Modal */}
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full px-6 shadow-sm font-bold text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg overflow-hidden p-0 border-none rounded-3xl shadow-2xl bg-white dark:bg-gray-900">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 w-full" />
                  <DialogHeader className="px-8 pt-8 pb-4">
                    <DialogTitle className="text-2xl font-extrabold tracking-tight">Edit Your Profile</DialogTitle>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Customize how others see you on the platform.</p>
                  </DialogHeader>
                  <div className="px-8 space-y-6 pb-8">
                    {/* Display Name Field */}
                     <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center">
                          <Star className="h-4 w-4 mr-2" /> Display Name
                        </label>
                        <input 
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:border-purple-600 dark:focus:border-purple-600 outline-none transition-all text-sm font-medium"
                        />
                     </div>
                    {/* Bio Field */}
                    <div className="space-y-2">
                       <label className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center">
                         <FileText className="h-4 w-4 mr-2" /> Bio
                       </label>
                       <textarea 
                         value={editBio}
                         onChange={(e) => setEditBio(e.target.value)}
                         placeholder="Tell the world about yourself..."
                         rows={4}
                         className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:border-purple-600 dark:focus:border-purple-600 outline-none transition-all resize-none text-sm font-medium"
                       />
                    </div>
                    {/* Location Field */}
                    <div className="space-y-2">
                       <label className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center">
                         <MapPin className="h-4 w-4 mr-2" /> Location
                       </label>
                       <input 
                         type="text"
                         value={editLocation}
                         onChange={(e) => setEditLocation(e.target.value)}
                         placeholder="New York, USA"
                         className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:border-purple-600 dark:focus:border-purple-600 outline-none transition-all text-sm font-medium"
                       />
                    </div>
                    {/* Website Field */}
                    <div className="space-y-2">
                       <label className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center">
                         <LinkIcon className="h-4 w-4 mr-2" /> Website
                       </label>
                       <input 
                         type="text"
                         value={editWebsite}
                         onChange={(e) => setEditWebsite(e.target.value)}
                         placeholder="https://yourwebsite.com"
                         className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:border-purple-600 dark:focus:border-purple-600 outline-none transition-all text-sm font-medium"
                       />
                    </div>
                    <div className="flex items-center space-x-3 pt-4">
                      <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1 rounded-full font-bold">
                        Cancel
                      </Button>
                      <Button 
                        disabled={isSaving}
                        onClick={handleSaveProfile}
                        className="flex-[2] rounded-full font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg active:scale-95 transition-transform"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="py-2.5">Account Settings</DropdownMenuItem>
                    <DropdownMenuItem className="py-2.5">Archive</DropdownMenuItem>
                    <DropdownMenuItem className="py-2.5">Your Activity</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 py-2.5">Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <FollowButton
                  userId={user.id}
                  initialIsFollowing={isFollowing}
                  onToggle={handleFollowToggle}
                />
                <MessageButton userId={user.id} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {isFollowing && (
                       <DropdownMenuItem className="py-2.5">Add to Close Friends</DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="py-2.5">Report User</DropdownMenuItem>
                    <DropdownMenuItem className="py-2.5">Block User</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 py-2.5">Hide Profile</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {user.bio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50"
          >
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-base md:text-lg">
              {user.bio}
            </p>
          </motion.div>
        )}

        {/* Informational Grid (Location, Website) */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-2 px-1">
          {user.location && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 mr-2.5 text-purple-500" />
              <span className="text-sm font-medium">{user.location}</span>
            </div>
          )}
          {user.website && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <LinkIcon className="h-4 w-4 mr-2.5 text-purple-500" />
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:text-purple-700 hover:underline font-medium transition"
              >
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

      </div>
    </motion.div>
    </>
  );
}