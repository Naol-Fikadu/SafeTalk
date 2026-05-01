import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { userId: blockedUserId, action } = await request.json();

    if (action === 'block') {
      await pool.query(
        'INSERT INTO blocks (user_id, blocked_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, blockedUserId]
      );
    } else if (action === 'unblock') {
      await pool.query(
        'DELETE FROM blocks WHERE user_id = $1 AND blocked_user_id = $2',
        [userId, blockedUserId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating block status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}