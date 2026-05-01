import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db/queries';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileTabs } from './components/ProfileTabs';
import { ProfileSidebar } from './components/ProfileSidebar';
import { ProfileStats } from './components/ProfileStats';
import { ProfileProvider } from './components/ProfileContext';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);
  const user = await db.users.findByUsername(params.username);

  if (!user) {
    notFound();
  }

  // Fetch user posts
  const posts = await db.posts.getUserPosts(user.id, session?.user?.id ?? null, 12, 0);
  
  // Fetch followers and following counts
  const followersCount = await db.users.getFollowersCount(user.id);
  const followingCount = await db.users.getFollowingCount(user.id);
  
  // Check if current user is following
  const isFollowing = session ? await db.users.isFollowing(session.user.id, user.id) : false;
  
  // Fetch user's close friends status
  const isCloseFriend = session ? await db.users.isCloseFriend(user.id, session.user.id) : false;

  return (
    <ProfileProvider initialUser={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Profile Header */}
          <ProfileHeader 
            user={user}
            currentUserId={session?.user?.id}
            postsCount={posts.length}
            followersCount={followersCount}
            followingCount={followingCount}
            isFollowing={isFollowing}
            isCloseFriend={isCloseFriend}
          />

          {/* Stats Bar */}
          <ProfileStats 
            postsCount={posts.length}
            followersCount={followersCount}
            followingCount={followingCount}
            userId={user.id}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Sidebar - User Info */}
            <div className="lg:col-span-4">
              <ProfileSidebar user={user} />
            </div>

            {/* Main Content - Posts Tabs */}
            <div className="lg:col-span-8">
              <ProfileTabs 
                userId={user.id}
                username={user.username}
                initialPosts={posts}
                currentUserId={session?.user?.id}
                user={user}
              />
            </div>
          </div>
        </div>
      </div>
    </ProfileProvider>
  );
}