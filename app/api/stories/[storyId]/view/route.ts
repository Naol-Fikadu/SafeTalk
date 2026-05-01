import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storyId = params.storyId;
    const userId = session.user.id;

    // Insert view if not exists (ignore conflicts)
    await pool.query(
      `INSERT INTO story_views (story_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (story_id, user_id) DO NOTHING`,
      [storyId, userId]
    );

    // Increment views_count (optional, but keep in sync)
    await pool.query(
      `UPDATE stories SET views_count = (
         SELECT COUNT(*) FROM story_views WHERE story_id = $1
       ) WHERE id = $1`,
      [storyId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking story view:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}