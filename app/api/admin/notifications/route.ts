import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // e.g., 'admin', 'system', 'all'
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(`(n.content ILIKE $${params.length + 1} OR u.username ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (type !== 'all') {
      conditions.push(`n.type = $${params.length + 1}`);
      params.push(type);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Notifications list (joined with user who received it, and optionally actor)
    const query = `
      SELECT 
        n.id,
        n.type,
        n.content,
        n.is_read,
        n.created_at,
        n.user_id,
        u.username as recipient_username,
        u.full_name as recipient_full_name,
        u.avatar_url as recipient_avatar,
        actor.id as actor_id,
        actor.username as actor_username
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN users actor ON n.actor_id = actor.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    const result = await pool.query(query, params);

    return NextResponse.json({
      notifications: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, type = 'admin', targetUserId } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (targetUserId) {
        // Send to a single user
        await client.query(
          `INSERT INTO notifications (user_id, type, actor_id, content)
           VALUES ($1, $2, $3, $4)`,
          [targetUserId, type, session.user.id, content]
        );
      } else {
        // Broadcast to all users (except the admin)
        const usersResult = await client.query(
          `SELECT id FROM users WHERE id != $1`,
          [session.user.id]
        );
        const userIds = usersResult.rows.map(row => row.id);

        for (const userId of userIds) {
          await client.query(
            `INSERT INTO notifications (user_id, type, actor_id, content)
             VALUES ($1, $2, $3, $4)`,
            [userId, type, session.user.id, content]
          );
        }
      }

      // Log action
      await client.query(
        `INSERT INTO admin_logs (admin_id, action, details)
         VALUES ($1, 'send_notification', $2)`,
        [session.user.id, JSON.stringify({ content, type, targetUserId })]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}