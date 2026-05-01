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
    const statusFilter = searchParams.get('status') || 'all';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(p.content ILIKE $${params.length + 1} OR u.username ILIKE $${params.length + 1} OR u.full_name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    // status filter based on reports/is_archived
    if (statusFilter !== 'all') {
      if (statusFilter === 'published') {
        conditions.push(`p.is_archived = false AND NOT EXISTS (SELECT 1 FROM reports r WHERE r.reported_post_id = p.id AND r.status = 'pending')`);
      } else if (statusFilter === 'reported') {
        conditions.push(`EXISTS (SELECT 1 FROM reports r WHERE r.reported_post_id = p.id AND r.status = 'pending')`);
      } else if (statusFilter === 'archived') {
        conditions.push(`p.is_archived = true`);
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get posts with additional data
    const postsResult = await pool.query(
      `SELECT 
        p.id,
        p.content,
        p.created_at,
        p.likes_count,
        p.comments_count,
        p.shares_count,
        p.is_archived,
        u.id as user_id,
        u.username,
        u.full_name,
        u.avatar_url,
        COALESCE(
          (SELECT COUNT(*) FROM reports r WHERE r.reported_post_id = p.id AND r.status = 'pending'),
          0
        ) as reports_count,
        EXISTS(SELECT 1 FROM reports r WHERE r.reported_post_id = p.id AND r.status = 'pending') as is_reported
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const posts = postsResult.rows.map(row => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      shares_count: row.shares_count,
      author: {
        id: row.user_id,
        username: row.username,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
      },
      status: row.is_archived ? 'archived' : (row.is_reported ? 'reported' : 'published'),
      reports_count: row.reports_count,
    }));

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, action } = await req.json();
    if (!postId || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let updateQuery;
      let logDetails = {};

      switch (action) {
        case 'archive':
          updateQuery = `UPDATE posts SET is_archived = true WHERE id = $1 RETURNING *`;
          break;
        case 'unarchive':
          updateQuery = `UPDATE posts SET is_archived = false WHERE id = $1 RETURNING *`;
          break;
        case 'delete':
          updateQuery = `DELETE FROM posts WHERE id = $1 RETURNING *`;
          break;
        case 'approve': // resolve all pending reports on this post
          // Mark all pending reports as resolved
          await client.query(
            `UPDATE reports SET status = 'resolved', resolved_by = $1, resolved_at = NOW() WHERE reported_post_id = $2 AND status = 'pending'`,
            [session.user.id, postId]
          );
          // Also ensure post is not archived
          updateQuery = `UPDATE posts SET is_archived = false WHERE id = $1 RETURNING *`;
          break;
        default:
          throw new Error('Invalid action');
      }

      if (updateQuery) {
        await client.query(updateQuery, [postId]);
      }

      // Log admin action
      await client.query(
        `INSERT INTO admin_logs (admin_id, action, target_post_id, details)
         VALUES ($1, $2, $3, $4)`,
        [session.user.id, action, postId, logDetails]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}