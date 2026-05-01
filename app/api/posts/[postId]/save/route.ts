import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collection } = await req.json();

    // Check if already saved
    const existing = await pool.query(
      `SELECT 1 FROM saved_posts 
       WHERE post_id = $1 AND user_id = $2`,
      [params.postId, session.user.id]
    );

    if (existing.rows.length > 0) {
      // Remove from saved
      await pool.query(
        `DELETE FROM saved_posts 
         WHERE post_id = $1 AND user_id = $2`,
        [params.postId, session.user.id]
      );

      return NextResponse.json({ saved: false });
    } else {
      // Save post
      await pool.query(
        `INSERT INTO saved_posts (post_id, user_id, collection_name)
         VALUES ($1, $2, $3)`,
        [params.postId, session.user.id, collection || 'default']
      );

      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Error toggling save:', error);
    return NextResponse.json({ error: 'Failed to toggle save' }, { status: 500 });
  }
}