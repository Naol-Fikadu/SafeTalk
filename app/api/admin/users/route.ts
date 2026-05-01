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
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(u.username ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR u.full_name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (role !== 'all') {
      conditions.push(`u.is_admin = $${params.length + 1}`);
      params.push(role === 'admin');
    }

    if (status !== 'all') {
      if (status === 'active') {
        conditions.push(`u.is_banned = false`);
      } else if (status === 'banned') {
        conditions.push(`u.is_banned = true`);
      }
      // Note: you may need an `is_banned` column; add if missing
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get users with stats
    const usersResult = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.avatar_url,
        u.created_at,
        u.is_verified,
        u.is_admin,
        COALESCE(u.is_banned, false) as is_banned,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as following_count,
        (SELECT MAX(created_at) FROM sessions WHERE user_id = u.id) as last_active
      FROM users u
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      users: usersResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action, data } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let result;
      let logDetails: any = {};

      switch (action) {
        case 'ban':
          // Ban user
          result = await client.query(
            `UPDATE users SET is_banned = true WHERE id = $1 RETURNING *`,
            [userId]
          );
          logDetails = { banned: true };
          break;

        case 'unban':
          result = await client.query(
            `UPDATE users SET is_banned = false WHERE id = $1 RETURNING *`,
            [userId]
          );
          logDetails = { banned: false };
          break;

        case 'make-admin':
          result = await client.query(
            `UPDATE users SET is_admin = true WHERE id = $1 RETURNING *`,
            [userId]
          );
          logDetails = { is_admin: true };
          break;

        case 'remove-admin':
          result = await client.query(
            `UPDATE users SET is_admin = false WHERE id = $1 RETURNING *`,
            [userId]
          );
          logDetails = { is_admin: false };
          break;

        case 'verify':
          result = await client.query(
            `UPDATE users SET is_verified = true WHERE id = $1 RETURNING *`,
            [userId]
          );
          logDetails = { verified: true };
          break;

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      // Log admin action
      await client.query(
        `INSERT INTO admin_logs (admin_id, action, target_user_id, details)
         VALUES ($1, $2, $3, $4)`,
        [session.user.id, action, userId, logDetails]
      );

      await client.query('COMMIT');

      return NextResponse.json({ success: true, user: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}