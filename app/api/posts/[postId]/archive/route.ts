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

    // Check if user owns the post
    const post = await pool.query(
      `SELECT user_id FROM posts WHERE id = $1`,
      [params.postId]
    );

    if (post.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Toggle archive status
    const result = await pool.query(
      `UPDATE posts 
       SET is_archived = NOT is_archived 
       WHERE id = $1 
       RETURNING is_archived`,
      [params.postId]
    );

    return NextResponse.json({ 
      archived: result.rows[0].is_archived 
    });
  } catch (error) {
    console.error('Error toggling archive:', error);
    return NextResponse.json({ error: 'Failed to toggle archive' }, { status: 500 });
  }
}