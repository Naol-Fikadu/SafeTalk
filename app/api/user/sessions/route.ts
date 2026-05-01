import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const sessionsResult = await pool.query(
      `SELECT id, device_info, ip_address, last_activity, created_at, expires_at 
       FROM sessions 
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY last_activity DESC`,
      [userId]
    );

    return NextResponse.json({ sessions: sessionsResult.rows });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { sessionId, allDevices } = await request.json();

    // Get current session token from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/) ||
                       cookieHeader.match(/__Secure-next-auth\.session-token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (allDevices) {
      if (token) {
        await pool.query(
          'DELETE FROM sessions WHERE user_id = $1 AND token != $2',
          [userId, token]
        );
      } else {
        await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
      }
    } else if (sessionId) {
      await pool.query(
        'DELETE FROM sessions WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error managing sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}