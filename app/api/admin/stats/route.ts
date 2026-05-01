import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total counts
    const [
      totalUsersResult,
      newUsersTodayResult,
      totalPostsResult,
      postsTodayResult,
      pendingReportsResult,
      activeSessionsResult,
      totalCommentsResult,
      totalReportsResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE created_at::date = CURRENT_DATE"),
      pool.query('SELECT COUNT(*) as count FROM posts'),
      pool.query("SELECT COUNT(*) as count FROM posts WHERE created_at::date = CURRENT_DATE"),
      pool.query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"),
      pool.query("SELECT COUNT(DISTINCT user_id) as count FROM sessions WHERE last_activity > NOW() - INTERVAL '1 hour'"),
      pool.query('SELECT COUNT(*) as count FROM comments'),
      pool.query('SELECT COUNT(*) as count FROM reports'),
    ]);

    // Calculate growth percentages
    const [
      lastWeekUsers,
      lastWeekPosts,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
      pool.query("SELECT COUNT(*) as count FROM posts WHERE created_at > NOW() - INTERVAL '7 days'"),
    ]);

    const previousWeekUsers = await pool.query("SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'");
    const previousWeekPosts = await pool.query("SELECT COUNT(*) as count FROM posts WHERE created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'");

    const userGrowth = previousWeekUsers.rows[0].count > 0 
      ? ((lastWeekUsers.rows[0].count - previousWeekUsers.rows[0].count) / previousWeekUsers.rows[0].count) * 100 
      : 0;
    const postGrowth = previousWeekPosts.rows[0].count > 0 
      ? ((lastWeekPosts.rows[0].count - previousWeekPosts.rows[0].count) / previousWeekPosts.rows[0].count) * 100 
      : 0;

    const stats = {
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      newUsersToday: parseInt(newUsersTodayResult.rows[0].count),
      totalPosts: parseInt(totalPostsResult.rows[0].count),
      postsToday: parseInt(postsTodayResult.rows[0].count),
      pendingReports: parseInt(pendingReportsResult.rows[0].count),
      activeSessions: parseInt(activeSessionsResult.rows[0].count),
      totalComments: parseInt(totalCommentsResult.rows[0].count),
      totalReports: parseInt(totalReportsResult.rows[0].count),
      userGrowth: parseFloat(userGrowth.toFixed(1)),
      postGrowth: parseFloat(postGrowth.toFixed(1)),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}