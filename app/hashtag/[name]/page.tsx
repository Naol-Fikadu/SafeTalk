import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';
import { PostCard } from '@/components/post/PostCard';
import { Hash } from 'lucide-react';

interface HashtagPageProps {
  params: { name: string };
}

async function getHashtagData(name: string) {
  // Get hashtag info
  const hashtagRes = await pool.query(
    'SELECT id, name, posts_count FROM hashtags WHERE name = $1',
    [name]
  );
  if (hashtagRes.rows.length === 0) return null;
  const hashtag = hashtagRes.rows[0];

  // Get posts associated with this hashtag
  const postsRes = await pool.query(
    `SELECT p.*, u.username, u.full_name, u.avatar_url
     FROM posts p
     JOIN users u ON p.user_id = u.id
     JOIN post_hashtags ph ON p.id = ph.post_id
     JOIN hashtags h ON ph.hashtag_id = h.id
     WHERE h.name = $1
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [name]
  );

  return { hashtag, posts: postsRes.rows };
}

export default async function HashtagPage({ params }: HashtagPageProps) {
  const data = await getHashtagData(params.name);

  if (!data) {
    notFound();
  }

  const { hashtag, posts } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Hash className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">#{hashtag.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {hashtag.posts_count} {hashtag.posts_count === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>
        </div>

        {/* Posts list */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500">
              No posts yet with this hashtag.
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}