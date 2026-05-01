import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = searchParams.get('to') || new Date().toISOString();

    // Get user growth data
    const userGrowth = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [from, to]
    );

    // Get post activity data
    const postActivity = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM posts
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [from, to]
    );

    // Get engagement metrics
    const engagement = await pool.query(`
      SELECT 
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        SUM(shares_count) as total_shares
      FROM posts
      WHERE created_at BETWEEN $1 AND $2
    `, [from, to]);

    // Get top content
    const topPosts = await pool.query(`
      SELECT p.*, u.username, u.full_name, u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.created_at BETWEEN $1 AND $2
      ORDER BY (p.likes_count + p.comments_count * 2 + p.shares_count * 3) DESC
      LIMIT 10
    `, [from, to]);


    const totalUsersRes = await pool.query(
      `SELECT COUNT(*) as total FROM users WHERE created_at BETWEEN $1 AND $2`,
      [from, to]
    );
    const totalPostsRes = await pool.query(
      `SELECT COUNT(*) as total FROM posts WHERE created_at BETWEEN $1 AND $2`,
      [from, to]
    );
    const totalCommentsRes = await pool.query(
      `SELECT COUNT(*) as total FROM comments WHERE created_at BETWEEN $1 AND $2`,
      [from, to]
    );
    const totalLikesRes = await pool.query(
      `SELECT COUNT(*) as total FROM reactions WHERE reaction_type = 'like' AND created_at BETWEEN $1 AND $2`,
      [from, to]
    );

    // Get content type distribution
    const contentDistribution = await pool.query(`
      SELECT 
        'text' as type, COUNT(*) as count
      FROM posts
      WHERE created_at BETWEEN $1 AND $2 AND (media_urls IS NULL OR array_length(media_urls, 1) IS NULL)
      UNION ALL
      SELECT 'image' as type, COUNT(*) as count
      FROM posts
      WHERE created_at BETWEEN $1 AND $2 AND media_urls IS NOT NULL AND array_length(media_urls, 1) > 0
      AND EXISTS (SELECT 1 FROM unnest(media_types) mt WHERE mt = 'image')
      UNION ALL
      SELECT 'video' as type, COUNT(*) as count
      FROM posts
      WHERE created_at BETWEEN $1 AND $2 AND media_urls IS NOT NULL AND array_length(media_urls, 1) > 0
      AND EXISTS (SELECT 1 FROM unnest(media_types) mt WHERE mt = 'video')
    `, [from, to]);

    return NextResponse.json({
      totalUsers: parseInt(totalUsersRes.rows[0].total),
      totalPosts: parseInt(totalPostsRes.rows[0].total),
      totalComments: parseInt(totalCommentsRes.rows[0].total),
      totalLikes: parseInt(totalLikesRes.rows[0].total),
      userGrowth: userGrowth.rows,
      postActivity: postActivity.rows,
      engagement: engagement.rows[0] || { total_likes: 0, total_comments: 0, total_shares: 0 },
      topPosts: topPosts.rows,
      contentDistribution: contentDistribution.rows,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}