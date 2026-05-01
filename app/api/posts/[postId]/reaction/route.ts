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

    const { reaction } = await req.json();

    // Check if reaction exists
    const existing = await pool.query(
      `SELECT 1 FROM reactions 
       WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3`,
      [params.postId, session.user.id, reaction]
    );

    if (existing.rows.length > 0) {
      // Remove reaction
      await pool.query(
        `DELETE FROM reactions 
         WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3`,
        [params.postId, session.user.id, reaction]
      );

      return NextResponse.json({ reacted: false });
    } else {
      // Add reaction
      await pool.query(
        `INSERT INTO reactions (post_id, user_id, reaction_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (post_id, user_id) 
         DO UPDATE SET reaction_type = EXCLUDED.reaction_type`,
        [params.postId, session.user.id, reaction]
      );

      return NextResponse.json({ reacted: true, reaction });
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}