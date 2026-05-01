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

    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM saved_posts WHERE user_id = $1`,
      [session.user.id],
    );

    return NextResponse.json({ count: Number(result.rows[0]?.count || 0) });
  } catch (error) {
    console.error('Error fetching saved count:', error);
    return NextResponse.json({ error: 'Failed to fetch saved count' }, { status: 500 });
  }
}
