import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await pool.query(
      `SELECT
         p.*, 
         u.username,
         u.full_name,
         u.avatar_url,
         u.is_verified,
         COALESCE(p.likes_count, 0) as likes_count,
         COALESCE(p.comments_count, 0) as comments_count,
         true as is_saved
       FROM saved_posts sp
       JOIN posts p ON p.id = sp.post_id
       JOIN users u ON u.id = p.user_id
       WHERE sp.user_id = $1 AND p.is_archived = false
       ORDER BY sp.created_at DESC NULLS LAST, p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [session.user.id, limit, offset],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    return NextResponse.json({ error: 'Failed to fetch saved posts' }, { status: 500 });
  }
}
