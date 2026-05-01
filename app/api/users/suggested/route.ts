import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Get IDs of users current user is already following
    const followingResult = await pool.query(
      'SELECT following_id FROM follows WHERE follower_id = $1::uuid',
      [currentUserId]
    );
    const followingIds = followingResult.rows.map(row => row.following_id);
    const excludeIds = [currentUserId, ...followingIds];

    // If excludeIds only contains current user, we can use a simple NOT IN with single value
    // but we'll handle the general case with ANY(array) for better type inference
    let suggested;

    // First try mutual followers
    const mutualQuery = `
      WITH user_following AS (
        SELECT following_id FROM follows WHERE follower_id = $1::uuid
      )
      SELECT DISTINCT 
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        COUNT(DISTINCT f2.follower_id) as mutual_followers_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as total_followers
      FROM users u
      JOIN follows f1 ON f1.following_id = u.id
      JOIN user_following uf ON f1.follower_id = uf.following_id
      LEFT JOIN follows f2 ON f2.following_id = u.id
      WHERE u.id != $1::uuid
        AND NOT (u.id = ANY($2::uuid[]))
      GROUP BY u.id
      ORDER BY mutual_followers_count DESC, total_followers DESC
      LIMIT 5
    `;
    const mutualResult = await pool.query(mutualQuery, [currentUserId, excludeIds]);
    
    if (mutualResult.rows.length > 0) {
      suggested = mutualResult.rows;
    } else {
      // Fallback to popular users (most followers)
      const popularQuery = `
        SELECT u.id, u.username, u.full_name, u.avatar_url,
               (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as total_followers
        FROM users u
        WHERE u.id != $1::uuid
          AND NOT (u.id = ANY($2::uuid[]))
        ORDER BY total_followers DESC
        LIMIT 5
      `;
      const popularResult = await pool.query(popularQuery, [currentUserId, excludeIds]);
      suggested = popularResult.rows;
    }

    return NextResponse.json({
      suggested: suggested.map(row => ({
        id: row.id,
        username: row.username,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
      })),
    });
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    return NextResponse.json({ error: 'Failed to fetch suggested users' }, { status: 500 });
  }
}